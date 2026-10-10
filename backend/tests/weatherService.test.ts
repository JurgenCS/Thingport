import { afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { getForecast, getPlaceName, searchPlaces, setWeatherFetchForTest } from "../src/services/weatherService";

const app = createApp();
let token: string;

const FORECAST = {
  current: { temperature_2m: 10.6, weather_code: 3 },
  hourly: { temperature_2m: [10, 10, 10, 10, 10, 10, 8.4], weather_code: [3, 3, 3, 3, 3, 3, 61] },
  daily: { temperature_2m_max: [11.4], temperature_2m_min: [6.6] },
};

type Call = { url: URL; headers: Record<string, string> };

/** Answers like the outside services would, and records every request. */
function fakeServices(answer: (url: URL) => unknown = () => FORECAST, status = 200): Call[] {
  const calls: Call[] = [];
  setWeatherFetchForTest(async (input, init) => {
    const url = new URL(String(input));
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
    return new Response(JSON.stringify(answer(url)), { status, headers: { "content-type": "application/json" } });
  });
  return calls;
}

beforeAll(async () => {
  token = (
    await request(app)
      .post("/api/register")
      .send({ displayName: "Weather", email: `weather-${Date.now()}@example.com`, password: "password123" })
  ).body.token;
});

afterEach(() => setWeatherFetchForTest());

describe("weather service", () => {
  it("asks for a forecast once per area and keeps it for a while", async () => {
    const calls = fakeServices();
    const forecast = await getForecast(54.68916, 25.2798);
    expect(forecast).toEqual({
      temperature: 11,
      code: 3,
      high: 11,
      low: 7,
      later: { hours: 6, temperature: 8, code: 61 },
    });
    // A few hundred metres away is the same area.
    await getForecast(54.6912, 25.2774);
    expect(calls).toHaveLength(1);
    // Coordinates are rounded before they leave the server.
    expect(calls[0].url.searchParams.get("latitude")).toBe("54.69");
    expect(calls[0].headers["User-Agent"]).toMatch(/^Thingport\//);
  });

  it("caches place searches per language", async () => {
    const calls = fakeServices(() => ({
      results: [{ name: "Vilnius", country: "Lietuva", latitude: 54.69, longitude: 25.28, population: 1 }],
    }));
    expect(await searchPlaces("Vilnius", "lt")).toEqual([
      { name: "Vilnius", admin1: undefined, country: "Lietuva", latitude: 54.69, longitude: 25.28 },
    ]);
    await searchPlaces(" vilnius ", "lt");
    await searchPlaces("Vilnius", "en");
    expect(calls).toHaveLength(2);
  });

  it("names a place with an identifying User-Agent, at most once a second", async () => {
    const calls = fakeServices(() => ({ address: { city: "Šiauliai" } }));
    const started = Date.now();
    expect(await getPlaceName(55.93, 23.31, "lt")).toBe("Šiauliai");
    expect(await getPlaceName(56.1, 24.0, "lt")).toBe("Šiauliai");
    expect(Date.now() - started).toBeGreaterThanOrEqual(1000);
    expect(calls[0].headers["User-Agent"]).toMatch(/^Thingport\//);
    expect(calls[0].headers["Accept-Language"]).toBe("lt");
    // Already named: no third request.
    await getPlaceName(55.93, 23.31, "lt");
    expect(calls).toHaveLength(2);
  });
});

describe("weather routes", () => {
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it("returns the forecast, and 502 when the weather service is down", async () => {
    fakeServices();
    const ok = await request(app).get("/api/dashboard/weather?lat=54.69&lon=25.28").set(auth());
    expect(ok.status).toBe(200);
    expect(ok.body.temperature).toBe(11);
    fakeServices(() => ({}), 503);
    const down = await request(app).get("/api/dashboard/weather?lat=10&lon=10").set(auth());
    expect(down.status).toBe(502);
    expect(down.body.code).toBe("WEATHER_UNAVAILABLE");
  });

  it("rejects coordinates off the globe and too-short searches", async () => {
    fakeServices();
    expect((await request(app).get("/api/dashboard/weather?lat=91&lon=0").set(auth())).status).toBe(400);
    expect((await request(app).get("/api/dashboard/weather/places?q=a").set(auth())).status).toBe(400);
  });

  it("needs a signed-in user", async () => {
    expect((await request(app).get("/api/dashboard/weather?lat=1&lon=1")).status).toBe(401);
  });
});
