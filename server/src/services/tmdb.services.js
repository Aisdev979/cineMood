async function fetchMovies(genreIds, keywords = []) {
  const genreStr = genreIds.join("|");

  // Get TMDB keyword IDs
  const keywordIds = await Promise.all(
    keywords.map(async (keyword) => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/keyword?api_key=${STATE.tmdbKey}&query=${encodeURIComponent(keyword)}`
        );

        const data = await res.json();

        return data.results?.[0]?.id;
      } catch {
        return null;
      }
    })
  );

  const keywordStr = keywordIds.filter(Boolean).join("|");

  const pages = await Promise.all(
    [1, 2].map((p) =>
      fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${STATE.tmdbKey}&with_genres=${genreStr}&with_keywords=${keywordStr}&sort_by=vote_average.desc&vote_count.gte=80&page=${p}&language=en-US`
      ).then((r) => r.json())
    )
  );

  let movies = pages.flatMap((p) => p.results || []);

  // Remove duplicates
  movies = [...new Map(movies.map((m) => [m.id, m])).values()];

  return movies.slice(0, 40);
}