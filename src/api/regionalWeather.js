import { getWeatherForCoords } from "./weather.js";

const CACHE_TIME = 10 * 60 * 1000;
const cache = new Map();

function getCachedCityWeather(city) {
  const cached = cache.get(city.slug);
  if (!cached) return null;

  const age = Date.now() - cached.savedAt;

  if (age > CACHE_TIME) {
    cache.delete(city.slug);
    return null;
  }

  return cached.weather;
}

async function loadOneCity(city) {
  const cached = getCachedCityWeather(city);

  if (cached) {
    return { city, weather: cached };
  }

  const weather = await getWeatherForCoords(city.lat, city.lon, city.name);

  cache.set(city.slug, {
    savedAt: Date.now(),
    weather
  });

  return { city, weather };
}

export async function getRegionalWeather(cities) {
  const weatherBySlug = {};
  const queue = [...cities];
  const workers = 4;

  async function worker() {
    while (queue.length > 0) {
      const city = queue.shift();

      try {
        const result = await loadOneCity(city);
        weatherBySlug[result.city.slug] = result.weather;
      } catch (error) {
        console.warn(`Regional weather failed for ${city.name}:`, error);
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));

  return weatherBySlug;
}
