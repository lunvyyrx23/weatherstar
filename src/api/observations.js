function fFromC(celsius) {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return null;
  return Math.round((celsius * 9) / 5 + 32);
}

function mphFromKph(kph) {
  if (kph === null || kph === undefined || Number.isNaN(kph)) return null;
  return Math.round(kph * 0.621371);
}

function milesFromMeters(meters) {
  if (meters === null || meters === undefined || Number.isNaN(meters)) return null;
  return meters * 0.000621371;
}

function degToCompass(degrees) {
  if (degrees === null || degrees === undefined || Number.isNaN(degrees)) return "";

  const dirs = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];

  return dirs[Math.round(degrees / 22.5) % 16];
}

function cleanStationName(name, stationId) {
  return String(name || stationId || "")
    .replace(/International Airport/gi, "INTL")
    .replace(/Municipal Airport/gi, "MUNI")
    .replace(/Regional Airport/gi, "RGNL")
    .replace(/Airport/gi, "ARPT")
    .toUpperCase();
}

function observationAgeMinutes(timestamp) {
  if (!timestamp) return null;

  const obsTime = new Date(timestamp).getTime();
  const now = Date.now();

  if (Number.isNaN(obsTime)) return null;

  return Math.round((now - obsTime) / 1000 / 60);
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function getStationObservation(station) {
  const stationId = station.properties?.stationIdentifier;
  const stationName = station.properties?.name || stationId;

  if (!stationId) return null;

  const obs = await fetchJson(
    `https://api.weather.gov/stations/${stationId}/observations/latest`
  );

  const props = obs.properties;
  if (!props) return null;

  const age = observationAgeMinutes(props.timestamp);

  // Keep it accurate. Ignore old/stale station reports.
  if (age === null || age < 0 || age > 180) return null;

  const tempF = fFromC(props.temperature?.value);
  const condition = props.textDescription || "--";

  if (tempF === null) return null;

  const windMph = mphFromKph(props.windSpeed?.value);
  const windDir = degToCompass(props.windDirection?.value);
  const visibilityMiles = milesFromMeters(props.visibility?.value);

  return {
    stationId,
    stationName: cleanStationName(stationName, stationId),
    temp: `${tempF}`,
    condition,
    wind:
      windMph !== null && windMph < 3
        ? "CALM"
        : windMph !== null
          ? `${windDir} ${windMph}`
          : "--",
    humidity:
      props.relativeHumidity?.value !== null &&
      props.relativeHumidity?.value !== undefined
        ? `${Math.round(props.relativeHumidity.value)}%`
        : "--",
    visibility:
      visibilityMiles !== null ? `${visibilityMiles.toFixed(1)}` : "--",
    age: `${age} MIN`
  };
}

export async function getLatestObservations(stationsUrl, maxRows = 8) {
  if (!stationsUrl) return [];

  const stationData = await fetchJson(stationsUrl);
  const stations = stationData.features || [];

  const results = [];

  for (const station of stations.slice(0, 14)) {
    try {
      const observation = await getStationObservation(station);

      if (observation) {
        results.push(observation);
      }

      if (results.length >= maxRows) break;
    } catch {
      // Skip broken station and keep going.
    }
  }

  return results;
}