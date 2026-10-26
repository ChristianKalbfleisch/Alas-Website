import { ChartScene } from "./chart-scene";
import { HarvestFilm } from "./harvest-film";

/**
 * Origin: where the salt comes from and how it is made, in about four screens.
 * A real chart of the Aegean zooms to a pin at the (PLACEHOLDER) harvest site,
 * Kalloni Gulf on Lesvos; then a full-bleed photographic film of the harvest in
 * four beats, ending on the page's only "Hand-harvested. Sun-dried. Nothing
 * added." Design notes: docs/design/origin.md.
 */
export default function OriginSection() {
  return (
    <section id="origin" data-section="origin" className="relative bg-chalk">
      <ChartScene />
      <HarvestFilm />
    </section>
  );
}
