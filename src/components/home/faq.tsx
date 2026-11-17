import Image from "next/image";
import Link from "next/link";
import { Accordion } from "@/components/ui/accordion";
import { CONTACT_EMAIL, FAQS } from "@/data/faq";
import { PHOTOS } from "@/data/photos";

/** The questions people ask before they buy. */
export function Faq() {
  return (
    <section id="questions" aria-labelledby="faq-title" className="section">
      <div className="wrap grid gap-10 wide:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] wide:gap-20">
        <div>
          <h2 id="faq-title" className="t-h2">
            Questions.
          </h2>
          <p className="t-lead mt-4 text-ink-2">
            Anything else, write to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <figure className="photo mt-10 hidden aspect-[4/5] max-w-[24rem] wide:block">
            <Image
              src={PHOTOS.pour.src}
              alt={PHOTOS.pour.alt}
              placeholder="blur"
              sizes="24rem"
            />
          </figure>
        </div>
        <Accordion
          items={FAQS.map((faq) => ({
            id: faq.q,
            title: faq.q,
            body: (
              <>
                <p>{faq.a}</p>
                {faq.link && (
                  <p className="mt-3">
                    <Link href={faq.link.href} className="link text-ink">
                      {faq.link.label}
                    </Link>
                  </p>
                )}
              </>
            ),
          }))}
        />
      </div>
    </section>
  );
}
