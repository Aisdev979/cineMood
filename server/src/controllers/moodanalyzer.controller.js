import { discoverMovies, getMovieDetailsFromTMDB, getMovieVideosFromTMDB } from "../services/tmdb.services.js";
import { getGroqChatCompletion } from "../services/ai.services.js";

export const analyzeMood = async (req, res, next) => {
  try {
    const { text } = req.body;
    const moodAnalysis = await getGroqChatCompletion(text);

    if (!moodAnalysis) {
      const error = new Error("Failed to analyze mood");
      error.status = 500;
      throw error;
    }

    res.status(200).json({
      success: true,
      mood: moodAnalysis.mood,
      genreId: moodAnalysis.genres,
      keywords: moodAnalysis.keywords,
      vibe: moodAnalysis.vibe,
    });
  } catch (error) {
    console.error("Error analyzing mood:", error);
    next(error); // Pass the error to the error handling middleware
  }
};

export const getMovieRecommendations = async (req, res, next) => {
    try {
        const { genreId, keywords } = req.query;
        const movieRecommendations = await discoverMovies(genreId, keywords);

        if (!movieRecommendations) {
            const error = new Error("Failed to get movie recommendations");
            error.status = 500;
            throw error;
        }

        res.status(200).json({
          success: true,
          totalResults: movieRecommendations.length || 0,
          recommendations: movieRecommendations || []
        });
    } catch (error) {
        console.error("Error getting movie recommendations:", error);
        next(error); // Pass the error to the error handling middleware
    }
};


export const getMovieDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movieDetails = await getMovieDetailsFromTMDB(id);

    if (!movieDetails) {
      const error = new Error("Failed to get movie details");
      error.status = 500;
      throw error;
    }

    res.status(200).json({
      success: true,
      movieDetails
    });
  } catch (error) {
    console.error("Error getting movie details:", error);
    next(error); // Pass the error to the error handling middleware
  } 
};

export const getMovieVideos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movieVideos = await getMovieVideosFromTMDB(id);

    if (!movieVideos) {
      const error = new Error("Failed to get movie videos");
      error.status = 500;
      throw error;
    }

    res.status(200).json({
      success: true,
      movieVideos
    });
  } catch (error) {
    console.error("Error getting movie videos:", error);
    next(error); // Pass the error to the error handling middleware
  }
};
