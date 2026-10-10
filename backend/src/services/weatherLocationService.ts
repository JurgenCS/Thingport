import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";

// "device" came from the browser's location, "manual" from a place the user searched for.
export const weatherLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  name: z.string().trim().max(120).nullable(),
  source: z.enum(["device", "manual"]),
});
export type WeatherLocation = z.infer<typeof weatherLocationSchema>;

/** Stored per user, not per browser, so every device shows the same weather. */
export async function getWeatherLocation(userId: string): Promise<WeatherLocation | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { weatherLocation: true } });
  const parsed = weatherLocationSchema.safeParse(user?.weatherLocation);
  return parsed.success ? parsed.data : null;
}

export async function setWeatherLocation(
  userId: string,
  location: WeatherLocation | null,
): Promise<WeatherLocation | null> {
  await prisma.user.update({ where: { id: userId }, data: { weatherLocation: location ?? Prisma.DbNull } });
  return location;
}
