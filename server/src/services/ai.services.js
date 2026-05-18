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
        content: `Analyze this mood and return ONLY a valid JSON object, no markdown, no explanation:
"${moodText}"
Return EXACTLY this structure:
{
  "mood": [list of 2-5 mood adjectives],
  "genres": [list of 2-4 TMDB genre ID numbers],
  "keywords": ["2-4 thematic keywords for the films e.g. friendship, redemption"],
  "vibe": "one evocative sentence about what kind of film would suit this mood"
}
TMDB genre IDs: 28=Action, 12=Adventure, 16=Animation, 35=Comedy, 80=Crime, 99=Documentary, 18=Drama, 10751=Family, 14=Fantasy, 36=History, 27=Horror, 10402=Music, 9648=Mystery, 10749=Romance, 878=Sci-Fi, 53=Thriller, 10752=War, 37=Western
Return only the JSON object`,
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
