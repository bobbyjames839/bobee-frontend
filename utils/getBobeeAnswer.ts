import fetch from 'cross-fetch'

export const getBobeeAnswer = async (
  userId: string,
  question: string,
  userMetrics?: Record<string, any>,
  pastMessages?: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ answer: string; reasoning?: string; followup?: string }> => {
  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY
  if (!question || !question.trim()) {
    throw new Error('Question is required')
  }

  const systemPrompt = `
You are Bobee, a personal advisor and emotionally intelligent assistant.

Your goal is to help the user improve their life and understand themselves better. You know:
- A list of facts about the user (as system content).
- The full conversation history (as messages).

Instructions:
1. If the user writes something vague or doesn't ask a question, respond with a helpful nudge to get them to ask a clear question. Only return:
  { "answer": "..." }

2. If the user asks a question, respond with:
  {
    "answer": "your main advice or response",
    "reasoning": "why you gave that advice, referencing user facts when helpful",
    "followup": "ask the user for more info to improve future advice"
  }

Always respond with only valid JSON.
`


 const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt.trim() },
  ]

  if (userMetrics) {
    messages.push({
      role: 'system',
      content: `User info:\n${JSON.stringify(userMetrics, null, 2)}`,
    })
  }

  if (pastMessages && pastMessages.length > 0) {
    messages.push(...pastMessages)
  }

  messages.push({ role: 'user', content: question.trim() })

  const payload = {
    model: 'gpt-4.1-mini',
    temperature: 0.7,
    messages,
  }

  console.log('Sending to OpenAI:', JSON.stringify(payload, null, 2))

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`OpenAI returned ${res.status}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty AI response')
  }

let parsed: { answer: string; reasoning?: string; followup?: string }
  try {
    parsed = JSON.parse(content)
  } catch (jsonErr) {
    console.error('Failed to parse JSON:', jsonErr, '\nContent:', content)
    throw new Error('Malformed AI JSON response')
  }

return {
  answer: parsed.answer || '',
  reasoning: parsed.reasoning,
  followup: parsed.followup,
}
}