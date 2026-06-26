const STATE_MAP = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia"
};

function titleCase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

export async function geocodeLocation(input) {
  const raw = String(input || "").trim();

  if (!raw) {
    throw new Error("Enter a city or lat,lon.");
  }

  const latLonMatch = raw.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);

  if (latLonMatch) {
    return {
      lat: Number(latLonMatch[1]),
      lon: Number(latLonMatch[2]),
      label: raw
    };
  }

  const cityStateMatch = raw.match(/^(.+?),\s*([A-Z]{2})$/i);
  const city = cityStateMatch ? cityStateMatch[1].trim() : raw;
  const stateAbbr = cityStateMatch ? cityStateMatch[2].toUpperCase() : null;
  const stateName = stateAbbr ? STATE_MAP[stateAbbr] : null;

  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}` +
    `&count=10&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Geocoding failed.");
  }

  const data = await response.json();
  const results = data.results || [];

  const match = stateName
    ? results.find(place =>
        place.country_code === "US" &&
        String(place.admin1 || "").toLowerCase() === stateName.toLowerCase()
      )
    : results.find(place => place.country_code === "US");

  if (!match) {
    throw new Error(`Could not find ${raw}.`);
  }

  return {
    lat: match.latitude,
    lon: match.longitude,
    label: stateAbbr ? `${titleCase(city)}, ${stateAbbr}` : `${match.name}, ${match.admin1}`
  };
}