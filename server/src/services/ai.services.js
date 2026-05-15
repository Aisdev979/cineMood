import { InferenceClient, InferenceClientProviderApiError } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

async function analyzeMoodWithHuggingFace(moodText) {
  const chatCompletion = await client.chatCompletion({
    model: (e) ? "meta-llama/Llama-3.1-8B-Instruct:cerebras" : "meta-llama/Llama-3.1-8B-Instruct",
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content:
          "You are a creative and skilled text analyst who can read a user's mood and preferences from a short text description and translate that into a specific set of film recommendations. You understand the nuances of human emotions and how they relate to different film genres, themes, and vibes. Your task is to analyze the user's mood and return a structured JSON object that captures the essence of what kind of films would suit their current emotional state.",
      },
      {
        role: "user",
        content: `Analyze the user's emotional state and movie preference from the text below.

User mood:
"${moodText}"

Return ONLY a valid JSON object.
Do NOT include markdown.
Do NOT include explanations.
Do NOT include extra text.

Return EXACTLY this structure:
{
  "mood": ["2-5 emotional adjectives"],
  "genres": [2-4 TMDB genre ID numbers],
  "keywords": ["2-4 simple, common movie themes"],
  "vibe": "one short evocative sentence"
}

IMPORTANT RULES FOR KEYWORDS:
- Use ONLY broad cinematic themes commonly found in movies.
- Avoid abstract emotions or poetic phrases.
- Avoid niche, obscure, or highly specific words.
- Avoid words unlikely to exist as TMDB keywords.
- Prefer universal themes used across many films.

GOOD keyword examples:
["love", "friendship", "family", "revenge", "betrayal", "coming of age", "redemption", "marriage", "holiday", "road trip", "small town", "music", "school", "crime"]

BAD keyword examples:
["melancholic yearning", "emotional healing", "dreamcore nostalgia", "gentle sadness", "human connection"]

TMDB Genre IDs:
28=Action
12=Adventure
16=Animation
35=Comedy
80=Crime
99=Documentary
18=Drama
10751=Family
14=Fantasy
36=History
27=Horror
10402=Music
9648=Mystery
10749=Romance
878=Sci-Fi
53=Thriller
10752=War
37=Western

Prioritize genres over keywords for recommendation accuracy.

Return ONLY the JSON object.`,
      },
    ],
  });

  const cleanText = chatCompletion.choices[0].message.content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleanText);
  return parsed;
}

InferenceClientProviderApiError.prototype.toJSON = function () {
  return {
    name: this.name,
    message: this.message,
    stack: this.stack,
  };
};

export default analyzeMoodWithHuggingFace;