import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cities } from "../map/cities.js";
import { getIconPath } from "../utils/icons.js";

let regionalMap = null;

const REGIONAL_BOUNDS = [
  [29.7, -88.6],
  [36.8, -78.2]
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


export function renderRegionalPage(weather) {
  const map = createRegionalMap();
  const dots = document.querySelector("#regional-dots");

  renderFrameImage();

  setTimeout(() => {
    map.invalidateSize();
    map.fitBounds(REGIONAL_BOUNDS, {
      padding: [0, 0],
      animate: false
    });
  }, 100);

  dots.innerHTML = cities
    .map(city => {
      return `
        <div
          class="regional-dot"
          data-edit-id="reg-dot-${city.slug}"
          style="left:${city.x}%; top:${city.y}%;"
        >
          <div class="regional-marker"></div>
          <img src="${getIconPath(weather.condition, weather.isDaytime)}" alt="" />
          <div class="regional-temp">${weather.temp}°</div>
          <div class="regional-name">${city.name}</div>
        </div>
      `;
    })
    .join("");
}