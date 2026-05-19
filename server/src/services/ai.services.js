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
        content: `Taken users input: "${text}". Your goal is to:
- Analyze the user's feelings, tone, and intent
- Understand emotional nuance, not just keywords
- Recommend movie genres, themes, and vibes that fit the user
- Create a cinematic experience tailored to their emotional state

Rules:
1. Always prioritize emotional understanding over literal words.
2. Detect multiple moods if present.
3. Recommendations should feel human, thoughtful, and emotionally relevant.
4. Avoid repetitive genre selection.
5. Match intensity correctly:
   - low energy → calm, comforting, reflective films
   - high energy → action, adventure, hype, thrillers
   - emotional sadness → healing, hopeful, warm movies
6. Do not explain your reasoning unless asked.
7. Keep responses concise and structured.
8. Never recommend inappropriate content for vulnerable emotional states.
9. Focus on entertainment quality and emotional resonance.
10. Return only valid JSON.

Return EXACTLY this format:

{
  "mood": ["2-5 mood adjectives"],
  "genres": [TMDB genre ID numbers],
  "keywords": ["2-4 thematic keywords"],
  "vibe": "one emotionally descriptive sentence"
}

TMDB Genre IDs:
28 = Action
12 = Adventure
16 = Animation
35 = Comedy
80 = Crime
99 = Documentary
18 = Drama
10751 = Family
14 = Fantasy
36 = History
27 = Horror
10402 = Music
9648 = Mystery
10749 = Romance
878 = Science Fiction
53 = Thriller
10752 = War
37 = Western

Return ONLY the JSON object.`,
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
