export function normalizeCondition(condition) {
  const text = String(condition || "").toLowerCase();

  if (text.includes("thunder")) return "Thunderstorm";
  if (text.includes("snow")) return "Snow";
  if (text.includes("rain") || text.includes("showers")) return "Rain";
  if (text.includes("fog")) return "Fog";
  if (text.includes("mostly cloudy")) return "Mostly Cloudy";
  if (text.includes("partly cloudy")) return "Partly Cloudy";
  if (text.includes("partly sunny")) return "Partly Cloudy";
  if (text.includes("mostly sunny")) return "Mostly Sunny";
  if (text.includes("sunny")) return "Sunny";
  if (text.includes("clear")) return "Clear";
  if (text.includes("cloudy")) return "Cloudy";

  return "Cloudy";
}

export function getIconPath(condition, isDaytime = true) {
  const clean = normalizeCondition(condition);

  const dayIcons = {
    Sunny: "Sunny.gif",
    Clear: "Sunny.gif",
    "Mostly Sunny": "Partly-Cloudy.gif",
    "Partly Cloudy": "Partly-Cloudy.gif",
    "Mostly Cloudy": "Mostly-Cloudy.gif",
    Cloudy: "Cloudy.gif",
    Rain: "Rain-1992.gif",
    Snow: "Light-Snow.gif",
    Thunderstorm: "Thunderstorm.gif",
    Fog: "Fog.gif"
  };

  const nightIcons = {
    Sunny: "Clear.gif",
    Clear: "Clear.gif",
    "Mostly Sunny": "Partly-Clear.gif",
    "Partly Cloudy": "Partly-Clear.gif",
    "Mostly Cloudy": "Mostly-Clear.gif",
    Cloudy: "Cloudy.gif",
    Rain: "Rain-1992.gif",
    Snow: "Light-Snow.gif",
    Thunderstorm: "Thunderstorm.gif",
    Fog: "Fog.gif"
  };

  const file = isDaytime ? dayIcons[clean] : nightIcons[clean];

  return `/icons/${file || "Cloudy.gif"}`;
}