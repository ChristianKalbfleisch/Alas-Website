import styles from "./auth.module.css";

/**
 * The frame the three credential pages share — sign in, create an account,
 * reset a password.
 *
 * These stay static. Redirecting a visitor who is already signed in would
 * mean reading the session cookie here, which costs the whole route its
 * prerender; the same trade-off the header makes over the cart count. A
 * signed-in visitor who lands on the sign-in form simply signs in again.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.page}>{children}</div>;
}
