import { cities, regionalDotOffsets } from "../map/cities.js";

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

export function renderRegionalPage() {
  const dots = document.querySelector("#regional-dots");

  dots.innerHTML = cities
    .map(city => {
      const p = projectCity(city);

      return `
        <div class="regional-dot" style="left:${p.x}px; top:${p.y}px;">
          <div class="regional-marker"></div>
          <img src="/icons/Sunny.gif" alt="" />
          <div class="regional-temp">84°</div>
          <div class="regional-name">${city.name}</div>
        </div>
      `;
    })
    .join("");
}