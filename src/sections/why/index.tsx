import { GlassScene } from "./glass-scene";
import { Labels } from "./labels";
import { Purity } from "./purity";

/**
 * WHY: the "educate" step, about 3.5 screens. A real glass (sweat, water, salt,
 * a pinch falls in), two real salts side by side (refined vs unrefined), then
 * two labels turned over, with a first small step to buy and the way to the quiz.
 * Design notes: docs/design/science.md
 */
export default function WhySection() {
  return (
    <section id="why" data-section="why" className="relative bg-chalk text-ink">
      <GlassScene />
      <Purity />
      <Labels />
    </section>
  );
}
