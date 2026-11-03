/**
 * Gmail Dot Trick Generator & Utilities (Isomorphic - Safe for Client & Server)
 * 
 * Concept:
 * Google ignores dots (.) in the username portion of @gmail.com addresses.
 * For example: john.doe@gmail.com and j.o.h.n.d.o.e@gmail.com both deliver
 * to johndoe@gmail.com.
 * However, TikTok considers every dot variation as a completely distinct, brand-new
 * account. Because @gmail.com is considered a high-trust domain, TikTok skips
 * the phone verification requirement during registration!
 */

export function isValidGmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return domain === "gmail.com" || domain === "googlemail.com";
}

export function normalizeGmail(email: string): { baseUsername: string; domain: string } {
  const parts = email.trim().toLowerCase().split("@");
  const username = parts[0] ? parts[0].replace(/\./g, "").replace(/\+.*$/, "") : "";
  const domain = parts[1] || "gmail.com";
  return { baseUsername: username, domain };
}

/**
 * Generates dot trick variations for a given Gmail address.
 * Generates clean, valid variations:
 * 1. Single dot placements: c.onghau20, co.nghau20, con.ghau20...
 * 2. Two dot placements: c.o.nghau20, c.on.ghau20, co.n.ghau20...
 * 3. Alternating / multi-dot placements.
 */
export function generateGmailDotVariations(email: string, maxCount: number = 50): string[] {
  const { baseUsername, domain } = normalizeGmail(email);
  if (!baseUsername || baseUsername.length < 2) {
    return [email.trim().toLowerCase()];
  }

  const len = baseUsername.length;
  const results: Set<string> = new Set();

  // 1. Single-dot variations (length - 1 possibilities)
  for (let i = 1; i < len; i++) {
    const variant = baseUsername.slice(0, i) + "." + baseUsername.slice(i) + "@" + domain;
    results.add(variant);
    if (results.size >= maxCount) return Array.from(results);
  }

  // 2. Two-dot variations
  for (let i = 1; i < len - 1; i++) {
    for (let j = i + 1; j < len; j++) {
      const variant =
        baseUsername.slice(0, i) +
        "." +
        baseUsername.slice(i, j) +
        "." +
        baseUsername.slice(j) +
        "@" +
        domain;
      results.add(variant);
      if (results.size >= maxCount) return Array.from(results);
    }
  }

  // 3. Three-dot variations
  if (len >= 4 && results.size < maxCount) {
    for (let i = 1; i < len - 2; i++) {
      for (let j = i + 1; j < len - 1; j++) {
        for (let k = j + 1; k < len; k++) {
          const variant =
            baseUsername.slice(0, i) +
            "." +
            baseUsername.slice(i, j) +
            "." +
            baseUsername.slice(j, k) +
            "." +
            baseUsername.slice(k) +
            "@" +
            domain;
          results.add(variant);
          if (results.size >= maxCount) return Array.from(results);
        }
      }
    }
  }

  // 4. Binary bitmask generator for any remaining combinations
  const maxPossible = Math.min(1 << (len - 1), 2048);
  for (let mask = 1; mask < maxPossible; mask++) {
    let variantUsername = "";
    for (let charIdx = 0; charIdx < len; charIdx++) {
      variantUsername += baseUsername[charIdx];
      if (charIdx < len - 1 && (mask & (1 << charIdx)) !== 0) {
        variantUsername += ".";
      }
    }
    results.add(`${variantUsername}@${domain}`);
    if (results.size >= maxCount) break;
  }

  return Array.from(results);
}
