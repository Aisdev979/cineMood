import express from 'express';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use("/api/v1", authRouter);

// Example route
app.get('/', (req, res) => {
  res.send('Welcome to the CineMood API!');
});


export default app;