const apiKey = "a8ec091b";

const sidebar = document.getElementById("sidebar");
const searchInput = document.getElementById("titleInput");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const detailsDiv = document.getElementById("details");
const playerDiv = document.getElementById("player");
const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const favoritesDiv = document.getElementById("favorites");
const recentDiv = document.getElementById("recent");
const autocompleteDiv = document.getElementById("autocomplete");
const tvSelector = document.getElementById("tvSelector");
const seasonSelect = document.getElementById("seasonSelect");
const episodeSelect = document.getElementById("episodeSelect");
const playEpisodeBtn = document.getElementById("playEpisodeBtn");

const filterType = document.getElementById("filterType");
const filterYear = document.getElementById("filterYear");
const sortBy = document.getElementById("sortBy");
const applyFiltersBtn = document.getElementById("applyFilters");

let currentImdbID = "", currentType = "", totalSeasons = 1, currentEpisode = 1, currentSeason = 1;

// Keyboard shortcut for search
document.addEventListener("keydown", e=>{if(e.key==="/"){e.preventDefault(); searchInput.focus();}});
searchBtn.addEventListener("click", searchTitle);
searchInput.addEventListener("input", showAutocomplete);
playEpisodeBtn.addEventListener("click", playEpisode);
applyFiltersBtn.addEventListener("click", searchTitle);

function toggleSidebar(){ sidebar.classList.toggle("collapsed"); }

function getList(key){ return JSON.parse(localStorage.getItem(key)||"[]"); }
function saveList(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

async function searchTitle(){
  const query = searchInput.value.trim();
  if(!query) return;
  resultsDiv.innerHTML=""; detailsDiv.innerHTML=""; playerDiv.innerHTML=""; tvSelector.style.display="none";
  loadingDiv.textContent="Searching..."; errorDiv.textContent="";

  try{
    const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`);
    let data = await res.json();
    loadingDiv.textContent="";
    if(data.Response==="False") throw new Error("No results found");
    let items = data.Search;

    // Filter by type
    const typeFilter = filterType.value;
    if(typeFilter!=="all") items = items.filter(i=>i.Type===typeFilter);
    const yearFilter = filterYear.value;
    if(yearFilter) items = items.filter(i=>i.Year.includes(yearFilter));

    // Sort
    if(sortBy.value==="title") items.sort((a,b)=>a.Title.localeCompare(b.Title));
    else if(sortBy.value==="year") items.sort((a,b)=>b.Year.localeCompare(a.Year));

    resultsDiv.innerHTML="";
    items.forEach(item=>{
      const card = document.createElement("div"); card.className="result-card";
      card.innerHTML=`<img src="${item.Poster!=="N/A"?item.Poster:""}"><h4>${item.Title}</h4><p>${item.Year}</p>`;
      card.onclick = ()=>loadDetails(item.imdbID);
      resultsDiv.appendChild(card);
    });
  }catch(err){ loadingDiv.textContent=""; errorDiv.textContent=err.message; }
}

async function loadDetails(imdbID){
  const data = await fetch(`https://www.omdbapi.com/?i=${imdbID}&plot=full&apikey=${apiKey}`).then(r=>r.json());
  detailsDiv.innerHTML=`
    <img src="${data.Poster}" alt="">
    <h2>${data.Title} (${data.Year})</h2>
    <p><b>Rated:</b> ${data.Rated} | <b>Genre:</b> ${data.Genre}</p>
    <p><b>IMDB:</b> ${data.imdbRating}</p>
    <p>${data.Plot}</p>
    <button onclick="playMedia('${imdbID}','${data.Type}')">▶ Play</button>
    <button onclick="toggleFavorite('${data.Title}','${data.Poster}','${imdbID}')">♡ Favorite</button>
  `;
  resultsDiv.innerHTML=""; playerDiv.innerHTML="";
  currentImdbID=imdbID; currentType=data.Type; currentEpisode=1; currentSeason=1;

  if(currentType==="series"){
    totalSeasons=parseInt(data.totalSeasons)||1;
    seasonSelect.innerHTML = Array.from({length:totalSeasons},(_,i)=>`<option value="${i+1}">Season ${i+1}</option>`).join("");
    await loadEpisodes(seasonSelect.value);
    tvSelector.style.display="flex";
    seasonSelect.onchange = ()=>loadEpisodes(seasonSelect.value);
  }else tvSelector.style.display="none";

  addHistory(imdbID);
}

async function loadEpisodes(season){
  currentSeason = season;
  const data = await fetch(`https://www.omdbapi.com/?i=${currentImdbID}&Season=${season}&apikey=${apiKey}`).then(r=>r.json());
  if(data.Response==="False"){ episodeSelect.innerHTML=`<option>Episode 1</option>`; return; }
  episodeSelect.innerHTML = data.Episodes.map((ep,i)=>`<option value="${i+1}">Episode ${i+1} - ${ep.Title}</option>`).join("");
  episodeSelect.onchange = ()=>currentEpisode=episodeSelect.value;
}

function playEpisode(){
  const season = seasonSelect.value;
  const episode = episodeSelect.value;
  currentSeason = season; currentEpisode = episode;
  const iframeSrc = `https://vidsrc.me/embed/tv?imdb=${currentImdbID}&season=${season}&episode=${episode}`;
  embedPlayer(iframeSrc);
}

function playMedia(imdbID,type){
  const url = `https://vidsrc.me/embed/${type}?imdb=${imdbID}`;
  embedPlayer(url);
}

function embedPlayer(src){
  playerDiv.innerHTML=`<iframe src="${src}" allowfullscreen></iframe>`;
  const watching = getList("continue") || {};
  watching[currentImdbID]={season:currentSeason, episode:currentEpisode, time:0};
  saveList("continue", watching);
}

function toggleFavorite(title,poster,imdbID){
  const favs = getList("favorites");
  const index = favs.findIndex(f=>f.imdbID===imdbID);
  if(index>-1) favs.splice(index,1);
  else favs.unshift({title,poster,imdbID});
  saveList("favorites",favs); updateSidebar();
}

function addHistory(imdbID){
  const hist = getList("recent");
  if(!hist.includes(imdbID)){ hist.unshift(imdbID); if(hist.length>10) hist.pop(); saveList("recent",hist); updateSidebar(); }
}

async function updateSidebar(){
  favoritesDiv.innerHTML=""; recentDiv.innerHTML="";
  const favs = getList("favorites"); favs.forEach(f=>{
    const el=document.createElement("div"); el.className="thumb"; el.innerHTML=`<img src="${f.poster}"><span>${f.title}</span>`; el.onclick=()=>loadDetails(f.imdbID);
    favoritesDiv.appendChild(el);
  });
  const recs = getList("recent");
  for(const id of recs){
    const d = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${apiKey}`).then(r=>r.json());
    const el=document.createElement("div"); el.className="thumb"; el.innerHTML=`<img src="${d.Poster}"><span>${d.Title}</span>`; el.onclick=()=>loadDetails(id);
    recentDiv.appendChild(el);
  }
}

async function showAutocomplete(){
  const query = searchInput.value.trim();
  autocompleteDiv.innerHTML=""; if(query.length<2) return;
  try{
    const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`);
    const data = await res.json();
    if(data.Response==="False") return;
    data.Search.slice(0,10).forEach(item=>{
      const div = document.createElement("div"); div.className="autocomplete-item";
      div.innerHTML = item.Title.replace(new RegExp(query,"gi"),match=>`<b>${match}</b>`);
      div.onclick = ()=>{ searchInput.value=item.Title; searchTitle(); autocompleteDiv.innerHTML=""; };
      autocompleteDiv.appendChild(div);
    });
  }catch{}
}

updateSidebar();