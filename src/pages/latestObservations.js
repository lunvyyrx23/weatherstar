import { normalizeCondition } from "../utils/icons.js";

function shortenCondition(condition) {
  return normalizeCondition(condition)
    .replace("Thunderstorm", "T-Storm")
    .replace("Mostly Cloudy", "M Cloudy")
    .replace("Partly Cloudy", "P Cloudy")
    .toUpperCase();
}

export function renderLatestObservationsPage(observations, status = "") {
  const page = document.querySelector("#page-latest");

  if (!observations || observations.length === 0) {
    page.innerHTML = `
      <div id="latest-message" data-edit-id="latest-message">
        ${status || "NO RECENT OBSERVATIONS"}
      </div>
    `;
    return;
  }

  const rows = observations
    .map(obs => {
      return `
        <div class="latest-row">
          <div class="latest-station">${obs.stationName}</div>
          <div>${obs.temp}</div>
          <div>${shortenCondition(obs.condition)}</div>
          <div>${obs.wind}</div>
        </div>
      `;
    })
    .join("");

  page.innerHTML = `
    <div id="latest-table" data-edit-id="latest-table">
      ${rows}
    </div>
  `;
}