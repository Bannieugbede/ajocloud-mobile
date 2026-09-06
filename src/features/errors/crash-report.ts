import { environment } from '@/config/environment';

/**
 * What a crash screen may say about a crash.
 *
 * A stack trace can carry anything the code was holding when it failed — an
 * account number in a variable, a token in a URL — so nothing from the error
 * itself is ever shown to the member or placed in a mailto body. What is safe
 * is a short opaque reference they can quote to support, which means something
 * only when cross-referenced against a report the app sends itself.
 */

/** Characters that cannot be confused for one another when read aloud. */
const ALPHABET = '2345679ACDEFGHJKMNPQRTUVWXYZ';

/**
 * A reference for one crash. Random rather than derived from the error: a hash
 * of the message would be stable, which sounds useful until the same reference
 * is shown to two members and neither report can be told apart.
 */
export function crashReference(random: () => number = Math.random): string {
  let body = '';
  for (let index = 0; index < 6; index += 1) {
    body += ALPHABET.charAt(Math.floor(random() * ALPHABET.length));
  }
  return `ERR-${body}`;
}

/**
 * The support address, when one is configured. Builds without one omit the
 * contact route rather than opening a mail composer that goes nowhere.
 */
export function supportEmail(): string | null {
  const address = environment.EXPO_PUBLIC_SUPPORT_EMAIL;
  return address ? address : null;
}

/**
 * A mailto link carrying only the reference.
 *
 * Deliberately not the error message: a subject line is the easiest place for
 * a stack trace to leak into a mailbox nobody has redacted.
 */
export function supportMailto(reference: string): string | null {
  const address = supportEmail();
  if (!address) return null;
  const subject = encodeURIComponent(`Ajo Cloud problem ${reference}`);
  const body = encodeURIComponent(
    `Reference: ${reference}\n\nWhat I was doing when this happened:\n`,
  );
  return `mailto:${address}?subject=${subject}&body=${body}`;
}

/**
 * Whether restarting the whole bundle is worth offering.
 *
 * A crash inside the first render usually repeats on a plain remount, because
 * whatever produced it runs again immediately. Reloading is the honest recovery
 * there; a second "Try again" would just ask the member to press the same
 * button twice and watch it fail again.
 */
export function shouldOfferReload(attempts: number): boolean {
  return attempts >= 1;
}
