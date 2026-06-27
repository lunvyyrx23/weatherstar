export function titleCase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\b[a-z]/g, letter => letter.toUpperCase())
    .replace(/\bNws\b/g, "NWS")
    .replace(/\bUsa\b/g, "USA")
    .replace(/\bIntl\b/g, "Intl")
    .replace(/\bMuni\b/g, "Muni")
    .replace(/\bRgnl\b/g, "Rgnl")
    .replace(/\bArpt\b/g, "Arpt")
    .replace(/\bMph\b/g, "MPH");
}

export function cleanStationDisplayName(name, stationId = "") {
  const stationOverrides = {
    KDNL: "Augusta Daniel Field",
    KAGS: "Augusta Bush Field",
    KCLT: "Charlotte/Douglas Intl",
    KJQF: "Concord Rgnl",
    KNYC: "New York City",
    KLGA: "LaGuardia",
    KJFK: "Kennedy Intl",
    KEWR: "Newark Liberty Intl",
    KSEA: "Seattle-Tacoma Intl",
    KBFI: "Seattle Boeing Field",
    KPIB: "Hattiesburg-Laurel Rgnl",
    KHBG: "Hattiesburg Bobby Chain Muni"
  };

  if (stationOverrides[stationId]) {
    return stationOverrides[stationId];
  }

  return titleCase(
    String(name || stationId || "")
      .replace(/International Airport/gi, "Intl")
      .replace(/Municipal Airport/gi, "Muni")
      .replace(/Regional Airport/gi, "Rgnl")
      .replace(/Airport/gi, "Arpt")
  );
}

export function cleanCityLabel(label) {
  const city = String(label || "")
    .split(",")[0]
    .trim();

  const cityOverrides = {
    nyc: "New York City",
    "new york": "New York City",
    "new york city": "New York City"
  };

  const key = city.toLowerCase();

  return cityOverrides[key] || titleCase(city);
}

export function getCurrentDisplayLocation(weather) {
  if (weather?.displayLocation) {
    return weather.displayLocation;
  }

  return cleanCityLabel(weather?.location);
}