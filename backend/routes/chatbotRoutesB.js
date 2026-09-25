const express = require('express');
const router = express.Router();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

/**
 * MODULE B — Step 1: Bare-bones Groq relay.
 * No auth, no DB, no context injection, no tool calling.
 * Just forward the user's message to Groq and return the reply.
 */
router.post('/student', async (req, res) => {
  try {
    const userMessage = req.body.message || '';
    console.log('[ChatbotB] Received message:', userMessage);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
      console.error('[ChatbotB] GROQ_API_KEY is missing.');
      return res.json({ reply: 'Error: GROQ_API_KEY is not configured in backend/.env' });
    }

    console.log('[ChatbotB] Calling Groq API with model:', GROQ_MODEL);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: userMessage }]
      }),
      signal: AbortSignal.timeout(15000)
    });

    console.log('[ChatbotB] Groq HTTP status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ChatbotB] Groq error body:', errText);
      return res.json({ reply: `Groq API error (HTTP ${response.status}): ${errText}` });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 'No response from AI.';
    console.log('[ChatbotB] Got reply, length:', reply.length);

    return res.json({ reply });

  } catch (error) {
    console.error('[ChatbotB] Caught error:', error.message);
    return res.json({ reply: `Backend error: ${error.message}` });
  }
});

module.exports = router;
