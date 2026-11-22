import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLACK_FRIDAY } from "@/data/campaign";
import { STANDING_STEPS, stepsOf } from "@/data/gift";

const END = Date.parse(BLACK_FRIDAY.ends);
const FRIDAY = stepsOf(BLACK_FRIDAY);

/** Loads the clock fresh, as a build made at that moment would. */
async function clockBuiltAt(builtAt: number) {
  vi.resetModules();
  vi.stubEnv("SITE_BUILT_AT", String(builtAt));
  const clock = await import("./offer-clock");
  const campaign = await import("@/data/campaign");
  const gift = await import("@/data/gift");
  return {
    ...clock,
    friday: gift.stepsOf(campaign.BLACK_FRIDAY),
    standing: gift.STANDING_STEPS,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("the offer a browser shows", () => {
  it("starts from the offer the page was built with, then follows the clock", async () => {
    // Built ten days before the end, opened a day after it.
    vi.setSystemTime(END + 86_400_000);
    const clock = await clockBuiltAt(END - 10 * 86_400_000);
    expect(clock.offerAsBuilt()).toBe(clock.friday);
    expect(clock.offerNow()).toBe(clock.standing);
  });

  it("is the standing offer from the first byte in a build made after the end", async () => {
    vi.setSystemTime(END + 86_400_000);
    const clock = await clockBuiltAt(END + 1000);
    expect(clock.offerAsBuilt()).toBe(clock.standing);
    expect(clock.offerNow()).toBe(clock.standing);
  });

  it("is the campaign in a build made and read before the end", async () => {
    vi.setSystemTime(END - 86_400_000);
    const clock = await clockBuiltAt(END - 10 * 86_400_000);
    expect(clock.offerAsBuilt()).toBe(clock.friday);
    expect(clock.offerNow()).toBe(clock.friday);
    expect(clock.friday.top.code).toBe(FRIDAY.top.code);
    expect(clock.standing.top.code).toBe(STANDING_STEPS.top.code);
  });

  it("tells an open page at the campaign's last moment, and only then", async () => {
    vi.setSystemTime(END - 5000);
    const clock = await clockBuiltAt(END - 10 * 86_400_000);
    const seen: string[] = [];
    const stop = clock.watchOffer(() => seen.push(clock.offerNow().top.code));
    expect(clock.offerNow()).toBe(clock.friday);

    vi.advanceTimersByTime(4999);
    expect(seen).toEqual([]);
    expect(clock.offerNow()).toBe(clock.friday);

    // The last moment itself still belongs to the campaign.
    vi.advanceTimersByTime(1);
    expect(clock.offerNow()).toBe(clock.friday);

    vi.advanceTimersByTime(1);
    expect(seen).toEqual(["FOUNDER20"]);
    expect(clock.offerNow()).toBe(clock.standing);

    // Nothing more is said afterwards.
    vi.advanceTimersByTime(7 * 86_400_000);
    expect(seen).toEqual(["FOUNDER20"]);
    stop();
  });

  it("waits out an end further away than a browser timer can count", async () => {
    const far = 40 * 86_400_000;
    vi.setSystemTime(END - far);
    const clock = await clockBuiltAt(END - far);
    const seen: string[] = [];
    const stop = clock.watchOffer(() => seen.push(clock.offerNow().top.code));
    vi.advanceTimersByTime(far);
    // Woken once on the way, with the campaign still running.
    expect(seen.every((code) => code === "FRIDAY25")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(seen.at(-1)).toBe("FOUNDER20");
    stop();
  });

  it("stops its timer when nothing is watching any more", async () => {
    vi.setSystemTime(END - 5000);
    const clock = await clockBuiltAt(END - 5000);
    const seen: number[] = [];
    const stop = clock.watchOffer(() => seen.push(1));
    stop();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10_000);
    expect(seen).toEqual([]);
  });

  it("takes the server's word that the campaign is over, whatever its own clock says, and remembers it", async () => {
    const kept = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => kept.get(key) ?? null,
        setItem: (key: string, value: string) => kept.set(key, value),
      },
    });
    // This device's clock is a day slow: by it the campaign still runs.
    vi.setSystemTime(END - 86_400_000);
    const clock = await clockBuiltAt(END - 10 * 86_400_000);
    const seen: string[] = [];
    const stop = clock.watchOffer(() => seen.push(clock.offerNow().top.code));
    expect(clock.offerNow()).toBe(clock.friday);

    clock.campaignOverOnServer();
    expect(seen).toEqual(["FOUNDER20"]);
    expect(clock.offerNow()).toBe(clock.standing);
    stop();

    // After a reload the same device still shows the standing offer.
    const again = await clockBuiltAt(END - 10 * 86_400_000);
    expect(again.offerNow()).toBe(again.standing);
    // A campaign with another end is a new campaign: the note does not hold for it.
    kept.set([...kept.keys()][0], "2027-01-01T00:00:00Z");
    const next = await clockBuiltAt(END - 10 * 86_400_000);
    expect(next.offerNow()).toBe(next.friday);
  });
});
