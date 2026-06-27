import { getIconPath, normalizeCondition } from "../utils/icons.js";
import { getCurrentDisplayLocation, titleCase } from "../utils/text.js";

export function renderCurrentPage(weather) {
  const page = document.querySelector("#page-current");
  const banner = document.querySelector("#bottom-banner");

  const stats = weather.stats || {
    humidity: "--",
    dewpoint: "--",
    ceiling: "--",
    visibility: "--",
    pressure: "--",
    feelsLabel: "Feels Like:",
    feelsValue: "--"
  };

  const locationName = getCurrentDisplayLocation(weather);

  if (banner) {
    banner.textContent = `Conditions at ${locationName}`;
  }

  page.innerHTML = `
    <img
      id="cc-icon"
      data-edit-id="cc-icon"
      src="${getIconPath(weather.condition, weather.isDaytime)}"
      alt=""
    />

    <div id="cc-temp" data-edit-id="cc-temp">${weather.temp}°</div>

    <div id="cc-cond" data-edit-id="cc-cond">
      ${titleCase(normalizeCondition(weather.condition))}
    </div>

    <div id="cc-wind" data-edit-id="cc-wind">
      Wind: ${String(weather.wind || "--").toUpperCase()}
    </div>

    <div id="loc-name" data-edit-id="loc-name">
      ${locationName}
    </div>

    <div id="cc-stats" data-edit-id="cc-stats">
      <div>Humidity:</div><div>${stats.humidity}</div>
      <div>Dewpoint:</div><div>${stats.dewpoint}</div>
      <div>Ceiling:</div><div>${titleCase(stats.ceiling)}</div>
      <div>Visibility:</div><div>${stats.visibility}</div>
      <div>Pressure:</div><div>${stats.pressure}</div>
      <div>${titleCase(stats.feelsLabel)}</div><div>${stats.feelsValue}</div>
    </div>
  `;
}