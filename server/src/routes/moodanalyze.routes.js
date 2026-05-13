import { Router } from "express";
import { analyzeMood, getMovieRecommendations } from "../controllers/moodanalyzer.controller.js";

const moodAnalyzerRouter = Router();

moodAnalyzerRouter.post("/analyze", analyzeMood);
moodAnalyzerRouter.get("/movies", getMovieRecommendations);

export default moodAnalyzerRouter;
