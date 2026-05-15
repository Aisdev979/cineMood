import { discoverMovies, getMovieDetailsFromTMDB } from "../services/tmdb.services.js";
import analyzeMoodWithHuggingFace from "../services/ai.services.js";

export const analyzeMood = async (req, res) => {
  try {
    const { text } = req.body;
    console.log("Received mood text for analysis:", text);
    const moodAnalysis = await analyzeMoodWithHuggingFace(text);
    console.log("Mood Analysis Result:", moodAnalysis);

    res.json({
      mood: moodAnalysis.mood,
      genreId: moodAnalysis.genres,
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
      console.log("Received request for movie recommendations with query:", req.query);
        const { genreId, keywords } = req.query;
        console.log("Received genreId:", genreId);
        console.log("Received keywords:", keywords);
        const movieRecommendations = await discoverMovies(genreId, keywords);
        console.log("Movie Recommendations:", movieRecommendations[0].id);
        res.json({
          totalResults: movieRecommendations.length || 0,
          recommendations: movieRecommendations || []
        });
    } catch (error) {
        console.error("Error getting movie recommendations:", error);
        res.status(500).json({ error: "Failed to get movie recommendations" });
    }
};


export const getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Received request for movie details with movieId:", id);
    const movieDetails = await getMovieDetailsFromTMDB(id);
    console.log("Movie Details:", movieDetails);
    res.json(movieDetails);
  } catch (error) {
    console.error("Error getting movie details:", error);
    res.status(500).json({ error: "Failed to get movie details" });
  } 
};