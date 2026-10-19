/**
 * The shape the account forms pass between server and browser.
 *
 * Deliberately its own module with no `"use server"` and no `server-only`:
 * a `"use server"` file may export nothing but async functions, so the
 * initial state cannot live alongside the actions that return it.
 */
export type AccountFormState = {
  ok: boolean;
  message: string | null;
  /** Field name -> message, for errors that belong next to one input. */
  fields?: Record<string, string>;
};

export const EMPTY_FORM_STATE: AccountFormState = { ok: false, message: null };
