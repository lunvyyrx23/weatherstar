export async function getPointData(lat, lon) {
  const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`);

  if (!response.ok) {
    throw new Error(`NWS point request failed: ${response.status}`);
  }

  return response.json();
}

export async function getHourlyForecast(hourlyUrl) {
  const response = await fetch(hourlyUrl);

  if (!response.ok) {
    throw new Error(`NWS hourly request failed: ${response.status}`);
  }

  return response.json();
}

export async function getCurrentWeatherForCharlotte() {
  const lat = 35.2271;
  const lon = -80.8431;

  const pointData = await getPointData(lat, lon);
  const hourlyUrl = pointData.properties.forecastHourly;

  const hourlyData = await getHourlyForecast(hourlyUrl);
  const current = hourlyData.properties.periods[0];

  return {
    temp: current.temperature,
    condition: current.shortForecast,
    wind: `${current.windDirection} ${current.windSpeed}`,
    isDaytime: current.isDaytime
  };
}