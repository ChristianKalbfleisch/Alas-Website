import { BLACK_FRIDAY, CAMPAIGN_END } from "@/data/campaign";
import { type OfferSteps, STANDING_STEPS, stepsAt } from "@/data/gift";

/**
 * Which offer a browser shows. A page is written at build time and read later,
 * so three moments matter:
 *
 * - while the page loads, the browser shows the offer the page was built with,
 *   so its first drawing matches the page it was sent;
 * - from then on it shows the offer in force by its own clock;
 * - at the campaign's last moment a timer tells every part of an open page, so
 *   a tab left open changes over by itself.
 *
 * A device's clock can be wrong. Once the server has refused the campaign's
 * figures from this device, the device takes the campaign as over whatever its
 * own clock says.
 */

/**
 * When this build was made. next.config.ts writes the same stamp into the code
 * that prerenders the pages and the code the browser runs, so both start from
 * the same offer.
 */
export const BUILT_AT = Number(process.env.SITE_BUILT_AT) || Date.now();

/** The offer the pages were prerendered with. */
export const offerAsBuilt = (): OfferSteps => stepsAt(BUILT_AT);

/** Remembers, per campaign end, that the server has said this campaign is over. */
const OVER_KEY = "alas-offer-over";
let overOnServer: boolean | null = null;

function saidOver(): boolean {
  if (overOnServer === null) {
    try {
      overOnServer =
        window.localStorage.getItem(OVER_KEY) === BLACK_FRIDAY.ends;
    } catch {
      overOnServer = false;
    }
  }
  return overOnServer;
}

/** The offer in force now on this device. */
export function offerNow(): OfferSteps {
  return saidOver() ? STANDING_STEPS : stepsAt(Date.now());
}

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
/** The longest wait a browser timer takes; a longer one would fire at once. */
const LONGEST_WAIT = 2 ** 31 - 1;

function tell() {
  for (const listener of listeners) listener();
}

function disarm() {
  if (timer !== null) clearTimeout(timer);
  timer = null;
}

/** Sets the timer for the moment just after the campaign's end. */
function arm() {
  disarm();
  if (CAMPAIGN_END === null) return;
  const left = CAMPAIGN_END - Date.now();
  if (left < 0) return;
  timer = setTimeout(
    () => {
      timer = null;
      tell();
      arm();
    },
    Math.min(left + 1, LONGEST_WAIT),
  );
}

/** A tab that slept through the end hears of it when it is looked at again. */
function wake() {
  tell();
  arm();
}

/** Calls back whenever the offer in force may have changed. Returns how to stop. */
export function watchOffer(onChange: () => void): () => void {
  listeners.add(onChange);
  if (listeners.size === 1) {
    arm();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", wake);
      window.addEventListener("pageshow", wake);
    }
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size > 0) return;
    disarm();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pageshow", wake);
    }
  };
}

/**
 * The server has refused figures from the campaign: by its clock the campaign
 * is over. This device shows the standing offer from now on, and remembers it.
 */
export function campaignOverOnServer() {
  overOnServer = true;
  try {
    window.localStorage.setItem(OVER_KEY, BLACK_FRIDAY.ends);
  } catch {
    // Kept for this page only.
  }
  tell();
}
