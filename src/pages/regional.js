import { cities, regionalDotOffsets } from "../map/cities.js";
import { getIconPath } from "../utils/icons.js";

const REGIONAL_BOUNDS = {
  north: 36.8,
  south: 29.5,
  west: -87.8,
  east: -79.0
};

function projectCity(city) {
  const width = 1091;
  const height = 820;

  const x =
    ((city.lon - REGIONAL_BOUNDS.west) /
      (REGIONAL_BOUNDS.east - REGIONAL_BOUNDS.west)) *
    width;

  const y =
    ((REGIONAL_BOUNDS.north - city.lat) /
      (REGIONAL_BOUNDS.north - REGIONAL_BOUNDS.south)) *
    height;

  const offset = regionalDotOffsets[city.slug] || { x: 0, y: 0 };

  return {
    x: x + offset.x,
    y: y + offset.y
  };
}

function formatTemp(temp) {
  if (temp === null || temp === undefined || temp === "--") return "--";
  return `${temp}°`;
}

export function renderRegionalPage(regionalWeather = [], status = "") {
  const dots = document.querySelector("#regional-dots");

  if (!dots) return;

  const weatherBySlug = new Map();

  if (Array.isArray(regionalWeather)) {
    regionalWeather.forEach(item => {
      weatherBySlug.set(item.slug, item);
    });
  }

  dots.innerHTML = cities
    .map(city => {
      const p = projectCity(city);

      const weather = weatherBySlug.get(city.slug) || {
        temp: "--",
        condition: "Cloudy",
        isDaytime: true
      };

      return `
        <div
          class="regional-dot"
          data-edit-id="reg-dot-${city.slug}"
          style="left:${p.x}px; top:${p.y}px;"
        >
          <div class="regional-marker"></div>
          <img src="${getIconPath(weather.condition, weather.isDaytime)}" alt="" />
          <div class="regional-temp">${formatTemp(weather.temp)}</div>
          <div class="regional-name">${city.name}</div>
        </div>
      `;
    })
    .join("");

  if (status) {
    dots.innerHTML += `
      <div id="regional-status" data-edit-id="regional-status">
        ${status}
      </div>
    `;
  }
}