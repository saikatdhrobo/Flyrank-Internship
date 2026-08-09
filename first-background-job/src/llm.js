const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Conditionally initializes the Gemini SDK.
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-gemini-key-here')) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Promisified delay helper.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Evaluates an input query against a decision prompt and returns YES or NO.
 * Supports simulation of execution failures.
 * 
 * @param {string} query 
 * @param {string} nodePrompt 
 * @param {boolean} forceFail 
 * @returns {Promise<string>}
 */
async function evaluateDecision(query, nodePrompt, forceFail = false) {
  if (forceFail) {
    // Artificial processing delay before throwing the simulated failure
    await delay(1000);
    throw new Error('Simulated LLM call failure (triggered by force_fail option).');
  }

  const systemPrompt = `You are a binary classification decision agent. You are evaluating a user query against a criteria prompt.
You must respond with exactly "YES" or "NO" and nothing else. No explanation, no punctuation, no other words.

Criteria: "${nodePrompt}"
Query: "${query}"

Does the query satisfy the criteria? Respond ONLY with "YES" or "NO":`;

  const gemini = getGeminiClient();

  if (gemini) {
    try {
      console.log('[AI Call] Initiating request to Gemini AI...');
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 5,
        }
      });

      const result = response.response.text()?.trim().toUpperCase();
      console.log(`[AI Call] Gemini Response: ${result}`);

      if (result === 'YES' || result === 'NO') {
        return result;
      }
      if (result?.includes('YES')) return 'YES';
      if (result?.includes('NO')) return 'NO';
      
      return 'NO'; // Fallback
    } catch (error) {
      console.error('[AI Call] Gemini evaluation failed, falling back to mock...', error.message);
    }
  }

  // Fallback: Smart Mock keyword matcher
  console.log('[AI Call] Using Mock LLM Fallback (Simulated API call delay)');
  
  // Artificial 1.5 seconds delay to simulate slow operations (essential for background workers!)
  await delay(1500);

  const lowerQuery = query.toLowerCase();
  const lowerPrompt = nodePrompt.toLowerCase();
  let matchFound = false;

  if (lowerPrompt.includes('support') || lowerPrompt.includes('technical') || lowerPrompt.includes('account')) {
    const supportKeywords = ['support', 'help', 'technical', 'bug', 'error', 'broken', 'issue', 'account', 'login', 'work', 'crash', 'fail', 'refund', 'billing', 'subscription'];
    matchFound = supportKeywords.some(keyword => lowerQuery.includes(keyword));
  } else if (lowerPrompt.includes('refund') || lowerPrompt.includes('money') || lowerPrompt.includes('billing')) {
    const refundKeywords = ['refund', 'money back', 'charge', 'billing', 'invoice', 'cancel', 'payment', 'card', 'sub'];
    matchFound = refundKeywords.some(keyword => lowerQuery.includes(keyword));
  } else if (lowerPrompt.includes('sales') || lowerPrompt.includes('pricing') || lowerPrompt.includes('demo') || lowerPrompt.includes('partnership')) {
    const salesKeywords = ['sales', 'price', 'pricing', 'demo', 'buy', 'purchase', 'partnership', 'enterprise', 'licens', 'quote', 'meeting'];
    matchFound = salesKeywords.some(keyword => lowerQuery.includes(keyword));
  } else {
    // Word set intersection logic
    const queryWords = new Set(lowerQuery.match(/\b\w+\b/g) || []);
    const promptWords = lowerPrompt.match(/\b\w+\b/g) || [];
    const stopWords = new Set(['is', 'this', 'a', 'the', 'an', 'or', 'and', 'for', 'to', 'in', 'on', 'with', 'user', 'query', 'asking', 'requesting']);
    const meaningfulWords = promptWords.filter(word => !stopWords.has(word));
    matchFound = meaningfulWords.some(word => queryWords.has(word));
  }

  const result = matchFound ? 'YES' : 'NO';
  console.log(`[AI Call] Mock LLM Result: ${result}`);
  return result;
}

module.exports = {
  evaluateDecision
};
