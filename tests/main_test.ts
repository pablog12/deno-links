import { assertEquals, assertNotEquals, assertRejects } from "@std/assert";
import server from "../src/main.ts";
import { generateShortCode } from "../src/db.ts";
import { delay } from "jsr:@std/async/delay";

Deno.test("Health check", async () => {
  const req = new Request("http://0.0.0.0:8000/health-check");
  const res = await server.fetch(req);
  assertEquals(await res.text(), "OK");
});

Deno.test("URL Shortener", async (t) => {
  await t.step("Should generate short code from a valid URL", async () => {
    const shortCode = await generateShortCode(
      "https://www.google.com/some/long/url",
    );
    assertEquals(typeof shortCode, "string");
    assertEquals(shortCode.length, 12);
  });

  await t.step("Should be unique for each timestamp", async () => {
    const url = "https://www.google.com";
    const shortCode1 = await generateShortCode(url);
    await delay(5);
    const shortCode2 = await generateShortCode(url);
    assertNotEquals(shortCode1, shortCode2);
  });

  await t.step("Throw Error on invalid URL", () => {
    const invalidUrl = "invalid-url";
    assertRejects(async () => await generateShortCode(invalidUrl));
  });
});
