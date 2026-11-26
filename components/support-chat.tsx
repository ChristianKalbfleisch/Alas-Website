import Script from "next/script";

/**
 * The ALAS support chat, served by the operations server (the `alas-4-agents`
 * repo, `agents/support/widget.js`). It answers from that server's knowledge
 * base and live order data, and hands anything it can't answer to a person.
 *
 * Renders nothing until `NEXT_PUBLIC_ALAS_SUPPORT_URL` is set, so the site
 * builds and runs unchanged before that server is deployed. The widget draws
 * itself in a shadow root: no styles leak into the site or out of it, and its
 * colours follow app/tokens.css.
 *
 * `lazyOnload`: the chat is never on the critical path, so it loads once the
 * page is idle.
 */
const SUPPORT_URL = process.env.NEXT_PUBLIC_ALAS_SUPPORT_URL?.replace(/\/+$/, "");

export function SupportChat() {
  if (!SUPPORT_URL) return null;
  return (
    <Script
      src={`${SUPPORT_URL}/widget.js`}
      data-api={`${SUPPORT_URL}/chat`}
      strategy="lazyOnload"
    />
  );
}
