import { Compare } from "@/components/home/compare";
import { Facts } from "@/components/home/facts";
import { Faq } from "@/components/home/faq";
import { Founding } from "@/components/home/founding";
import { Hero } from "@/components/home/hero";
import { HowTo } from "@/components/home/how-to";
import { Lemon } from "@/components/home/lemon";
import { Origin } from "@/components/home/origin";
import { People } from "@/components/home/people";
import { Shop } from "@/components/home/shop";
import { Values } from "@/components/home/values";

/**
 * The home page: the offer and what it is, the shop, why, how, who for, where
 * from, the second flavour, what is in it, the offer again, questions.
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <Facts />
      <Shop />
      <Values />
      <HowTo />
      <People />
      <Origin />
      <Lemon />
      <Compare />
      <Founding />
      <Faq />
    </main>
  );
}
