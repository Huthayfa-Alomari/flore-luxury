// OpenAI API wrapper for FLORÉ Concierge
// In production, replace with actual OpenAI API calls

export async function generateResponse(messages: { role: string; content: string }[]) {
  // Mock implementation - replace with real OpenAI integration
  const lastMessage = messages[messages.length - 1].content

  return {
    reply: `شكراً لسؤالك! (هذه رد تجريبي - قم بربط OpenAI API للحصول على ردود ذكية حقيقية)`,
  }
}