import app from "./src/app.js";
import connectDB from "./src/db/db.js";

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

let isConnected = false;

// Vercel serverless handler
export default async function handler(req, res) {
  try {
    // prevent reconnecting on every request (important for performance)
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }

    return app(req, res);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}
