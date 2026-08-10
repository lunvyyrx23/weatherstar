import { getIconPath } from "../utils/icons.js";

function formatDayTime(startTime) {
  const date = new Date(startTime);

  const day = date.toLocaleDateString([], {
    weekday: "short"
  });

  const hour = date
    .toLocaleTimeString([], {
      hour: "numeric",
      hour12: true
    })
    .replace(":00", "");

  return `${day} ${hour}`;
}

function getFeelsLike(period) {
  return period.temperature;
}

function formatWind(period) {
  const dir = String(period.windDirection || "").toUpperCase();

  const speed = String(period.windSpeed || "")
    .replace(" mph", "")
    .replace(" MPH", "")
    .trim();

  if (!dir || !speed) return "--";

  return `${dir}${speed}`;
}

export function renderHourlyForecastPage(hourly = []) {
  const page = document.querySelector("#page-hourly");

  if (!page) return;

  if (!hourly || hourly.length === 0) {
    page.innerHTML = `
      <div id="hourly-message" data-edit-id="hourly-message">
        Loading Hourly Forecast
      </div>
    `;
    return;
  }

  const rows = hourly
    .slice(0, 23)
    .map(period => {
      return `
        <div class="hourly-row">
          <div class="hourly-time">${formatDayTime(period.startTime)}</div>

          <img
            class="hourly-icon"
            src="${getIconPath(period.shortForecast, period.isDaytime)}"
            alt=""
          />

          <div class="hourly-temp">${period.temperature}</div>
          <div class="hourly-like">${getFeelsLike(period)}</div>
          <div class="hourly-wind">${formatWind(period)}</div>
        </div>
      `;
    })
    .join("");

  page.innerHTML = `
    <div id="hourly-window" data-edit-id="hourly-window">
      <div id="hourly-table" data-edit-id="hourly-table">
        ${rows}
      </div>
    </div>
  `;
}