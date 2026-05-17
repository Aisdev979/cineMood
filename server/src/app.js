import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";
import authRouter from './routes/auth.routes.js';
import moodAnalyzerRouter from './routes/moodanalyze.routes.js';

dotenv.config();

const app = express();

app.use(cookieParser());

const allowedOrigins = ["http://127.0.0.1:5500", "https://cine-mood-seven.vercel.app"];

const options = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};


app.use(
  cors(options)
);
  
app.use(express.json());
app.use("/api/v1", authRouter);
app.use("/api/v1/mood", moodAnalyzerRouter);

// Example route
app.get('/', (req, res) => {
  res.send('Welcome to the CineMood API!');
});


export default app;
