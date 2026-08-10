import { cities } from "../map/cities.js";

function fFromC(celsius) {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return null;
  return Math.round((celsius * 9) / 5 + 32);
}

function fallback(city) {
  return {
    slug: city.slug,
    name: city.name,
    temp: "--",
    condition: "Cloudy",
    isDaytime: true,
    source: "fallback"
  };
}

async function fetchJson(url, timeoutMs = 7000) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function observationIsFresh(timestamp) {
  if (!timestamp) return false;

  const obsTime = new Date(timestamp).getTime();
  const now = Date.now();

  if (Number.isNaN(obsTime)) return false;

  const ageMinutes = (now - obsTime) / 1000 / 60;

  return ageMinutes >= 0 && ageMinutes <= 180;
}

async function getForecastFallback(city, pointData) {
  try {
    const hourlyUrl = pointData.properties.forecastHourly;
    const hourlyData = await fetchJson(hourlyUrl);
    const current = hourlyData.properties.periods[0];

    return {
      slug: city.slug,
      name: city.name,
      temp: current.temperature,
      condition: current.shortForecast,
      isDaytime: current.isDaytime,
      source: "forecast-fallback"
    };
  } catch {
    return fallback(city);
  }
}

async function getObservedWeather(city, pointData) {
  const stationsUrl = pointData.properties.observationStations;
  const stationData = await fetchJson(stationsUrl);
  const stations = stationData.features || [];

  for (const station of stations.slice(0, 6)) {
    const stationId = station.properties?.stationIdentifier;
    const stationName = station.properties?.name || stationId;

    if (!stationId) continue;

    try {
      const obs = await fetchJson(
        `https://api.weather.gov/stations/${stationId}/observations/latest`
      );

      const props = obs.properties;

      if (!props) continue;
      if (!observationIsFresh(props.timestamp)) continue;

      const tempF = fFromC(props.temperature?.value);
      const condition = props.textDescription;

      if (tempF === null || !condition) continue;

      return {
        slug: city.slug,
        name: city.name,
        temp: tempF,
        condition,
        isDaytime: true,
        source: "observation",
        stationId,
        stationName,
        observationTime: props.timestamp
      };
    } catch {
      // Try next station.
    }
  }

  return null;
}

async function getCityRegionalWeather(city) {
  try {
    const pointData = await fetchJson(
      `https://api.weather.gov/points/${city.lat},${city.lon}`
    );

    const observed = await getObservedWeather(city, pointData);

    if (observed) {
      return observed;
    }

    return await getForecastFallback(city, pointData);
  } catch (error) {
    console.warn(`Regional failed for ${city.name}`, error);
    return fallback(city);
  }
}

export async function getRegionalWeather() {
  return Promise.all(cities.map(city => getCityRegionalWeather(city)));
}