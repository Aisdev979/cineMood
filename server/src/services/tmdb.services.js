import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

console.log("TMDB API Token:", process.env.TMDB_API_TOKEN);

const options = {
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
  },
};

async function getKeywordIds(words) {
  const ids = [];

  for (const word of words) {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/keyword?query=${encodeURIComponent(word)}`,
      options
    );

    const data = await res.json();

    if (data.results?.length > 0) {
      ids.push(data.results[0].id);
    }
  }

  return ids;
}

async function discoverMovies(genres = [18, 35], keywords = ["love", "friendship", "family"]) {
  const keywordIds = await getKeywordIds(keywords);

  console.log("Keyword IDs:", keywordIds);

  const discoverUrl =
    `https://api.themoviedb.org/3/discover/movie` +
    `?with_genres=${genres.join(",")}` +
    `&with_keywords=${keywordIds.join(",")}` +
    `&sort_by=popularity.desc`;

  const res = await fetch(discoverUrl, options);

  const movies = await res.json();

  return movies.results
}

export default discoverMovies