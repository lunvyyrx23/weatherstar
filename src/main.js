import "./style.css";
import { geocodeLocation } from "./api/geocode.js";
import { getWeatherForCoords } from "./api/weather.js";
import { renderCurrentPage } from "./pages/current.js";
import { renderRegionalPage } from "./pages/regional.js";
import { initEditor, refreshEditorTargets } from "./ui/editor.js";

let appState = {
 weather: {
  location: "Charlotte, NC",
  coords: { lat: 35.2271, lon: -80.8431 },
  temp: 84,
  condition: "Sunny",
  wind: "SW 5 mph",
  isDaytime: true,
  hourly: [],
  stationsUrl: null,
  stats: {
    humidity: "--",
    dewpoint: "--",
    ceiling: "--",
    visibility: "--",
    pressure: "--",
    feelsLabel: "Feels Like:",
    feelsValue: "84°"
  }
}
};

document.querySelector("#app").innerHTML = `
  <div id="topbar">
    <div id="logo"><span>Weather</span>STAR 4000+</div>
    <input id="city-input" value="Charlotte, NC" />
    <button id="update-btn">Update</button>
    <button id="current-btn">Current</button>
    <button id="regional-btn">Regional</button>
    <button id="edit-toggle">Edit Layout</button>
  </div>

  <div id="editor-panel">
    <div id="editor-name">No element</div>

    <select id="editor-select">
      <option value="">Pick element</option>
    </select>

    <label>X <input id="ed-x" type="number" /></label>
    <label>Y <input id="ed-y" type="number" /></label>
    <label>W <input id="ed-w" type="number" /></label>
    <label>H <input id="ed-h" type="number" /></label>
    <label>Font <input id="ed-fs" type="number" /></label>

    <button id="editor-save">Save</button>
    <button id="editor-reset">Reset Selected</button>
    <button id="editor-reset-all">Reset All</button>
    <button id="editor-export">Export</button>
  </div>

  <main id="screen">
    <div id="page-header" data-edit-id="page-header">CURRENT<br>CONDITIONS</div>

    <section id="page-current" class="page active"></section>

    <section id="page-regional" class="page">
      <div id="regional-basemap"></div>
      <div id="regional-dots" data-edit-id="regional-dots"></div>
      <div id="regional-frame" data-edit-id="regional-frame"></div>
    </section>

    <div id="bottom-banner" data-edit-id="bottom-banner">WeatherSTAR 4000+</div>
  </main>
`;

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  if (pageName === "current") {
    document.querySelector("#page-current").classList.add("active");
    document.querySelector("#page-header").innerHTML = "CURRENT<br>CONDITIONS";
    renderCurrentPage(appState.weather);
  }

  if (pageName === "regional") {
    document.querySelector("#page-regional").classList.add("active");
    document.querySelector("#page-header").innerHTML = "REGIONAL<br>OBSERVATIONS";
    renderRegionalPage(appState.weather);
  }
}

async function updateWeather() {
  const input = document.querySelector("#city-input").value;

  try {
    document.querySelector("#update-btn").textContent = "Loading...";

    const place = await geocodeLocation(input);
    const weather = await getWeatherForCoords(place.lat, place.lon, place.label);

    appState.weather = weather;

    showPage("current");
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    document.querySelector("#update-btn").textContent = "Update";
  }
}

document.querySelector("#current-btn").addEventListener("click", () => {
  showPage("current");
});

document.querySelector("#regional-btn").addEventListener("click", () => {
  showPage("regional");
});

document.querySelector("#update-btn").addEventListener("click", () => {
  updateWeather();
});

renderCurrentPage(appState.weather);
initEditor();
refreshEditorTargets();
updateWeather();