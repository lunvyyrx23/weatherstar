import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cities } from "../map/cities.js";
import { getIconPath } from "../utils/icons.js";
import { getRegionalWeather } from "../api/regionalWeather.js";

let regionalMap = null;
let latestRegionalWeather = {};
let loadingRegionalWeather = false;
let lastRegionalKey = "";

const VIEW_MILES = 450;
const HALF_VIEW_MILES = VIEW_MILES / 2;
const MAX_DOTS = 14;
const MILES_PER_LAT = 69.0;

function milesPerLon(lat) {
  return Math.max(1, MILES_PER_LAT * Math.cos((lat * Math.PI) / 180));
}

function distanceMiles(aLat, aLon, bLat, bLon) {
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function readLatLonFromInput() {
  const input =
    document.querySelector("#city-in") ||
    document.querySelector("#city-input") ||
    document.querySelector("#location-input") ||
    document.querySelector("input[type='search']") ||
    document.querySelector("input[type='text']");

  const value = input?.value || "";
  const match = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);

  if (!match) return null;

  return {
    lat: Number(match[1]),
    lon: Number(match[2])
  };
}

function getCenter(weather) {
  const fromWeather = {
    lat:
      weather?.coords?.lat ??
      weather?.coord?.lat ??
      weather?.location?.lat ??
      weather?.lat,
    lon:
      weather?.coords?.lon ??
      weather?.coord?.lon ??
      weather?.location?.lon ??
      weather?.lon
  };

  if (Number.isFinite(fromWeather.lat) && Number.isFinite(fromWeather.lon)) {
    return fromWeather;
  }

  const fromInput = readLatLonFromInput();

  if (fromInput) return fromInput;

  return {
    lat: 35.2271,
    lon: -80.8431
  };
}

function getRegionalBounds(center) {
  const latRange = HALF_VIEW_MILES / MILES_PER_LAT;
  const lonRange = HALF_VIEW_MILES / milesPerLon(center.lat);

  return [
    [center.lat - latRange, center.lon - lonRange],
    [center.lat + latRange, center.lon + lonRange]
  ];
}

function getVisibleCities(center) {
  const bounds = getRegionalBounds(center);
  const minLat = bounds[0][0];
  const minLon = bounds[0][1];
  const maxLat = bounds[1][0];
  const maxLon = bounds[1][1];

  return cities
    .map(city => ({
      ...city,
      distance: distanceMiles(center.lat, center.lon, city.lat, city.lon)
    }))
    .filter(city => {
      return (
        city.distance <= HALF_VIEW_MILES &&
        city.lat >= minLat &&
        city.lat <= maxLat &&
        city.lon >= minLon &&
        city.lon <= maxLon
      );
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_DOTS);
}

function createRegionalMap() {
  const mapEl =
    document.querySelector("#regional-basemap") ||
    document.querySelector("#reg-base");

  if (!mapEl) return null;

  if (regionalMap) {
    regionalMap.invalidateSize();
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

  return regionalMap;
}

function renderFrameImage() {
  const frame =
    document.querySelector("#regional-frame") ||
    document.querySelector("#reg-frame");

  if (!frame) return;

  frame.innerHTML = `
    <img
      id="regional-frame-img"
      data-edit-id="regional-frame-img"
      src="/bg/ws4000wherediditgo.png"
      alt=""
    />
  `;
}

function shortCityName(name) {
  return String(name || "")
    .replace("WASHINGTON DC", "WASHINGTON")
    .replace("CHARLESTON SC", "CHARLESTON")
    .replace("CHARLESTON WV", "CHARLESTON")
    .replace("PORTLAND ME", "PORTLAND")
    .replace("PORTLAND OR", "PORTLAND")
    .replace("SAN FRANCISCO", "S FRANCISCO")
    .replace("LOS ANGELES", "L ANGELES")
    .slice(0, 14);
}

function renderDots(fallbackWeather, visibleCities) {
  const dots =
    document.querySelector("#regional-dots") ||
    document.querySelector("#reg-dots");

  if (!regionalMap || !dots) return;

  if (!visibleCities.length) {
    dots.innerHTML = `
      <div
        class="regional-dot"
        data-edit-id="reg-dot-none"
        style="left:545px; top:410px;"
      >
        <div class="regional-temp">NO DATA</div>
      </div>
    `;
    return;
  }

  dots.innerHTML = visibleCities
    .map(city => {
      const point = regionalMap.latLngToContainerPoint([city.lat, city.lon]);
      const cityWeather = latestRegionalWeather[city.slug] || fallbackWeather;

      const temp = cityWeather?.temp ?? cityWeather?.tempF ?? "--";
      const condition = cityWeather?.condition || cityWeather?.cond || "Cloudy";
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
          <div class="regional-name">${shortCityName(city.name)}</div>
        </div>
      `;
    })
    .join("");
}

async function loadAccurateRegionalWeather(fallbackWeather, visibleCities) {
  if (loadingRegionalWeather) return;

  loadingRegionalWeather = true;

  try {
    latestRegionalWeather = await getRegionalWeather(visibleCities);
    renderDots(fallbackWeather, visibleCities);
  } catch (error) {
    console.error("Regional weather failed:", error);
  } finally {
    loadingRegionalWeather = false;
  }
}

export function renderRegionalPage(weather) {
  const map = createRegionalMap();

  if (!map) return;

  const center = getCenter(weather);
  const visibleCities = getVisibleCities(center);
  const regionalKey = `${center.lat.toFixed(2)},${center.lon.toFixed(2)}`;

  if (regionalKey !== lastRegionalKey) {
    latestRegionalWeather = {};
    lastRegionalKey = regionalKey;
  }

  renderFrameImage();

  setTimeout(() => {
    map.invalidateSize();

    map.fitBounds(getRegionalBounds(center), {
      padding: [0, 0],
      animate: false
    });

    renderDots(weather, visibleCities);
    loadAccurateRegionalWeather(weather, visibleCities);
  }, 100);
}
