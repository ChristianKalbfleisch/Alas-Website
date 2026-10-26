import Section from "@/sections/hero";
import { LabFrame } from "../lab-frame";

export default function Page() {
  return (
    <LabFrame name="hero" top={false}>
      <Section />
    </LabFrame>
  );
}
