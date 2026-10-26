import type { ReactNode } from "react";

/**
 * Isolation frame for building one section: neutral runway above and below so
 * scroll-in and scroll-out choreography can be tested on its own.
 */
export function LabFrame({
  name,
  children,
  top = true,
  bottom = true,
}: {
  name: string;
  children: ReactNode;
  top?: boolean;
  bottom?: boolean;
}) {
  return (
    <main>
      {top && (
        <div className="grid h-[70vh] place-items-center bg-chalk">
          <p className="eyebrow">lab · {name} · scroll</p>
        </div>
      )}
      {children}
      {bottom && (
        <div className="grid h-[70vh] place-items-center bg-chalk">
          <p className="eyebrow">lab · {name} · end</p>
        </div>
      )}
    </main>
  );
}
