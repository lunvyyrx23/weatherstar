import "./style.css";
import { geocodeLocation } from "./api/geocode.js";
import { getWeatherForCoords } from "./api/weather.js";
import { getLatestObservations } from "./api/observations.js";
import { getRegionalWeather } from "./api/regionalWeather.js";

import { renderCurrentPage } from "./pages/current.js";
import { renderLatestObservationsPage } from "./pages/latestObservations.js";
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
  },
  observations: [],
  observationsStatus: "LOADING OBSERVATIONS...",
  regionalWeather: [],
  regionalStatus: "LOADING REGIONAL..."
};

document.querySelector("#app").innerHTML = `
  <div id="topbar">
    <div id="logo"><span>Weather</span>STAR 4000+</div>
    <input id="city-input" value="Charlotte, NC" />
    <button id="update-btn">Update</button>
    <button id="current-btn">Current</button>
    <button id="latest-btn">Latest Obs</button>
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
    <div id="page-header" data-edit-id="page-header">
      Current<br>Conditions
    </div>

    <section id="page-current" class="page active"></section>

    <section id="page-latest" class="page"></section>

    <section id="page-regional" class="page">
      <div id="regional-basemap"></div>
      <div id="regional-dots" data-edit-id="regional-dots"></div>
      <div id="regional-frame" data-edit-id="regional-frame"></div>
    </section>

    <div id="bottom-banner" data-edit-id="bottom-banner">
      WeatherSTAR 4000+
    </div>
  </main>
`;

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  if (pageName === "current") {
    document.querySelector("#page-current").classList.add("active");
    document.querySelector("#page-header").innerHTML = "Current<br>Conditions";
    renderCurrentPage(appState.weather);
  }

  if (pageName === "latest") {
    document.querySelector("#page-latest").classList.add("active");
document.querySelector("#page-header").innerHTML = "Latest<br>Observations";
    renderLatestObservationsPage(
      appState.observations,
      appState.observationsStatus
    );
  }

  if (pageName === "regional") {
    document.querySelector("#page-regional").classList.add("active");
    document.querySelector("#page-header").innerHTML = "REGIONAL<br>OBSERVATIONS";
    renderRegionalPage(appState.regionalWeather, appState.regionalStatus);
  }

  refreshEditorTargets();
}

async function updateWeather() {
  const input = document.querySelector("#city-input").value;

  try {
    document.querySelector("#update-btn").textContent = "Loading...";

    const place = await geocodeLocation(input);
    const weather = await getWeatherForCoords(place.lat, place.lon, place.label);

    appState.weather = weather;
    appState.observations = [];
    appState.observationsStatus = "LOADING OBSERVATIONS...";

    showPage("current");
    loadLatestObservations();
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    document.querySelector("#update-btn").textContent = "Update";
  }
}

async function loadLatestObservations() {
  try {
    const observations = await getLatestObservations(
      appState.weather.stationsUrl,
      8
    );

    appState.observations = observations;
    appState.observationsStatus =
      observations.length > 0 ? "" : "NO RECENT OBSERVATIONS";
  } catch (error) {
    console.error(error);
    appState.observations = [];
    appState.observationsStatus = "OBSERVATIONS UNAVAILABLE";
  }

 if (pageName === "latest") {
  document.querySelector("#page-latest").classList.add("active");
  document.querySelector("#page-header").innerHTML = "Latest<br>Observations";
  document.querySelector("#bottom-banner").textContent = "Latest Observations";
  renderLatestObservationsPage(
    appState.observations,
    appState.observationsStatus
  );
}

if (pageName === "regional") {
  document.querySelector("#page-regional").classList.add("active");
  document.querySelector("#page-header").innerHTML = "Regional<br>Observations";
  document.querySelector("#bottom-banner").textContent = "Regional Observations";
  renderRegionalPage(appState.regionalWeather, appState.regionalStatus);
}

  try {
    const regionalWeather = await getRegionalWeather();

    appState.regionalWeather = regionalWeather;
    appState.regionalStatus = "";
  } catch (error) {
    console.error(error);
    appState.regionalWeather = [];
    appState.regionalStatus = "REGIONAL UNAVAILABLE";
  }

  showPage("regional");
}

document.querySelector("#current-btn").addEventListener("click", () => {
  showPage("current");
});

document.querySelector("#latest-btn").addEventListener("click", () => {
  showPage("latest");
});

document.querySelector("#regional-btn").addEventListener("click", () => {
  loadRegionalWeather();
});

document.querySelector("#update-btn").addEventListener("click", () => {
  updateWeather();
});

renderCurrentPage(appState.weather);
renderLatestObservationsPage(appState.observations, appState.observationsStatus);
renderRegionalPage(appState.regionalWeather, appState.regionalStatus);

initEditor();
refreshEditorTargets();

updateWeather();