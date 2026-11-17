import { Button } from "@/components/ui/button";

/** Shown for any address the site does not have. */
export default function NotFound() {
  return (
    <main className="wrap section text-center">
      <h1 className="t-h2">That page is not here.</h1>
      <p className="t-lead mx-auto mt-4 max-w-[30rem] text-ink-2">
        It may have moved, or the address may be mistyped.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" arrow>
          Go to the home page
        </Button>
        <Button href="/#shop" tone="outline">
          Shop
        </Button>
      </div>
    </main>
  );
}
