const apiKey = "a8ec091b";

const input = document.getElementById("movieInput");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const details = document.getElementById("details");
const player = document.getElementById("player");
const btn = document.getElementById("searchBtn");

async function searchMovie() {
  const title = input.value.trim();
  results.innerHTML = "";
  details.innerHTML = "";
  player.innerHTML = "";
  error.textContent = "";
  if (!title) { error.textContent = "Please enter a title."; return; }
  loading.textContent = "Searching...";
  try {
    const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(title)}&apikey=${apiKey}`);
    const data = await res.json();
    loading.textContent = "";
    if (data.Response === "False") { error.textContent = "No results found."; return; }
    data.Search.forEach(item => {
      const div = document.createElement("div");
      div.style = "width:140px;background:#2A1E3D;padding:6px;border-radius:6px;cursor:pointer;";
      div.innerHTML = `
        <img src="${item.Poster !== 'N/A' ? item.Poster : ''}" style="width:100%;border-radius:4px;">
        <div style="font-size:14px;margin-top:5px;">${item.Title} (${item.Year})</div>`;
      div.addEventListener("click", () => loadDetails(item.imdbID));
      results.appendChild(div);
    });
  } catch (err) { loading.textContent = ""; error.textContent = "Error fetching results."; }
}

async function loadDetails(id) {
  const res = await fetch(`https://www.omdbapi.com/?i=${id}&plot=full&apikey=${apiKey}`);
  const d = await res.json();
  details.innerHTML = `
    <div style="overflow:hidden;">
      <img src="${d.Poster}" style="width:120px;float:left;margin-right:10px;border-radius:6px;">
      <h3 style="color:#A179D0;">${d.Title} (${d.Year})</h3>
      <p><b>Genre:</b> ${d.Genre}</p>
      <p><b>IMDB:</b> ${d.imdbRating}</p>
      <p>${d.Plot}</p>
      <button id="playBtn" style="background:#7851A9;color:white;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">▶ Play</button>
    </div>
  `;
  const playBtn = document.getElementById("playBtn");
  playBtn.addEventListener("click", () => playMedia(id, d.Type));
  player.innerHTML = "";
  window.scrollTo({ top: details.offsetTop - 40, behavior: "smooth" });
}

function playMedia(id, type) {
  const embedUrl = `https://vidsrc.me/embed/${type}?imdb=${id}`;
  player.innerHTML = `<iframe src="${embedUrl}" allowfullscreen style="width:100%;height:480px;border:none;border-radius:8px;"></iframe>`;
}

btn.addEventListener("click", searchMovie);
input.addEventListener("keypress", e => { if (e.key === "Enter") searchMovie(); });