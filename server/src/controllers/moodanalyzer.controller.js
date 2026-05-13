import discoverMovies from "../services/tmdb.services.js";
import analyzeMoodWithHuggingFace from "../services/ai.services.js";

export const analyzeMood = async (req, res) => {
  try {
    const { moodText } = req.body;
    const moodAnalysis = await analyzeMoodWithHuggingFace(moodText);
    console.log("Mood Analysis Result:", moodAnalysis);

    res.json({
      mood: moodAnalysis.mood,
      genresId: moodAnalysis.genres,
      keywords: moodAnalysis.keywords,
      vibe: moodAnalysis.vibe,
    });
  } catch (error) {
    console.error("Error analyzing mood:", error);
    res.status(500).json({ error: "Failed to analyze mood" });
  }
};


export const getMovieRecommendations = async (req, res) => {
    try {
        const { genresId, keywords } = req.query;
        const movieRecommendations = await discoverMovies(genresId, keywords);
        console.log("Movie Recommendations:", movieRecommendations);
        res.json({ recommendations: movieRecommendations });
    } catch (error) {
        console.error("Error getting movie recommendations:", error);
        res.status(500).json({ error: "Failed to get movie recommendations" });
    }
};
