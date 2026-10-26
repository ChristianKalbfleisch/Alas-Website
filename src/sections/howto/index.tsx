import { art } from "@/data/art";
import { HowToScene } from "./how-to-scene";
import { HowToStill } from "./how-to-still";

/** 05 · How to use: tear, pour, stir, drink, as one photographed shot. */
export default function HowToSection() {
  return (
    <section id="howto" data-section="howto" className="relative bg-chalk">
      <HowToScene frames={art.howto} />
      <HowToStill frames={art.howto} />
    </section>
  );
}
