import fetch from "node-fetch";

const options = {
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
  },
};

async function getKeywordIds(words) {
  const ids = [];
  const arrWords = words.split("|")

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

export async function discoverMovies(genres, keywords) {
  const keywordIds = await getKeywordIds(keywords);

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

export async function getMovieVideosFromTMDB(movieId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-US`, options);
    if (!res.ok) {
      throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
    }
    const videoDetails = await res.json();
    return videoDetails;
  } catch (error) {
    console.error("Error fetching movie videos from TMDB:", error);
    throw new Error("Failed to fetch movie videos");
  }
}
