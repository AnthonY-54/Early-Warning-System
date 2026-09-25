const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Candidate models ordered by priority for automatic fallback
const CANDIDATE_MODELS = Array.from(new Set([
  process.env.GROQ_MODEL,
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b'
].filter(Boolean)));

const FALLBACK_ERROR_MESSAGE = 'Looks like things went south on my side. Unlike you, I am a novice. Let me restart my engines. Go for it again.';

/**
 * Route: POST /api/chatbot/student
 * Protected student chatbot endpoint powered by Groq LLM with function-calling.
 */
router.post('/student', auth, async (req, res) => {
  try {
    console.log('[Chatbot] Incoming request from user:', req.user?.id, 'role:', req.user?.role);

    // 1. Enforce student role
    if (req.user?.role !== 'student') {
      console.warn('[Chatbot] Rejected non-student role:', req.user?.role);
      return res.status(403).json({ message: 'Access denied. Student account required.' });
    }

    // 2. Fetch student profile
    const user = await User.findById(req.user.id);
    if (!user || !user.studentId) {
      console.warn('[Chatbot] No studentId associated with user:', req.user.id);
      return res.status(400).json({ message: 'No student record associated with this account.' });
    }

    const student = await Student.findOne({ student_id: user.studentId });
    if (!student) {
      console.warn('[Chatbot] Student record not found in MongoDB for student_id:', user.studentId);
      return res.status(404).json({ message: 'Student data not found in database.' });
    }

    // Determine current milestone
    const currentMilestone = student.milestones?.find(m => m.stage === student.stage) ||
      student.milestones?.[student.milestones.length - 1] || {};

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

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey.trim() === '' || groqApiKey === 'your_groq_api_key_here') {
      console.warn('[Chatbot] GROQ_API_KEY is missing or unconfigured in backend/.env.');
      return res.json({
        reply: 'Groq API key is missing in backend/.env. Please configure GROQ_API_KEY=<your_key> and restart backend.'
      });
    }

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

    // Helper to invoke Groq API with model fallback list and 15s timeout
    const callGroqWithFallback = async (payloadMessages) => {
      let lastError = null;

      for (const modelId of CANDIDATE_MODELS) {
        try {
          console.log(`[Chatbot] Invoking Groq model: ${modelId}...`);
          const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqApiKey.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelId,
              messages: payloadMessages,
              tools: tools,
              tool_choice: 'auto'
            }),
            signal: AbortSignal.timeout(15000)
          });

          if (!response.ok) {
            const errText = await response.text();
            console.warn(`[Chatbot] Model ${modelId} returned HTTP ${response.status}: ${errText}`);
            // If model error / not found, loop to next candidate model
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
    };

    let { data: groqData } = await callGroqWithFallback(messages);
    let choice = groqData?.choices?.[0];
    let responseMessage = choice?.message;

    // Handle tool call if requested by LLM
    if (responseMessage && responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function?.name === 'getFullStudentRecord') {
        console.log('[Chatbot] Tool call requested: getFullStudentRecord');
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

        const { data: secondResponseData } = await callGroqWithFallback(updatedMessages);
        choice = secondResponseData?.choices?.[0];
        responseMessage = choice?.message;
      }
    }

    const reply = responseMessage?.content || FALLBACK_ERROR_MESSAGE;
    return res.json({ reply });

  } catch (error) {
    console.error('[Chatbot] Error processing request:', error.message);
    const diagnosticReply = process.env.NODE_ENV === 'production'
      ? FALLBACK_ERROR_MESSAGE
      : `Chatbot Error: ${error.message}`;
    return res.json({ reply: diagnosticReply });
  }
});

module.exports = router;