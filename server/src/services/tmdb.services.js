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
  const arrWords = words.split("|")
  console.log("Getting keyword IDs for words:", arrWords);

  for (const word of arrWords) {
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

export async function discoverMovies(genres = "35,18,12", keywords = ['friendship', 'family', 'love', 'adventure']) {
  const keywordIds = await getKeywordIds(keywords);

    console.log("Keyword IDs:", keywordIds);

    const discoverUrl =
      `https://api.themoviedb.org/3/discover/movie` +
      `?with_genres=${genres}` +
      `&with_keywords=${keywordIds.join("|")}` +
      `&vote_count.gte=500` +
      `&vote_average.gte=6.5` +
      `&sort_by=popularity.desc`;

    const res = await fetch(discoverUrl, options);

    const movies = await res.json();

    return movies.results
  }

export async function getMovieDetailsFromTMDB(movieId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?video=true&language=en-US`, options);
    if (!res.ok) {
      throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
    }
    const movieDetails = await res.json();
    return movieDetails;
  } catch (error) {
    console.error("Error fetching movie details from TMDB:", error);
    throw new Error("Failed to fetch movie details");
  }
}

