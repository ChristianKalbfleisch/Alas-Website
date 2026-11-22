import { describe, expect, it } from "vitest";
import { BLACK_FRIDAY, discounted } from "@/data/campaign";
import { STANDING_STEPS, stepsAt } from "@/data/gift";
import { canOrder, getProduct, isPriced, products } from "@/data/products";
import { formatPrice, MAX_QTY } from "@/lib/cart/cart-math";
import {
  checkPreorder,
  holdsRef,
  isRef,
  lineName,
  listName,
  newRef,
  type Preorder,
  pacificDay,
  preorderNote,
  preorderTags,
  settle,
} from "./preorder";

/** Names and prices are read from the catalogue, so they follow it when it changes. */
const item = (handle: string) => {
  const product = getProduct(handle);
  if (!product || !canOrder(product)) throw new Error(`no price: ${handle}`);
  return product;
};
const cents = (handle: string) => Math.round(item(handle).price * 100);

const byEmail = products.filter((p) => canOrder(p) && !isPriced(p));
const inCheckout = products.find(isPriced);

const CART = [
  { handle: "lemon-pouch", qty: 1 },
  { handle: "discovery-set", qty: 1 },
  { handle: "lemon-sticks-5", qty: 2 },
];
const CART_TOTAL =
  (cents("lemon-pouch") +
    cents("discovery-set") +
    2 * cents("lemon-sticks-5")) /
  100;

/** The offer in force while the campaign runs, and from one second after its end. */
const END = Date.parse(BLACK_FRIDAY.ends);
const DURING = stepsAt(END - 1000);
const AFTER = stepsAt(END + 1000);
const START = DURING.start.percent;
const TOP = DURING.top.percent;

const REF = "k7q2mxd9";
const ON = new Date("2026-11-21T09:30:00Z");

type Line = { handle?: unknown; qty?: unknown };
const totalOf = (lines: Line[]) =>
  lines.reduce(
    (sum, { handle, qty }) => sum + cents(String(handle)) * Number(qty),
    0,
  ) / 100;

/** What the cart sends for these lines at this percentage: the figure to pay is its own sum. */
const sent = (lines: Line[], percent = 0) => ({
  ref: REF,
  lines,
  percent,
  toPay: discounted(totalOf(lines), percent),
});

/** Checks lines alone; the rest of the request is in order. */
const check = (lines: unknown, percent: unknown = 0, offer = DURING) =>
  checkPreorder({ ref: REF, lines, percent, toPay: CART_TOTAL }, offer, ON);

function order(lines: Line[], percent = 0, offer = DURING): Preorder {
  const checked = checkPreorder(sent(lines, percent), offer, ON);
  if (!checked.ok) throw new Error(checked.error);
  return checked.order;
}

describe("checkPreorder", () => {
  it("prices every line from the catalogue, with its quantity", () => {
    const got = order(CART, START);
    expect(got.lines).toEqual(
      CART.map(({ handle, qty }) => ({
        handle,
        name: listName(item(handle)),
        qty,
        each: item(handle).price,
        total: (cents(handle) * qty) / 100,
      })),
    );
    expect(got.total).toBe(CART_TOTAL);
    expect(got.percent).toBe(START);
    expect(got.toPay).toBe(discounted(CART_TOTAL, START));
    expect(got.ref).toBe(REF);
    expect(got.day).toBe("2026-11-21");
  });

  it("comes to the figures written out here: $49.99 + $39.00 + 2 × $12.99 is $114.97, and $109.22 at 5% off", () => {
    const got = order(CART, 5);
    expect(got.lines.map((line) => [line.name, line.each, line.total])).toEqual(
      [
        ["Lemon Pouch", 49.99, 49.99],
        ["Discovery Set", 39, 39],
        ["Lemon Sticks (pack of 5)", 12.99, 25.98],
      ],
    );
    expect(got.total).toBe(114.97);
    expect(got.toPay).toBe(109.22);
  });

  it("takes every product the store's checkout cannot charge for yet", () => {
    expect(byEmail.length).toBeGreaterThan(0);
    for (const product of byEmail) {
      expect(
        checkPreorder(sent([{ handle: product.handle, qty: 1 }]), DURING, ON)
          .ok,
        product.handle,
      ).toBe(true);
    }
  });

  it("ignores any amount the browser sends with a line", () => {
    const got = order([
      {
        handle: "lemon-pouch",
        qty: 2,
        each: 0.01,
        total: 0.02,
        price: 1,
      } as Line,
    ]);
    expect(got.total).toBe((cents("lemon-pouch") * 2) / 100);
    expect(got.toPay).toBe(got.total);
  });

  it("adds up two lines of the same product", () => {
    const lines = [
      { handle: "lemon-pouch", qty: 1 },
      { handle: "lemon-pouch", qty: 2 },
    ];
    const got = order(lines);
    expect(got.lines).toHaveLength(1);
    expect(got.lines[0].qty).toBe(3);
  });

  it("refuses a product it does not know", () => {
    expect(check([{ handle: "sea-water", qty: 1 }])).toEqual({
      ok: false,
      error: "invalid_lines",
    });
    // One bad line refuses the whole pre-order, so nothing is half saved.
    expect(check([...CART, { handle: "sea-water", qty: 1 }]).ok).toBe(false);
  });

  it("refuses a retired name instead of turning it into today's product", () => {
    for (const handle of ["family-box", "welcome-box", "mesos"]) {
      expect(getProduct(handle), handle).toBeDefined();
      expect(check([{ handle, qty: 1 }]), handle).toEqual({
        ok: false,
        error: "invalid_lines",
      });
    }
  });

  it("refuses a product that goes to the store's checkout", () => {
    expect(inCheckout).toBeDefined();
    expect(check([{ handle: inCheckout?.handle, qty: 1 }])).toEqual({
      ok: false,
      error: "invalid_lines",
    });
  });

  it("takes 1 to 99 of a product and nothing outside that", () => {
    const line = (qty: unknown) => [{ handle: "lemon-pouch", qty }];
    expect(MAX_QTY).toBe(99);
    expect(checkPreorder(sent(line(1)), DURING, ON).ok).toBe(true);
    expect(checkPreorder(sent(line(MAX_QTY)), DURING, ON).ok).toBe(true);
    for (const qty of [0, 100, -1, 1.5, "2", null, undefined]) {
      expect(check(line(qty)), String(qty)).toEqual({
        ok: false,
        error: "invalid_lines",
      });
    }
    expect(check([...line(60), ...line(40)]).ok, "60 + 40 of one product").toBe(
      false,
    );
  });

  it("refuses an empty pre-order and anything that is not a list of lines", () => {
    for (const lines of [[], undefined, null, "lemon-pouch", {}, [null]]) {
      expect(check(lines)).toEqual({ ok: false, error: "invalid_lines" });
    }
  });

  it("refuses a pre-order without a reference of the right make", () => {
    for (const ref of [
      undefined,
      null,
      "",
      "k7q2mxd",
      "k7q2mxd9z",
      "K7Q2MXD9",
      "k7q2mxde",
      "k7q2 xd9",
      12345678,
    ]) {
      expect(
        checkPreorder({ ...sent(CART, START), ref }, DURING, ON),
        String(ref),
      ).toEqual({ ok: false, error: "invalid_ref" });
    }
  });

  it("keeps the percentage shown only when it is a step of the offer", () => {
    expect(order(CART).percent).toBe(0);
    expect(order(CART, TOP).toPay).toBe(discounted(CART_TOTAL, TOP));
    for (const percent of [TOP + 1, 99, -5, "25", null]) {
      expect(check(CART, percent)).toEqual({
        ok: false,
        error: "invalid_percent",
      });
    }
  });

  it("takes every step of the campaign while it runs", () => {
    for (const { percent } of DURING.tiers) {
      expect(order(CART, percent, DURING).toPay).toBe(
        discounted(CART_TOTAL, percent),
      );
    }
  });

  it("refuses the campaign's top step once the campaign has ended, as an offer that changed", () => {
    expect(STANDING_STEPS.top.percent).toBeLessThan(TOP);
    for (const offer of [AFTER, stepsAt(END + 86_400_000)]) {
      expect(checkPreorder(sent(CART, TOP), offer, ON)).toEqual({
        ok: false,
        error: "offer_changed",
      });
      // Every step of the standing offer still stands, and so does none.
      for (const { percent } of STANDING_STEPS.tiers) {
        expect(order(CART, percent, offer).percent).toBe(percent);
      }
      expect(order(CART, 0, offer).toPay).toBe(CART_TOTAL);
      // A figure no offer ever had is still simply wrong.
      expect(check(CART, 99, offer)).toEqual({
        ok: false,
        error: "invalid_percent",
      });
    }
  });

  it("refuses a pre-order whose figure to pay is not the one worked out here: the page is out of date", () => {
    const right = discounted(CART_TOTAL, START);
    for (const toPay of [
      right - 0.01,
      right + 0.01,
      CART_TOTAL,
      0,
      undefined,
      null,
      String(right),
    ]) {
      expect(
        checkPreorder({ ...sent(CART, START), toPay }, DURING, ON),
        String(toPay),
      ).toEqual({ ok: false, error: "total_changed" });
    }
    expect(
      checkPreorder({ ...sent(CART, START), toPay: right }, DURING, ON).ok,
    ).toBe(true);
  });
});

describe("what a pre-order is recorded with", () => {
  it("is left alone when what is backed is at least what the cart showed", () => {
    const got = order(CART, START);
    expect(settle(got, START)).toBe(got);
    expect(settle(got, TOP)).toBe(got);
  });

  it("is lowered to what is backed, and remembers what the cart showed", () => {
    const got = settle(order(CART, TOP), START);
    expect(got.percent).toBe(START);
    expect(got.toPay).toBe(discounted(CART_TOTAL, START));
    expect(got.asked).toBe(TOP);
    expect(got.total).toBe(CART_TOTAL);
  });
});

describe("the reference of a pre-order", () => {
  it("is eight signs with no vowel in them, new every time", () => {
    const made = new Set(Array.from({ length: 200 }, newRef));
    expect(made.size).toBe(200);
    for (const ref of made) {
      expect(ref).toMatch(/^[2-9bcdfghjkmnpqrstvwxz]{8}$/);
      expect(isRef(ref)).toBe(true);
    }
  });

  it("is found again in a note that holds it, and only there", () => {
    const note = preorderNote(order(CART, START));
    expect(holdsRef(note, REF)).toBe(true);
    expect(holdsRef(`Earlier note.\n\n${note}`, REF)).toBe(true);
    expect(holdsRef(note, "k7q2mxd8")).toBe(false);
    expect(holdsRef("Asked about gift wrapping.", REF)).toBe(false);
    expect(holdsRef(null, REF)).toBe(false);
  });
});

describe("the day of a pre-order", () => {
  it("is the day in US Pacific time, not in UTC", () => {
    // 7 pm on 30 November on the US Pacific coast is already 1 December in UTC.
    expect(pacificDay(new Date("2026-12-01T03:00:00Z"))).toBe("2026-11-30");
    // The campaign's last second is still 30 November there; the next is not.
    expect(pacificDay(new Date(END))).toBe("2026-11-30");
    expect(pacificDay(new Date(END + 1000))).toBe("2026-12-01");
    // In summer the coast is seven hours behind UTC, in winter eight.
    expect(pacificDay(new Date("2026-07-04T06:59:59Z"))).toBe("2026-07-03");
    expect(pacificDay(new Date("2026-07-04T07:00:00Z"))).toBe("2026-07-04");
    expect(pacificDay(new Date("2026-11-21T09:30:00Z"))).toBe("2026-11-21");
  });

  it("dates a pre-order placed on the last evening of the campaign 30 November, in the note and in the tag", () => {
    const evening = new Date("2026-12-01T03:00:00Z");
    const checked = checkPreorder(sent(CART, TOP), DURING, evening);
    if (!checked.ok) throw new Error(checked.error);
    expect(preorderNote(checked.order).split("\n")[0]).toBe(
      `Pre-order by email, ref ${REF}, 2026-11-30 US Pacific time (website)`,
    );
    expect(preorderTags(checked.order)).toContain("site-preorder-20261130");
  });
});

describe("the note and tags of a pre-order", () => {
  const got = order(CART, START);

  it("names a stick pack so that its quantity cannot be read as a sum", () => {
    expect(listName(item("lemon-sticks-5"))).toBe("Lemon Sticks (pack of 5)");
    expect(listName(item("sticks-30"))).toBe("Classic Sticks (pack of 30)");
    expect(listName(item("lemon-pouch"))).toBe("Lemon Pouch");
    expect(listName(item("discovery-set"))).toBe("Discovery Set");
    // The cart heads a line with the shorter name, as the product's page does.
    expect(lineName(item("lemon-sticks-5"))).toBe("Lemon Sticks, 5");
  });

  it("is headed by the reference and the day, lists every line and the total, and ends on what the shopper was told", () => {
    expect(preorderNote(got).split("\n")).toEqual([
      `Pre-order by email, ref ${REF}, 2026-11-21 US Pacific time (website)`,
      ...CART.map(
        ({ handle, qty }) =>
          `${listName(item(handle))} × ${qty}, ${formatPrice(item(handle).price)} each, ${formatPrice((cents(handle) * qty) / 100)}`,
      ),
      `Total: ${formatPrice(CART_TOTAL)}`,
      `Confirmed to the shopper: ${START}% off, ${formatPrice(discounted(CART_TOTAL, START))} to pay`,
    ]);
    expect(preorderNote(got)).toContain(
      "Lemon Sticks (pack of 5) × 2, $12.99 each, $25.98",
    );
    expect(preorderNote(order(CART))).toContain(
      `Confirmed to the shopper: no discount, ${formatPrice(CART_TOTAL)} to pay`,
    );
  });

  it("says so when the cart showed more than is recorded", () => {
    const lines = preorderNote(settle(order(CART, TOP), START)).split("\n");
    expect(lines.at(-2)).toBe(
      `The cart showed ${TOP}% off; the answers sent and this customer's record back ${START}% off.`,
    );
    expect(lines.at(-1)).toBe(
      `Confirmed to the shopper: ${START}% off, ${formatPrice(discounted(CART_TOTAL, START))} to pay`,
    );
  });

  it("tags each product, the day and the reference, which is new for every pre-order", () => {
    expect(preorderTags(got)).toEqual([
      "site-preorder-lemon-pouch",
      "site-preorder-discovery-set",
      "site-preorder-lemon-sticks-5",
      "site-preorder-20261121",
      `site-preorder-ref-${REF}`,
    ]);
    // The same product on the same day, pre-ordered again: one tag is new.
    const again = preorderTags({ ...got, ref: "k7q2mxd8" });
    expect(again.filter((tag) => !preorderTags(got).includes(tag))).toEqual([
      "site-preorder-ref-k7q2mxd8",
    ]);
  });
});
