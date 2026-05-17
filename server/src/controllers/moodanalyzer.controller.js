import { discoverMovies, getMovieDetailsFromTMDB, getMovieVideosFromTMDB } from "../services/tmdb.services.js";
import { getGroqChatCompletion } from "../services/ai.services.js";

export const analyzeMood = async (req, res) => {
  try {
    const { text } = req.body;
    const moodAnalysis = await getGroqChatCompletion(text);

    res.status(200).json({
      success: true,
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
        const { genreId, keywords } = req.query;
        const movieRecommendations = await discoverMovies(genreId, keywords);
        res.status(200).json({
          success: true,
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
    const movieDetails = await getMovieDetailsFromTMDB(id);
    res.status(200).json({
      success: true,
      movieDetails
    });
  } catch (error) {
    console.error("Error getting movie details:", error);
    res.status(500).json({ error: "Failed to get movie details" });
  } 
};

export const getMovieVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const movieVideos = await getMovieVideosFromTMDB(id);
    res.status(200).json({
      success: true,
      movieVideos
    });
  } catch (error) {
    console.error("Error getting movie videos:", error);
    res.status(500).json({ error: "Failed to get movie videos" });
  }
};
