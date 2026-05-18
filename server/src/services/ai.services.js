import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const getGroqChatCompletion = async (text) => {
  const completion = await groq.chat.completions.create({
    messages: [
      // Set an optional system message. This sets the behavior of the
      // assistant and can be used to provide specific instructions for
      // how it should behave throughout the conversation.
      {
        role: "system",
        content: "You are CineMood AI, an intelligent movie recommendation assistant that understands human emotions and suggests films that match the user’s current mood, energy, and emotional state.",
      },
      // Set a user message for the assistant to respond to.
      {
        role: "user",
        content: `Analyze the user's emotional state and movie preference from the text below. User mood: "${text}" Return ONLY a valid JSON object. Do NOT include markdown. Do NOT include explanations. Do NOT include extra text. Return EXACTLY this structure: { "mood": ["2-5 emotional adjectives describing the user's state"], "genres": [2-4 TMDB genre ID numbers], "keywords": ["2-4 simple, common movie themes"], "vibe": "one short evocative sentence about what kind of film would suit this mood" } IMPORTANT RULES FOR KEYWORDS: - Use ONLY broad cinematic themes commonly found in movies. - Avoid abstract emotions or poetic phrases. - Avoid niche, obscure, or highly specific words. - Avoid words unlikely to exist as TMDB keywords. - Prefer universal themes used across many films. GOOD keyword examples: ["love", "friendship", "family", "revenge", "betrayal", "coming of age", "redemption", "marriage", "holiday", "road trip", "small town", "music", "school", "crime"] BAD keyword examples: ["melancholic yearning", "emotional healing", "dreamcore nostalgia", "gentle sadness", "human connection"] TMDB Genre IDs: 28=Action, 12=Adventure, 16=Animation, 35=Comedy, 80=Crime, 99=Documentary, 18=Drama, 10751=Family, 14=Fantasy, 36=History, 27=Horror, 10402=Music, 9648=Mystery, 10749=Romance, 878=Sci-Fi, 53=Thriller, 10752=War, 37=Western Prioritize genres over keywords for recommendation accuracy. Return ONLY the JSON object.`,
      },
    ],
    model: "openai/gpt-oss-20b",
  });

  const cleanText = completion.choices[0]?.message?.content || ""
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanText);
};

export default getGroqChatCompletion;
