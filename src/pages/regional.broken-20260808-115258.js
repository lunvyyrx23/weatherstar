import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cities } from "../map/cities.js";
import { getIconPath } from "../utils/icons.js";
import { getRegionalWeather } from "../api/regionalWeather.js";

let regionalMap = null;
let latestRegionalWeather = {};
let centerCache = new Map();
let renderToken = 0;
let lastRegionalKey = "";

const MAPTILER_MAP_ID = "019fe1fa-e820-78cd-bccf-a2a78e5f39b3";
const MAPTILER_KEY = "age(weather) {";

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

function getLocationText() {
  const input =
    document.querySelector("#city-in") ||
    document.querySelector("#city-input") ||
    document.querySelector("#location-input") ||
    document.querySelector("input[type='search']") ||
    document.querySelector("input[type='text']");

  return String(input?.value || "").trim();
}

function parseLatLon(value) {
  const match = String(value || "").match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);

  if (!match) return null;

  const lat = Number(match[1]);
  const lon = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}

async function geocodeLocation(value) {
  const text = String(value || "").trim();

  if (!text) return null;

  const parsed = parseLatLon(text);
  if (parsed) return parsed;

  const key = text.toLowerCase();

  if (centerCache.has(key)) {
    return centerCache.get(key);
  }

  try {
    const url =
      "https://geocoding-api.open-meteo.com/v1/search" +
      `?name=${encodeURIComponent(text)}` +
      "&count=1&language=en&format=json";

    const data = await fetch(url).then(r => r.json());
    const hit = data?.results?.find(r => r.country_code === "US") || data?.results?.[0];

    if (hit?.latitude && hit?.longitude) {
      const center = {
        lat: Number(hit.latitude),
        lon: Number(hit.longitude)
      };

      if (Number.isFinite(center.lat) && Number.isFinite(center.lon)) {
        centerCache.set(key, center);
        return center;
      }
    }
  } catch {}

  return null;
}

async function getRegionalCenter(weather) {
  if (Number.isFinite(weather?.lat) && Number.isFinite(weather?.lon)) {
    return {
      lat: Number(weather.lat),
      lon: Number(weather.lon)
    };
  }

  if (Number.isFinite(weather?.coords?.lat) && Number.isFinite(weather?.coords?.lon)) {
    return {
      lat: Number(weather.coords.lat),
      lon: Number(weather.coords.lon)
    };
  }

  const locationText = getLocationText();
  const center = await geocodeLocation(locationText);

  if (center) return center;

  return {
    lat: 33.4735,
    lon: -82.0105
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

function getCitiesInsideArea(center) {
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

  L.tileLayer(`https://api.maptiler.com/maps/${MAPTILER_MAP_ID}/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, {
    maxZoom: 19,
    minZoom: 3,
    noWrap: true,
    crossOrigin: true
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

function isPointSafe(point) {
  return (
    point.x >= 85 &&
    point.x <= 1010 &&
    point.y >= 220 &&
    point.y <= 735
  );
}

function renderDots(fallbackWeather, areaCities, token) {
  if (token !== renderToken) return;

  const dots =
    document.querySelector("#regional-dots") ||
    document.querySelector("#reg-dots");

  if (!regionalMap || !dots) return;

  dots.innerHTML = areaCities
    .map(city => {
      const point = regionalMap.latLngToContainerPoint([city.lat, city.lon]);

      if (!isPointSafe(point)) {
        return "";
      }

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

async function loadAccurateRegionalWeather(fallbackWeather, areaCities, token, regionalKey) {
  try {
    const weather = await getRegionalWeather(areaCities);

    if (token !== renderToken) return;
    if (regionalKey !== lastRegionalKey) return;

    latestRegionalWeather = weather;
    renderDots(fallbackWeather, areaCities, token);
  } catch (error) {
    console.error("Regional weather failed:", error);
  }
}

export async function renderRegionalP  const token = ++renderToken;
  const map = createRegionalMap();

  if (!map) return;

  const center = await getRegionalCenter(weather);

  if (token !== renderToken) return;

  const regionalKey = `${center.lat.toFixed(3)},${center.lon.toFixed(3)}`;

  if (regionalKey !== lastRegionalKey) {
    latestRegionalWeather = {};
    lastRegionalKey = regionalKey;
  }

  const bounds = getRegionalBounds(center);
  const areaCities = getCitiesInsideArea(center);

  renderFrameImage();

  setTimeout(() => {
    if (token !== renderToken) return;

    map.invalidateSize();

    map.fitBounds(bounds, {
      padding: [0, 0],
      animate: false
    });

    requestAnimationFrame(() => {
      if (token !== renderToken) return;

      renderDots(weather, areaCities, token);
      loadAccurateRegionalWeather(weather, areaCities, token, regionalKey);
    });
  }, 100);
}

