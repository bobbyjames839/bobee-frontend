import fetch from 'cross-fetch'

/**
 * Generates a concise title (max 6 words) for a user–AI conversation.
 *
 * @param userId – the authenticated user’s ID
 * @param conversationText – the full transcript, formatted as numbered Q/A lines
 * @returns the title string
 */
export const getConversationTitle = async (
  userId: string,
  conversationText: string
): Promise<string> => {
  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY
  if (!conversationText || !conversationText.trim()) {
    throw new Error('Conversation text is required for titling')
  }

  // Instruct the model to return only valid JSON with a single "title" field.
  const systemPrompt = `
You are Bobee’s Title Generator.  
Your only task is to read a user–AI chat transcript and produce a very short (max 6 words) descriptive title.  
Respond with exactly and only:
  { "title": "..." }
`

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt.trim() },
    { role: 'user', content: conversationText.trim() },
  ]

  const payload = {
    model: 'gpt-4.1-mini',
    temperature: 0.3,
    messages,
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from OpenAI')
  }

  let parsed: { title: string }
  try {
    parsed = JSON.parse(content)
  } catch (err) {
    console.error('Failed to parse title JSON:', err, '\nAI response:', content)
    throw new Error('Malformed JSON in title response')
  }

  if (!parsed.title || typeof parsed.title !== 'string') {
    throw new Error('AI did not return a valid title')
  }

  return parsed.title.trim()
}
