import express from 'express';

const app = express();

app.use(express.json());

// Example route
app.get('/', (req, res) => {
  res.send('Welcome to the CineMood API!');
});


export default app;