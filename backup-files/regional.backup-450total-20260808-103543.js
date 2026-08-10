import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cities } from "../map/cities.js";
import { getIconPath } from "../utils/icons.js";
import { getRegionalWeather } from "../api/regionalWeather.js";

let regionalMap = null;
let latestRegionalWeather = {};
let loadingRegionalWeather = false;

const REGIONAL_BOUNDS = [
  [24.4, -125.0],
  [49.4, -66.5]
];

function createRegionalMap() {
  const mapEl = document.querySelector("#regional-basemap");

  if (regionalMap) {
    regionalMap.invalidateSize();

    regionalMap.fitBounds(REGIONAL_BOUNDS, {
      padding: [0, 0],
      animate: false
    });

    return regionalMap;
  }

  regionalMap = L.map(mapEl, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19
  }).addTo(regionalMap);

  regionalMap.fitBounds(REGIONAL_BOUNDS, {
    padding: [0, 0],
    animate: false
  });

  return regionalMap;
}

function renderFrameImage() {
  const frame = document.querySelector("#regional-frame");

  frame.innerHTML = `
    <img
      id="regional-frame-img"
      data-edit-id="regional-frame-img"
      src="/bg/ws4000wherediditgo.png"
      alt=""
    />
  `;
}

function renderDots(fallbackWeather) {
  const dots = document.querySelector("#regional-dots");

  if (!regionalMap || !dots) return;

  dots.innerHTML = cities
    .map(city => {
      const point = regionalMap.latLngToContainerPoint([city.lat, city.lon]);
      const cityWeather = latestRegionalWeather[city.slug] || fallbackWeather;

      const temp = cityWeather?.temp ?? "--";
      const condition = cityWeather?.condition || "Cloudy";
      const isDaytime = cityWeather?.isDaytime ?? true;

      return `
        <div
          class="regional-dot"
          data-edit-id="reg-dot-${city.slug}"
          style="left:${Math.round(point.x)}px; top:${Math.round(point.y)}px;"
        >
          <div class="regional-marker"></div>
          <img src="${getIconPath(condition, isDaytime)}" alt="" />
          <div class="regional-temp">${temp}°</div>
          <div class="regional-name">${city.name}</div>
        </div>
      `;
    })
    .join("");
}

async function loadAccurateRegionalWeather(fallbackWeather) {
  if (loadingRegionalWeather) return;

  loadingRegionalWeather = true;

  try {
    latestRegionalWeather = await getRegionalWeather(cities);
    renderDots(fallbackWeather);
  } catch (error) {
    console.error("Regional weather failed:", error);
  } finally {
    loadingRegionalWeather = false;
  }
}

export function renderRegionalPage(weather) {
  const map = createRegionalMap();

  renderFrameImage();

  setTimeout(() => {
    map.invalidateSize();

    map.fitBounds(REGIONAL_BOUNDS, {
      padding: [0, 0],
      animate: false
    });

    renderDots(weather);
    loadAccurateRegionalWeather(weather);
  }, 100);
}
