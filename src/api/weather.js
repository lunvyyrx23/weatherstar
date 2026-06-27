import { cleanStationDisplayName, cleanCityLabel } from "../utils/text.js";

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

function inHgFromPa(pa) {
  if (pa === null || pa === undefined || Number.isNaN(pa)) return null;
  return pa * 0.00029529983071445;
}

function feetFromMeters(meters) {
  if (meters === null || meters === undefined || Number.isNaN(meters)) return null;
  return Math.round(meters * 3.28084);
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

function calcWindChill(tempF, windMph) {
  if (tempF === null || windMph === null) return null;
  if (tempF > 50 || windMph < 3) return null;

  const v16 = Math.pow(windMph, 0.16);

  return Math.round(
    35.74 +
      0.6215 * tempF -
      35.75 * v16 +
      0.4275 * tempF * v16
  );
}

function calcHeatIndex(tempF, humidity) {
  if (tempF === null || humidity === null) return null;
  if (tempF < 80 || humidity < 40) return null;

  const T = tempF;
  const R = humidity;

  const hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  return Math.round(hi);
}

function getFeelsLike(tempF, humidity, windMph) {
  const heatIndex = calcHeatIndex(tempF, humidity);
  const windChill = calcWindChill(tempF, windMph);

  if (heatIndex !== null) {
    return {
      label: "Heat Index:",
      value: `${heatIndex}°`
    };
  }

  if (windChill !== null) {
    return {
      label: "Wind Chill:",
      value: `${windChill}°`
    };
  }

  return {
    label: "Feels Like:",
    value: tempF !== null ? `${tempF}°` : "--"
  };
}

function getCeiling(cloudLayers) {
  if (!Array.isArray(cloudLayers) || cloudLayers.length === 0) {
    return "Unlimited";
  }

  const ceilingLayers = cloudLayers
    .filter(layer => {
      const amount = String(layer.amount || "").toUpperCase();
      return ["BKN", "OVC", "VV"].includes(amount) && layer.base?.value !== null;
    })
    .map(layer => feetFromMeters(layer.base.value))
    .filter(value => value !== null);

  if (!ceilingLayers.length) {
    return "Unlimited";
  }

  return `${Math.min(...ceilingLayers)} Ft`;
}

function observationIsFresh(timestamp) {
  if (!timestamp) return false;

  const obsTime = new Date(timestamp).getTime();
  const now = Date.now();

  if (Number.isNaN(obsTime)) return false;

  const ageMinutes = (now - obsTime) / 1000 / 60;

  return ageMinutes >= 0 && ageMinutes <= 180;
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function getBestLatestObservation(stationsUrl) {
  const stationData = await fetchJson(stationsUrl);
  const stations = stationData.features || [];

  for (const station of stations.slice(0, 8)) {
    const stationId = station.properties?.stationIdentifier;
    const stationName = station.properties?.name || stationId;

    if (!stationId) continue;

    try {
      const obs = await fetchJson(
        `https://api.weather.gov/stations/${stationId}/observations/latest`
      );

      const props = obs.properties;

      if (!props) continue;

      const tempF = fFromC(props.temperature?.value);
      const condition = props.textDescription;
      const timestamp = props.timestamp;

      if (tempF === null || !condition) continue;
      if (!observationIsFresh(timestamp)) continue;

      const humidity =
        props.relativeHumidity?.value !== null &&
        props.relativeHumidity?.value !== undefined
          ? Math.round(props.relativeHumidity.value)
          : null;

      const dewpointF = fFromC(props.dewpoint?.value);
      const windMph = mphFromKph(props.windSpeed?.value);
      const windDir = degToCompass(props.windDirection?.value);
      const visibilityMiles = milesFromMeters(props.visibility?.value);
      const pressureInHg = inHgFromPa(props.barometricPressure?.value);
      const ceiling = getCeiling(props.cloudLayers);
      const feels = getFeelsLike(tempF, humidity, windMph);

      return {
        stationId,
        stationName,
        observationTime: timestamp,
        temp: tempF,
        condition,
        wind:
          windMph !== null && windMph < 3
            ? "Calm"
            : windMph !== null
              ? `${windDir} ${windMph} mph`
              : "--",
        stats: {
          humidity: humidity !== null ? `${humidity}%` : "--",
          dewpoint: dewpointF !== null ? `${dewpointF}°` : "--",
          ceiling,
          visibility:
            visibilityMiles !== null ? `${visibilityMiles.toFixed(1)} mi.` : "--",
          pressure:
            pressureInHg !== null ? `${pressureInHg.toFixed(2)} in` : "--",
          feelsLabel: feels.label,
          feelsValue: feels.value
        }
      };
    } catch {
      // Try next station.
    }
  }

  return null;
}

export async function getWeatherForCoords(lat, lon, label = "Unknown") {
  const pointData = await fetchJson(`https://api.weather.gov/points/${lat},${lon}`);

  const hourlyUrl = pointData.properties.forecastHourly;
  const stationsUrl = pointData.properties.observationStations;

  const hourlyData = await fetchJson(hourlyUrl);
  const currentForecast = hourlyData.properties.periods[0];

  const observation = await getBestLatestObservation(stationsUrl);

  if (observation) {
    return {
      source: "observation",
      location: label,
      displayLocation: cleanStationDisplayName(
        observation.stationName,
        observation.stationId
      ),
      coords: { lat, lon },
      stationsUrl,
      stationId: observation.stationId,
      stationName: observation.stationName,
      observationTime: observation.observationTime,
      temp: observation.temp,
      condition: observation.condition,
      wind: observation.wind,
      isDaytime: currentForecast.isDaytime,
      hourly: hourlyData.properties.periods,
      stats: observation.stats
    };
  }

  return {
    source: "forecast-fallback",
    location: label,
    displayLocation: cleanCityLabel(label),
    coords: { lat, lon },
    stationsUrl,
    stationId: null,
    stationName: null,
    observationTime: null,
    temp: currentForecast.temperature,
    condition: currentForecast.shortForecast,
    wind: `${currentForecast.windDirection} ${currentForecast.windSpeed}`,
    isDaytime: currentForecast.isDaytime,
    hourly: hourlyData.properties.periods,
    stats: {
      humidity: "--",
      dewpoint: "--",
      ceiling: "--",
      visibility: "--",
      pressure: "--",
      feelsLabel: "Feels Like:",
      feelsValue: `${currentForecast.temperature}°`
    }
  };
}