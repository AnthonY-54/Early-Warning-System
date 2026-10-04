const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const { 
  getCurrentMilestone, 
  getCohortSummary, 
  getStudentsByFilter 
} = require('../utils/cohortUtils');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Candidate models ordered by priority for automatic fallback
const CANDIDATE_MODELS = Array.from(new Set([
  process.env.GROQ_MODEL,
  'llama-3.3-70b-versatile',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b'
].filter(Boolean)));

const FALLBACK_ERROR_MESSAGE = 'Looks like things went south on my side. Unlike you, I am a newbie in job. Let me restart my engines. Go for it again.';

/**
 * Helper to invoke Groq API with candidate model fallback and 15s timeout
 */
async function callGroqWithFallback(payloadMessages, tools = null) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey.trim() === '' || groqApiKey === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is missing or unconfigured in backend/.env.');
  }

  let lastError = null;

  for (const modelId of CANDIDATE_MODELS) {
    try {
      console.log(`[Chatbot] Invoking Groq model: ${modelId}...`);
      const body = {
        model: modelId,
        messages: payloadMessages
      };

      if (tools && tools.length > 0) {
        body.tools = tools;
        body.tool_choice = 'auto';
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Chatbot] Model ${modelId} returned HTTP ${response.status}: ${errText}`);
        lastError = new Error(`Groq HTTP ${response.status}: ${errText}`);
        continue;
      }

      const data = await response.json();
      return { data, usedModel: modelId };
    } catch (err) {
      console.warn(`[Chatbot] Model ${modelId} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All candidate Groq models failed.');
}

/**
 * Route: POST /api/chatbot/student
 * Protected student chatbot endpoint powered by Groq LLM with function-calling.
 */
router.post('/student', auth, async (req, res) => {
  try {
    console.log('[Chatbot Student] Incoming request from user:', req.user?.id, 'role:', req.user?.role);

    // 1. Enforce student role
    if (req.user?.role !== 'student') {
      console.warn('[Chatbot Student] Rejected non-student role:', req.user?.role);
      return res.status(403).json({ message: 'Access denied. Student account required.' });
    }

    // 2. Fetch student profile
    const user = await User.findById(req.user.id);
    if (!user || !user.studentId) {
      console.warn('[Chatbot Student] No studentId associated with user:', req.user.id);
      return res.status(400).json({ message: 'No student record associated with this account.' });
    }

    const student = await Student.findOne({ student_id: user.studentId });
    if (!student) {
      console.warn('[Chatbot Student] Student record not found in MongoDB for student_id:', user.studentId);
      return res.status(404).json({ message: 'Student data not found in database.' });
    }

    // Determine current milestone
    const currentMilestone = getCurrentMilestone(student);

    // Build scoped summary context
    const summaryContext = {
      name: student.name,
      course: student.course,
      stage: student.stage,
      risk_level: currentMilestone.risk_level,
      confidence: currentMilestone.confidence,
      weakTopic: student.weakTopic,
      top_reasons: currentMilestone.top_reasons,
      engagement: {
        clicks: currentMilestone.total_clicks,
        active_days: currentMilestone.active_days,
        resources_viewed: currentMilestone.resources_accessed
      }
    };

    // Extract message history from request body
    const userMessages = Array.isArray(req.body.messages) ? req.body.messages : [];

    // System prompt with guardrails and context
    const systemPrompt = {
      role: 'system',
      content: `You are an academic assistant for the student, using the injected summary data to answer questions about their own risk, performance, and feedback.
You must ONLY answer education/academic-performance-related questions for this student. For anything off-topic, politely decline and redirect (e.g., "I can only help with your academic progress and risk status — ask me about that!").
You have a summary of the student's data. If a question requires detail beyond the summary (e.g., a specific milestone's exact score, a specific stage's raw metrics, or full historical timeline), you MUST call the getFullStudentRecord tool rather than guessing or hallucinating.

Student Summary Context:
${JSON.stringify(summaryContext, null, 2)}`
    };

    // Tools definition
    const tools = [
      {
        type: 'function',
        function: {
          name: 'getFullStudentRecord',
          description: 'Fetch complete historical academic record, all milestone scores, raw metrics, and detailed profile information for this student when detail beyond the summary is needed.',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      }
    ];

    const messages = [systemPrompt, ...userMessages];

    let { data: groqData } = await callGroqWithFallback(messages, tools);
    let choice = groqData?.choices?.[0];
    let responseMessage = choice?.message;

    // Handle tool call if requested by LLM
    if (responseMessage && responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function?.name === 'getFullStudentRecord') {
        console.log('[Chatbot Student] Tool call requested: getFullStudentRecord');
        const fullRecord = {
          id: student.student_id,
          name: student.name,
          course: student.course || "General Studies",
          stage: student.stage || "40%",
          probability: currentMilestone.probability !== undefined ? currentMilestone.probability : 0,
          engagement: {
            clicks: currentMilestone.total_clicks || 0,
            active_days: currentMilestone.active_days || 0,
            resources_viewed: currentMilestone.resources_accessed || 0
          },
          performance_timeline: (student.milestones || []).map(m => ({
            stage: m.stage,
            score: m.assessment_score !== undefined ? m.assessment_score : 0,
            days_late: m.days_late || 0,
            clicks: m.total_clicks || 0,
            active_days: m.active_days || 0,
            resources_viewed: m.resources_accessed || 0,
            risk: m.risk_level || 'Green'
          })),
          weakTopic: student.weakTopic || "None",
          risk_level: currentMilestone.risk_level || "Green",
          confidence: currentMilestone.confidence !== undefined ? currentMilestone.confidence : 0.80,
          top_reasons: currentMilestone.top_reasons || [],
          demographics: {
            gender: student.gender,
            region: student.region,
            highest_education: student.highest_education,
            imd_band: student.imd_band,
            age_band: student.age_band,
            studied_credits: student.studied_credits
          }
        };

        const updatedMessages = [
          ...messages,
          responseMessage,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(fullRecord)
          }
        ];

        const { data: secondResponseData } = await callGroqWithFallback(updatedMessages, tools);
        choice = secondResponseData?.choices?.[0];
        responseMessage = choice?.message;
      }
    }

    const reply = responseMessage?.content || FALLBACK_ERROR_MESSAGE;
    return res.json({ reply });

  } catch (error) {
    console.error('[Chatbot Student] Error processing request:', error.message);
    const diagnosticReply = process.env.NODE_ENV === 'production'
      ? FALLBACK_ERROR_MESSAGE
      : (error.message.includes('GROQ_API_KEY') ? error.message : FALLBACK_ERROR_MESSAGE);
    return res.json({ reply: diagnosticReply });
  }
});

/**
 * Route: POST /api/chatbot/teacher
 * Protected teacher chatbot endpoint powered by Groq LLM with function-calling.
 */
router.post('/teacher', auth, async (req, res) => {
  try {
    console.log('[Chatbot Teacher] Incoming request from user:', req.user?.id, 'role:', req.user?.role);

    // 1. Enforce teacher role
    if (req.user?.role !== 'teacher') {
      console.warn('[Chatbot Teacher] Rejected non-teacher role:', req.user?.role);
      return res.status(403).json({ message: 'Access denied. Teacher account required.' });
    }

    // 2. Fetch minimal roster index only (name and ID only, no stats/metrics)
    const studentsRoster = await Student.find({}, 'student_id name');
    const rosterIndex = studentsRoster.map(s => ({
      id: s.student_id,
      name: s.name
    }));

    const rosterText = rosterIndex.length > 0
      ? rosterIndex.map(s => `- [ID: ${s.id}] ${s.name}`).join('\n')
      : 'No students currently enrolled.';

    // 3. Construct Teacher System Prompt with guardrails and privacy notice
    const systemPrompt = {
      role: 'system',
      content: `You are an academic assistant for the logged-in teacher, helping them understand their students' risk status, performance, and engagement, and suggesting interventions when asked.
You must use the provided tools (getStudentDetails, getCohortSummary, getStudentsByFilter) to fetch real, authoritative data rather than guessing or hallucinating values. If a tool returns "not found" or insufficient data, say so plainly rather than inventing answers.

Guardrails:
- You must ONLY answer questions related to this teacher's students, cohort, and academic matters.
- For anything off-topic, politely decline and redirect (e.g., "I can only help with your students' academic progress and risk status — ask me about that!").

Privacy Safeguards:
- Any teacher notes returned by getStudentDetails belong solely to the logged-in teacher.
- You must never claim knowledge of another teacher's notes, and must never imply you have access to any notes beyond what is explicitly returned to you in this session.

Roster Index (Students currently in your cohort):
${rosterText}`
    };

    // 4. Define Teacher Tools
    const tools = [
      {
        type: 'function',
        function: {
          name: 'getStudentDetails',
          description: 'Fetch detailed academic record, risk status, engagement metrics, class averages baseline, and the logged-in teacher\'s private notes for a specific student.',
          parameters: {
            type: 'object',
            properties: {
              name_or_id: {
                type: 'string',
                description: 'The student ID (e.g. S101) or name of the student.'
              }
            },
            required: ['name_or_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getCohortSummary',
          description: 'Fetch aggregate cohort statistics including total student count, risk distribution counts (Green, Yellow, Red, Black), at-risk percentage, and class averages.',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getStudentsByFilter',
          description: 'Filter cohort students by course name and/or current risk level (Green, Yellow, Red, Black). Returns a concise list of matching student IDs, names, courses, and risk levels.',
          parameters: {
            type: 'object',
            properties: {
              course: {
                type: 'string',
                description: 'Optional course title or code to filter by (e.g., "Cyber Security Principles" or "BBB").'
              },
              risk_level: {
                type: 'string',
                enum: ['Green', 'Yellow', 'Red', 'Black'],
                description: 'Optional risk level to filter by.'
              }
            },
            required: []
          }
        }
      }
    ];

    // Extract message history
    const userMessages = Array.isArray(req.body.messages) ? req.body.messages : [];
    let currentMessages = [systemPrompt, ...userMessages];

    // Tool execution loop (supports up to 3 turns of tool calling)
    let turns = 0;
    const maxTurns = 3;
    let finalReply = null;

    while (turns < maxTurns) {
      turns++;
      const { data: groqData } = await callGroqWithFallback(currentMessages, tools);
      const choice = groqData?.choices?.[0];
      const responseMessage = choice?.message;

      if (!responseMessage) {
        break;
      }

      currentMessages.push(responseMessage);

      // Check if tool calls were requested
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          const fnName = toolCall.function?.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(toolCall.function?.arguments || '{}');
          } catch (e) {
            console.warn('[Chatbot Teacher] Failed to parse tool arguments:', toolCall.function?.arguments);
          }

          console.log(`[Chatbot Teacher] Executing tool: ${fnName}`, fnArgs);
          let toolResult = null;

          if (fnName === 'getStudentDetails') {
            const query = (fnArgs.name_or_id || '').trim().toLowerCase();
            let matched = rosterIndex.find(s => s.id.toLowerCase() === query);
            if (!matched) {
              matched = rosterIndex.find(s => s.name.toLowerCase() === query);
            }
            if (!matched) {
              matched = rosterIndex.find(s => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query));
            }

            if (!matched) {
              toolResult = {
                error: 'not_found',
                message: `Student '${fnArgs.name_or_id}' was not found in the cohort roster.`
              };
            } else {
              const studentDoc = await Student.findOne({ student_id: matched.id });
              if (!studentDoc) {
                toolResult = {
                  error: 'not_found',
                  message: `Student record '${matched.id}' not found in database.`
                };
              } else {
                const milestone = getCurrentMilestone(studentDoc);
                // Strict teacher note privacy: filter strictly by teacher_id: req.user.id
                const notes = await Note.find({
                  student_id: studentDoc.student_id,
                  teacher_id: req.user.id
                }).sort({ createdAt: -1 });

                const cohortData = await getCohortSummary();

                toolResult = {
                  id: studentDoc.student_id,
                  name: studentDoc.name,
                  course: studentDoc.course || 'N/A',
                  stage: studentDoc.stage || '40%',
                  risk_level: milestone.risk_level || 'Green',
                  confidence: milestone.confidence !== undefined ? milestone.confidence : 0.80,
                  top_reasons: milestone.top_reasons || [],
                  weakTopic: studentDoc.weakTopic || 'None',
                  engagement: {
                    total_clicks: milestone.total_clicks || 0,
                    active_days: milestone.active_days || 0,
                    resources_accessed: milestone.resources_accessed || 0
                  },
                  teacher_notes: notes.map(n => ({
                    text: n.text,
                    createdAt: n.createdAt
                  })),
                  classAverages: cohortData.classAverages
                };
              }
            }
          } else if (fnName === 'getCohortSummary') {
            toolResult = await getCohortSummary();
          } else if (fnName === 'getStudentsByFilter') {
            toolResult = await getStudentsByFilter({
              course: fnArgs.course,
              risk_level: fnArgs.risk_level
            });
          } else {
            toolResult = { error: 'unknown_tool', message: `Unknown tool '${fnName}'.` };
          }

          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        }
        // Continue loop to get LLM's response incorporating tool results
      } else {
        // No more tool calls; we have the final assistant message
        finalReply = responseMessage.content;
        break;
      }
    }

    const reply = finalReply || FALLBACK_ERROR_MESSAGE;
    return res.json({ reply });

  } catch (error) {
    console.error('[Chatbot Teacher] Error processing request:', error.message);
    const diagnosticReply = process.env.NODE_ENV === 'production'
      ? FALLBACK_ERROR_MESSAGE
      : (error.message.includes('GROQ_API_KEY') ? error.message : FALLBACK_ERROR_MESSAGE);
    return res.json({ reply: diagnosticReply });
  }
});

module.exports = router;