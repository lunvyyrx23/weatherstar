import { getIconPath, normalizeCondition } from "../utils/icons.js";

export function renderCurrentPage(weather) {
  const page = document.querySelector("#page-current");

  const stats = weather.stats || {
    humidity: "--",
    dewpoint: "--",
    ceiling: "--",
    visibility: "--",
    pressure: "--",
    feelsLabel: "Feels Like:",
    feelsValue: "--"
  };

  page.innerHTML = `
    <img
      id="cc-icon"
      data-edit-id="cc-icon"
      src="${getIconPath(weather.condition, weather.isDaytime)}"
      alt=""
    />

    <div id="cc-temp" data-edit-id="cc-temp">${weather.temp}°</div>

    <div id="cc-cond" data-edit-id="cc-cond">
      ${normalizeCondition(weather.condition)}
    </div>

    <div id="cc-wind" data-edit-id="cc-wind">
      Wind: ${weather.wind}
    </div>

    <div id="loc-name" data-edit-id="loc-name">
      ${weather.location}
    </div>

    <div id="cc-stats" data-edit-id="cc-stats">
      <div>Humidity:</div><div>${stats.humidity}</div>
      <div>Dewpoint:</div><div>${stats.dewpoint}</div>
      <div>Ceiling:</div><div>${stats.ceiling}</div>
      <div>Visibility:</div><div>${stats.visibility}</div>
      <div>Pressure:</div><div>${stats.pressure}</div>
      <div>${stats.feelsLabel}</div><div>${stats.feelsValue}</div>
    </div>
  `;
}