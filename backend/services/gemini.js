const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
let model = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_api_key') {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('✅ Google Gemini AI initialized');
} else {
  console.log('⚠️  Gemini API key not configured — AI will use mock responses');
}

// System prompts for each action
const PROMPTS = {
  summarize: `You are a professional document summarizer. Analyze the following document content and provide a clear, concise summary. Focus on the key points, main ideas, and important details. Keep the summary well-structured with bullet points where appropriate. Respond in plain text, not markdown.

Document content:
`,
  'fix-grammar': `You are an expert writing editor. Analyze the following document content and provide specific grammar corrections, tone improvements, and writing suggestions. Format your response as a list of suggestions with explanations. Respond in plain text, not markdown.

Document content:
`,
};

// Mock responses when Gemini is not configured
const MOCK_RESPONSES = {
  summarize:
    'This document outlines the Project Roadmap for Q4, covering four main objectives: launching a collaborative editor beta, integrating AI text suggestions via Google Gemini, implementing RBAC for document sharing, and deploying real-time chat with file uploads. The project is structured across four sprints, each targeting a specific feature module for incremental delivery and testing.',
  'fix-grammar':
    'The document is well-structured with clear headings and concise bullet points. A few suggestions:\n\n• Consider adding transition phrases between sections for better flow.\n• "allowing incremental delivery and testing" could be rephrased to "enabling iterative delivery and continuous testing."\n• The Notes section could benefit from more specific details about the implementation approach.\n• Some bullet points end with periods while others do not — maintain consistency.',
};

/**
 * Analyze document content with Gemini AI
 * @param {string} action - 'summarize' or 'fix-grammar'
 * @param {string} content - document text content
 * @param {object} res - Express response (for streaming)
 */
async function analyzeDocument(action, content, res) {
  const prompt = PROMPTS[action];
  if (!prompt) {
    throw new Error(`Unknown action: ${action}`);
  }

  // If Gemini is not configured, stream mock response
  if (!model) {
    const mockText = MOCK_RESPONSES[action] || 'AI analysis not available.';
    return streamMockResponse(mockText, res);
  }

  // Real Gemini streaming
  try {
    const result = await model.generateContentStream(prompt + content);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text, done: false })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Gemini API error:', err.message);
    // Fallback to mock on error
    const mockText = MOCK_RESPONSES[action] || 'AI analysis failed. Please try again.';
    return streamMockResponse(mockText, res);
  }
}

/**
 * Stream mock response character by character
 */
function streamMockResponse(text, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let index = 0;
  const interval = setInterval(() => {
    if (index < text.length) {
      const chunkSize = Math.floor(Math.random() * 6) + 3;
      const chunk = text.slice(index, index + chunkSize);
      res.write(`data: ${JSON.stringify({ text: chunk, done: false })}\n\n`);
      index += chunkSize;
    } else {
      res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
      res.end();
      clearInterval(interval);
    }
  }, 30);
}

module.exports = { analyzeDocument };
