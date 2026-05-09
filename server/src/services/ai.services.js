async function callClaude(moodText){
  const res = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key':STATE.claudeKey,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body:JSON.stringify({
      model:'claude-sonnet-4-5',
      max_tokens:150,
      messages:[{
        role:'user',
        content:`Analyze this mood and return ONLY a valid JSON object, no markdown, no explanation:
"${moodText}"

Return EXACTLY this structure:
{
  "mood": ["list","of","2-5","mood","adjectives"],
  "genres": [list of 2-4 TMDB genre ID numbers],
  "keywords": ["2-4 thematic keywords for the films e.g. friendship, redemption"],
  "vibe": "one evocative sentence about what kind of film would suit this mood"
}

TMDB genre IDs: 28=Action, 12=Adventure, 16=Animation, 35=Comedy, 80=Crime, 99=Documentary, 18=Drama, 10751=Family, 14=Fantasy, 36=History, 27=Horror, 10402=Music, 9648=Mystery, 10749=Romance, 878=Sci-Fi, 53=Thriller, 10752=War, 37=Western

Return only the JSON object.`
      }]
    })
  });
  if(!res.ok){
    const e = await res.json();
    throw new Error(e.error?.message || 'Claude API error');
  }
  const data = await res.json();
  const raw = data.content[0].text.trim().replace(/```json|```/g,'').trim();
  return JSON.parse(raw);
}