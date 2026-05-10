import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";
import authRouter from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    credentials: true,
  })
);
  
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", authRouter);

// Example route
app.get('/', (req, res) => {
  res.send('Welcome to the CineMood API!');
});


export default app;