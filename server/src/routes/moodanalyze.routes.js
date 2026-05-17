import { Router } from "express";
import { analyzeMood, getMovieRecommendations, getMovieDetails, getMovieVideos } from "../controllers/moodanalyzer.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const moodAnalyzerRouter = Router();

moodAnalyzerRouter.post("/analyze", analyzeMood);
moodAnalyzerRouter.get("/movies", getMovieRecommendations);
moodAnalyzerRouter.get("/movies/:id", getMovieDetails);
moodAnalyzerRouter.get("/movies/:id/videos", getMovieVideos);

export default moodAnalyzerRouter;
