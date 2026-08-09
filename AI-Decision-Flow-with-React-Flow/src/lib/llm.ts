import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize SDKs conditionally
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your-openai-key-here')) {
    return null;
  }
  return new OpenAI({ apiKey });
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-gemini-key-here')) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Evaluates an input query against a decision prompt and returns YES or NO.
 */
export async function evaluateDecision(
  query: string,
  nodePrompt: string
): Promise<'YES' | 'NO'> {
  const systemPrompt = `You are a binary classification decision agent. You are evaluating a user query against a criteria prompt.
You must respond with exactly "YES" or "NO" and nothing else. No explanation, no punctuation, no other words.

Criteria: "${nodePrompt}"
Query: "${query}"

Does the query satisfy the criteria? Respond ONLY with "YES" or "NO":`;

  // 1. Try OpenAI
  const openai = getOpenAIClient();
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0,
        max_tokens: 5,
      });
      const result = response.choices[0]?.message?.content?.trim().toUpperCase();
      if (result === 'YES' || result === 'NO') {
        return result;
      }
      if (result?.includes('YES')) return 'YES';
      if (result?.includes('NO')) return 'NO';
    } catch (e) {
      console.error('OpenAI decision execution failed, trying Gemini or Mock...', e);
    }
  }

  // 2. Try Gemini
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 5,
        }
      });
      const result = response.response.text()?.trim().toUpperCase();
      if (result === 'YES' || result === 'NO') {
        return result;
      }
      if (result?.includes('YES')) return 'YES';
      if (result?.includes('NO')) return 'NO';
    } catch (e) {
      console.error('Gemini decision execution failed, trying Mock...', e);
    }
  }

  // 3. Smart Mock Fallback (Keyword Analysis)
  // Let's do a smart regex-based text matcher that checks if keywords in the prompt exist in the query.
  // This makes the project fully testable without API keys!
  console.log('Using Mock LLM Fallback for evaluation.');
  const lowerQuery = query.toLowerCase();
  const lowerPrompt = nodePrompt.toLowerCase();

  // Basic word extraction and semantic intersection mapping
  const rules = [
    {
      keywords: ['refund', 'money back', 'billing', 'cancel', 'subscription', 'price', 'charge'],
      category: 'refund'
    },
    {
      keywords: ['support', 'help', 'technical', 'bug', 'error', 'broken', 'issue', 'account', 'login'],
      category: 'support'
    },
    {
      keywords: ['sales', 'pricing', 'demo', 'purchase', 'buy', 'business', 'partnership', 'enterprise', 'license'],
      category: 'sales'
    }
  ];

  // Match based on custom criteria rules or fallback to simple token overlaps
  let matchFound = false;

  // Let's examine what the prompt is asking
  if (lowerPrompt.includes('support') || lowerPrompt.includes('technical') || lowerPrompt.includes('account')) {
    // Is it checking if it is a support request?
    const supportKeywords = ['support', 'help', 'technical', 'bug', 'error', 'broken', 'issue', 'account', 'login', 'work', 'crash', 'fail', 'refund', 'billing', 'subscription'];
    matchFound = supportKeywords.some(keyword => lowerQuery.includes(keyword));
  } else if (lowerPrompt.includes('refund') || lowerPrompt.includes('money') || lowerPrompt.includes('billing')) {
    // Is it checking for refund?
    const refundKeywords = ['refund', 'money back', 'charge', 'billing', 'invoice', 'cancel', 'payment', 'card', 'sub'];
    matchFound = refundKeywords.some(keyword => lowerQuery.includes(keyword));
  } else if (lowerPrompt.includes('sales') || lowerPrompt.includes('pricing') || lowerPrompt.includes('demo') || lowerPrompt.includes('partnership')) {
    // Is it checking for sales?
    const salesKeywords = ['sales', 'price', 'pricing', 'demo', 'buy', 'purchase', 'partnership', 'enterprise', 'licens', 'quote', 'meeting'];
    matchFound = salesKeywords.some(keyword => lowerQuery.includes(keyword));
  } else {
    // General keyword matching: does the query contain words from the prompt?
    const queryWords = new Set(lowerQuery.match(/\b\w+\b/g) || []);
    const promptWords = lowerPrompt.match(/\b\w+\b/g) || [];
    // Filter out common stop words
    const stopWords = new Set(['is', 'this', 'a', 'the', 'an', 'or', 'and', 'for', 'to', 'in', 'on', 'with', 'user', 'query', 'asking', 'requesting']);
    const meaningfulPromptWords = promptWords.filter(word => !stopWords.has(word));
    
    // Check if at least one meaningful prompt word is in the query
    matchFound = meaningfulPromptWords.some(word => queryWords.has(word));
  }

  // Artificial delay to mimic API calls
  await new Promise(resolve => setTimeout(resolve, 800));

  return matchFound ? 'YES' : 'NO';
}
