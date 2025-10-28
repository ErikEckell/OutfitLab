import axios from "axios";

// 1) Geocoding: city name -> lat/lon
async function geocodeCity(name) {
  if (!name) return null;
  const url = "https://geocoding-api.open-meteo.com/v1/search";

  const trimmed = name.trim();
  if (!trimmed) return null;

  const variants = [];

  if (trimmed.includes(",")) {
    const parts = trimmed
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const maybeCity = parts[0];
    const maybeCountry = parts[parts.length - 1];
    const countryCode =
      maybeCountry?.length === 2 ? maybeCountry.toUpperCase() : null;

    if (maybeCity) {
      if (countryCode) {
        variants.push({ name: maybeCity, country: countryCode });
      }
      variants.push({ name: maybeCity });
    }
  }

  variants.push({ name: trimmed });

  for (const variant of variants) {
    const { data } = await axios.get(url, {
      params: {
        name: variant.name,
        ...(variant.country ? { country: variant.country } : {}),
        count: 5,
        language: "es",
        format: "json",
      },
    });
    if (!data?.results?.length) continue;

    const match =
      (variant.country &&
        data.results.find(
          (r) =>
            r.country_code?.toUpperCase() === variant.country ||
            r.country?.toUpperCase() === variant.country,
        )) ||
      data.results[0];

    if (!match) continue;

    const c = match;
    return {
      lat: c.latitude,
      lon: c.longitude,
      label: [c.name, c.admin1, c.country].filter(Boolean).join(", "),
      timezone: c.timezone,
    };
  }

  return null;
}

// 1b) Reverse geocoding: lat/lon -> readable label + timezone
async function reverseGeocode(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  const url = "https://geocoding-api.open-meteo.com/v1/reverse";
  try {
    const { data } = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lon,
        count: 5,
        language: "es",
        format: "json",
      },
    });

    if (!data?.results?.length) return null;

    const match =
      data.results.find((r) => r.feature_code === "PPLA") || data.results[0];
    const c = match;

    return {
      lat: c.latitude,
      lon: c.longitude,
      label: [c.name, c.admin1, c.country].filter(Boolean).join(", "),
      timezone: c.timezone,
    };
  } catch (err) {
    console.warn("Reverse geocoding failed:", err?.message ?? err);
    return null;
  }
}

// 2) Forecast (current + daily min/max)
async function getForecast(lat, lon, timezone = "auto") {
  const url = "https://api.open-meteo.com/v1/forecast";
  const { data } = await axios.get(url, {
    params: {
      latitude: lat,
      longitude: lon,
      timezone,
      current: "temperature_2m",
      daily: "temperature_2m_min,temperature_2m_max",
      forecast_days: 1,
      temperature_unit: "celsius",
    },
  });

  const current = data?.current?.temperature_2m;
  const dailyMin = data?.daily?.temperature_2m_min?.[0];
  const dailyMax = data?.daily?.temperature_2m_max?.[0];

  return {
    current: typeof current === "number" ? current : null,
    forecastMin: typeof dailyMin === "number" ? dailyMin : null,
    forecastMax: typeof dailyMax === "number" ? dailyMax : null,
  };
}

// 3) Observed hourly temperatures for today (min/max up to now)
async function getObservedToday(lat, lon, timezone = "auto") {
  const url = "https://archive-api.open-meteo.com/v1/archive";
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await axios.get(url, {
    params: {
      latitude: lat,
      longitude: lon,
      timezone,
      start_date: today,
      end_date: today,
      hourly: "temperature_2m",
      temperature_unit: "celsius",
    },
  });

  const temps = data?.hourly?.temperature_2m ?? [];
  if (!temps.length) return { observedMin: null, observedMax: null };

  const times = data.hourly.time;
  const now = Date.now();
  const observed = temps.filter((_, i) => {
    const t = new Date(times[i]).getTime();
    return Number.isFinite(t) && t <= now;
  });

  if (!observed.length) return { observedMin: null, observedMax: null };

  const observedMin = Math.min(...observed);
  const observedMax = Math.max(...observed);
  return { observedMin, observedMax };
}

// 4) Main function
const fetchWeather = async (input) => {
  try {
    let geo = null;
    let lat = null;
    let lon = null;
    let allowReverseLookup = true;

    const ensureGeoFromCoords = async (latitude, longitude) => {
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return null;
      }
      if (allowReverseLookup) {
        const fromReverse = await reverseGeocode(latitude, longitude);
        if (fromReverse) return fromReverse;
      }
      return {
        lat: latitude,
        lon: longitude,
        label: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        timezone: "auto",
      };
    };

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (trimmed) {
        geo = await geocodeCity(trimmed);
      }
    } else if (input && typeof input === "object") {
      if (typeof input.reverseGeocode === "boolean") {
        allowReverseLookup = input.reverseGeocode;
      }

      const possibleName =
        typeof input.city === "string" && input.city.trim()
          ? input.city.trim()
          : typeof input.name === "string" && input.name.trim()
          ? input.name.trim()
          : null;

      const latitudeCandidate =
        typeof input.latitude === "number"
          ? input.latitude
          : typeof input.lat === "number"
          ? input.lat
          : null;
      const longitudeCandidate =
        typeof input.longitude === "number"
          ? input.longitude
          : typeof input.lon === "number"
          ? input.lon
          : null;

      if (latitudeCandidate != null && longitudeCandidate != null) {
        lat = latitudeCandidate;
        lon = longitudeCandidate;
        geo = await ensureGeoFromCoords(lat, lon);
      } else if (possibleName) {
        geo = await geocodeCity(possibleName);
      }
    }

    if (!geo && typeof input !== "string" && input != null) {
      const fallbackString = String(input).trim();
      if (fallbackString) {
        geo = await geocodeCity(fallbackString);
      }
    }

    if (!geo) return null;

    lat = typeof geo.lat === "number" ? geo.lat : lat;
    lon = typeof geo.lon === "number" ? geo.lon : lon;

    if (typeof lat !== "number" || typeof lon !== "number") return null;

    const timezone = geo.timezone ?? "auto";

    const [fc, obs] = await Promise.all([
      getForecast(lat, lon, timezone),
      getObservedToday(lat, lon, timezone),
    ]);

    // Include the current temperature in observed min/max for consistency.
    let observedMin = obs.observedMin;
    let observedMax = obs.observedMax;

    if (typeof fc.current === "number") {
      observedMin =
        typeof observedMin === "number" ? Math.min(observedMin, fc.current) : fc.current;
      observedMax =
        typeof observedMax === "number" ? Math.max(observedMax, fc.current) : fc.current;
    }

    // Main temperature value.
    let temp = fc.current;
    if (temp == null) {
      temp =
        typeof observedMin === "number" && typeof observedMax === "number"
          ? (observedMin + observedMax) / 2
          : null;
    }

    const label =
      typeof geo.label === "string" && geo.label.trim()
        ? geo.label
        : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

    return {
      label,
      temp: temp != null ? temp.toFixed(1) : null,
      tempMinObserved:
        typeof observedMin === "number" ? observedMin.toFixed(1) : null,
      tempMaxObserved:
        typeof observedMax === "number" ? observedMax.toFixed(1) : null,
      tempMinForecast:
        typeof fc.forecastMin === "number" ? fc.forecastMin.toFixed(1) : null,
      tempMaxForecast:
        typeof fc.forecastMax === "number" ? fc.forecastMax.toFixed(1) : null,
    };
  } catch (err) {
    console.error("Open-Meteo fetch failed:", err);
    return null;
  }
};

export default fetchWeather;
