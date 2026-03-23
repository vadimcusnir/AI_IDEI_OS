/**
 * Common disposable email domains to block on registration.
 * This list covers the most popular providers; extend as needed.
 */
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com", "guerrillamail.com", "guerrillamail.net", "guerrillamailblock.com",
  "mailinator.com", "maildrop.cc", "throwaway.email", "tempmail.com", "temp-mail.org",
  "fakeinbox.com", "sharklasers.com", "grr.la", "guerrillamail.info", "guerrillamail.de",
  "yopmail.com", "yopmail.fr", "trashmail.com", "trashmail.net", "trashmail.me",
  "mailnesia.com", "mailtemp.info", "dispostable.com", "getnada.com",
  "emailondeck.com", "tempail.com", "tempr.email", "discard.email",
  "mohmal.com", "burpcollaborator.net", "mytemp.email", "throwaway.email",
  "harakirimail.com", "mailcatch.com", "mailnull.com", "mailsac.com",
  "mintemail.com", "mt2015.com", "spamgourmet.com", "mailexpire.com",
  "safetymail.info", "tmail.ws", "tmpmail.net", "tmpmail.org",
  "guerrillamail.org", "binkmail.com", "bob.moe", "bobmail.info",
  "33mail.com", "maildrop.cc", "getairmail.com", "mailnator.com",
  "meltmail.com", "spam4.me", "trashymail.com", "uggsrock.com",
  "mailinator2.com", "sogetthis.com", "mailzilla.com",
]);

/**
 * Check if an email domain is a known disposable/throwaway service.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
