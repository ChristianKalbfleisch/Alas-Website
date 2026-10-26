import AlasSection from "@/sections/alas";
import ClubSection from "@/sections/club";
import FaqSection from "@/sections/faq";
import FooterSection from "@/sections/footer";
import HeroSection from "@/sections/hero";
import HowToSection from "@/sections/howto";
import MeetSection from "@/sections/meet";
import MythSection from "@/sections/myth";
import OriginSection from "@/sections/origin";
import QuizSection from "@/sections/quiz";
import RitualsSection from "@/sections/rituals";
import ShopSection from "@/sections/shop";
import TrustSection from "@/sections/trust";
import WhySection from "@/sections/why";

/**
 * The journey, as a funnel: introduce (hero, the word), meet the salt, educate
 * (why, origin, myth, how to use, rituals), hook (quiz), sell (shop), reassure
 * (trust), upsell (The Ritual), answer doubts (FAQ).
 */
export default function Home() {
  return (
    <main>
      <HeroSection />
      <AlasSection />
      <MeetSection />
      <WhySection />
      <OriginSection />
      <MythSection />
      <HowToSection />
      <RitualsSection />
      <QuizSection />
      <ShopSection />
      <TrustSection />
      <ClubSection />
      <FaqSection />
      <FooterSection />
    </main>
  );
}
