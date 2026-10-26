"use client";

import Image from "next/image";
import Link from "next/link";
import { ANNOUNCEMENT } from "@/data/offers";
import { getProduct } from "@/data/products";
import { RITUAL, RITUAL_SAVE_PERCENT } from "@/data/ritual";
import { formatPrice } from "@/lib/cart/cart-math";
import "./nav.css";
import { NAV_LINKS } from "./nav-links";

const styles = {
  box: "an-box",
  boxAdd: "an-box-add",
  boxName: "an-box-name",
  boxPhoto: "an-box-photo",
  boxPrice: "an-box-price",
  label: "an-label",
  sheet: "an-sheet",
  sheetFoot: "an-sheet-foot",
  sheetIndex: "an-sheet-index",
  sheetInner: "an-sheet-inner",
  sheetLink: "an-sheet-link",
  sheetLinks: "an-sheet-links",
  sheetMask: "an-sheet-mask",
  sheetRow: "an-sheet-row",
} as const;

/** Mobile only: the one offer the sheet makes, The Ritual, one tap from its chapter. */
function RitualCard({ onSee }: { onSee: () => void }) {
  const kit = getProduct("mesos");
  if (!kit) return null;
  const photo = kit.images[0];
  return (
    <div className={`${styles.box} md:hidden`}>
      <div className={styles.boxPhoto}>
        <Image
          src={photo.src}
          alt=""
          width={photo.width}
          height={photo.height}
          sizes="88px"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`${styles.label} text-ink-3`}>
          / {RITUAL.name} · Save {RITUAL_SAVE_PERCENT}%
        </p>
        <p className={styles.boxName}>Two pouches, every month</p>
        <p className={styles.boxPrice}>{formatPrice(RITUAL.price)} a month</p>
      </div>
      <button
        type="button"
        className={`${styles.label} ${styles.boxAdd}`}
        data-added="false"
        onClick={onSee}
        aria-label={`See ${RITUAL.name}`}
      >
        <span aria-hidden>See</span>
      </button>
    </div>
  );
}

/**
 * Full-screen liquid glass menu: large serif links that rise from their masks.
 * Always mounted (so it can animate out); `inert` while closed.
 */
export function MenuSheet({
  open,
  onNavigate,
  onLeave,
}: {
  open: boolean;
  onNavigate: (href: string) => void;
  /** Closes the sheet when a link leaves for another page. */
  onLeave: () => void;
}) {
  return (
    <div
      id="alas-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className={styles.sheet}
      inert={!open}
    >
      <div className={`container-x ${styles.sheetInner}`}>
        <nav aria-label="Chapters" className={styles.sheetLinks}>
          {NAV_LINKS.map((link, i) => (
            <div
              key={link.id}
              className={styles.sheetRow}
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className={`${styles.label} ${styles.sheetIndex}`}>
                {String(i + 1).padStart(2, "0")} /
              </span>
              <span className={styles.sheetMask}>
                <a
                  href={`/${link.href}`}
                  className={styles.sheetLink}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(link.href);
                  }}
                >
                  {link.label}
                </a>
              </span>
            </div>
          ))}
        </nav>
        <div>
          <RitualCard onSee={() => onNavigate("#club")} />
          <Link
            href="/account"
            onClick={onLeave}
            className={`${styles.label} mb-5 inline-flex items-center gap-2 text-ink underline decoration-[var(--c-line-strong)] underline-offset-[6px]`}
          >
            / Your grains · Account
          </Link>
          <div className={`${styles.label} ${styles.sheetFoot}`}>
            <span>/ {ANNOUNCEMENT}</span>
            <span>/ Harvested in Greece, packaged in the USA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
