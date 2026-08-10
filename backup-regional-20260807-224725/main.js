import "./style.css";

import { geocodeLocation } from "./api/geocode.js";
import { getWeatherForCoords } from "./api/weather.js";
import { getLatestObservations } from "./api/observations.js";
import { getRegionalWeather } from "./api/regionalWeather.js";

import { renderCurrentPage } from "./pages/current.js";
import { renderLatestObservationsPage } from "./pages/latestObservations.js";
import { renderHourlyForecastPage } from "./pages/hourlyForecast.js";
import { renderRegionalPage } from "./pages/regional.js";

import { initEditor, refreshEditorTargets } from "./ui/editor.js";

let appState = {
  weather: {
    location: "Charlotte, NC",
    displayLocation: "Charlotte",
    coords: { lat: 35.2271, lon: -80.8431 },
    temp: 84,
    condition: "Sunny",
    wind: "SW 5 MPH",
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
  observationsStatus: "Loading Observations",
  regionalWeather: [],
  regionalStatus: "Loading Regional"
};

document.querySelector("#app").innerHTML = `
  <div id="topbar">
    <div id="logo"><span>Weather</span>STAR 4000+</div>
    <input id="city-input" value="Charlotte, NC" />
    <button id="update-btn">Update</button>
    <button id="current-btn">Current</button>
    <button id="latest-btn">Latest Obs</button>
    <button id="hourly-btn">Hourly</button>
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

    <section id="page-hourly" class="page"></section>

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

function getEl(selector) {
  return document.querySelector(selector);
}

function setHeader(text) {
  const header = getEl("#page-header");
  if (header) header.innerHTML = text;
}

function setBanner(text) {
  const banner = getEl("#bottom-banner");
  if (banner) banner.textContent = text;
}

function hideAllPages() {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });
}

function showPage(pageName) {
  hideAllPages();

  if (pageName === "current") {
    const page = getEl("#page-current");
    if (!page) return;

    page.classList.add("active");
    setHeader("Current<br>Conditions");
    renderCurrentPage(appState.weather);
  }

  if (pageName === "latest") {
    const page = getEl("#page-latest");
    if (!page) return;

    page.classList.add("active");
    setHeader("Latest<br>Observations");
    setBanner("Latest Observations");
    renderLatestObservationsPage(
      appState.observations,
      appState.observationsStatus
    );
  }

  if (pageName === "hourly") {
    const page = getEl("#page-hourly");
    if (!page) return;

    page.classList.add("active");
    setHeader("Hourly<br>Forecast");
    setBanner("Hourly Forecast");
    renderHourlyForecastPage(appState.weather.hourly);
  }

  if (pageName === "regional") {
    const page = getEl("#page-regional");
    if (!page) return;

    page.classList.add("active");
    setHeader("Regional<br>Observations");
    setBanner("Regional Observations");
    renderRegionalPage(appState.regionalWeather, appState.regionalStatus);
  }

  refreshEditorTargets();
}

async function updateWeather() {
  const input = getEl("#city-input")?.value || "Charlotte, NC";

  try {
    const updateButton = getEl("#update-btn");
    if (updateButton) updateButton.textContent = "Loading...";

    const place = await geocodeLocation(input);
    const weather = await getWeatherForCoords(place.lat, place.lon, place.label);

    appState.weather = weather;
    appState.observations = [];
    appState.observationsStatus = "Loading Observations";

    showPage("current");
    loadLatestObservations();
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    const updateButton = getEl("#update-btn");
    if (updateButton) updateButton.textContent = "Update";
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
      observations.length > 0 ? "" : "No Recent Observations";
  } catch (error) {
    console.error(error);
    appState.observations = [];
    appState.observationsStatus = "Observations Unavailable";
  }

  if (getEl("#page-latest")?.classList.contains("active")) {
    showPage("latest");
  }
}

async function loadRegionalWeather() {
  appState.regionalStatus = "Loading Regional";
  showPage("regional");

  try {
    const regionalWeather = await getRegionalWeather();

    appState.regionalWeather = regionalWeather;
    appState.regionalStatus = "";
  } catch (error) {
    console.error(error);
    appState.regionalWeather = [];
    appState.regionalStatus = "Regional Unavailable";
  }

  showPage("regional");
}

getEl("#current-btn")?.addEventListener("click", () => {
  showPage("current");
});

getEl("#latest-btn")?.addEventListener("click", () => {
  showPage("latest");
});

getEl("#hourly-btn")?.addEventListener("click", () => {
  showPage("hourly");
});

getEl("#regional-btn")?.addEventListener("click", () => {
  loadRegionalWeather();
});

getEl("#update-btn")?.addEventListener("click", () => {
  updateWeather();
});

renderCurrentPage(appState.weather);
renderLatestObservationsPage(appState.observations, appState.observationsStatus);
renderHourlyForecastPage(appState.weather.hourly);
renderRegionalPage(appState.regionalWeather, appState.regionalStatus);

initEditor();
refreshEditorTargets();

updateWeather();