import dns from 'node:dns/promises';
import net from 'node:net';
import { extractCoordsFromGoogleMapsUrl } from './mapHelpers.js';

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 5000;

/**
 * Strict host + path allow-list for Google Maps link resolution.
 */
export function isAllowedGoogleMapsUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { allowed: false, reason: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'https:') {
    return { allowed: false, reason: 'Only HTTPS URLs are allowed.' };
  }

  if (parsed.username || parsed.password) {
    return { allowed: false, reason: 'Credentials in URL are not allowed.' };
  }

  const host = parsed.hostname.toLowerCase();
  if (net.isIP(host)) {
    return { allowed: false, reason: 'Direct IP addresses are not allowed.' };
  }

  if (host === 'maps.app.goo.gl' || host === 'maps.google.com') {
    return { allowed: true, parsed };
  }

  if (host === 'goo.gl' && parsed.pathname.startsWith('/maps')) {
    return { allowed: true, parsed };
  }

  if ((host === 'google.com' || host === 'www.google.com') && parsed.pathname.startsWith('/maps')) {
    return { allowed: true, parsed };
  }

  return { allowed: false, reason: `Host '${host}' is not in the Google Maps allow-list.` };
}

/**
 * Checks whether an IPv4 or IPv6 address is private, loopback, link-local, or reserved.
 */
export function isPrivateOrReservedIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const clean = ip.replace(/^::ffff:/i, '');

  if (net.isIPv4(clean)) {
    const parts = clean.split('.').map((n) => parseInt(n, 10));
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  if (net.isIPv6(clean)) {
    const lower = clean.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
      return true; // link-local
    }
    return false;
  }

  return true;
}

/**
 * SSRF-hardened server-side Google Maps short-link resolver.
 * - Allow-listed Google Maps hosts only, HTTPS only
 * - DNS lookup verified against private/loopback/reserved IPs on every hop
 * - Manual redirect following up to 5 hops, 5s total timeout, no cookies
 */
export async function resolveGoogleMapsUrl(
  rawUrl,
  { fetchImpl = globalThis.fetch, dnsLookup = dns.lookup, timeoutMs = TIMEOUT_MS } = {}
) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { ok: false, error: 'URL is required.' };
  }

  const trimmed = rawUrl.trim();

  // If it's already a non-short Google Maps URL or plain coordinates, parse directly without network
  const direct = extractCoordsFromGoogleMapsUrl(trimmed);
  if (direct.ok) {
    return {
      ok: true,
      finalUrl: trimmed,
      ...direct,
    };
  }

  const initialCheck = isAllowedGoogleMapsUrl(trimmed);
  if (!initialCheck.allowed) {
    return { ok: false, error: initialCheck.reason, blocked: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let currentUrl = initialCheck.parsed.toString();

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const hopCheck = isAllowedGoogleMapsUrl(currentUrl);
      if (!hopCheck.allowed) {
        return { ok: false, error: hopCheck.reason, blocked: true };
      }

      // Verify DNS resolution does not point to private/loopback IPs
      const addresses = await dnsLookup(hopCheck.parsed.hostname, { all: true });
      const list = Array.isArray(addresses) ? addresses : [addresses];
      if (list.length === 0) {
        return { ok: false, error: 'Could not resolve host DNS.' };
      }
      for (const entry of list) {
        if (isPrivateOrReservedIp(entry.address)) {
          return {
            ok: false,
            error: 'Blocked redirect to private or loopback IP address.',
            blocked: true,
          };
        }
      }

      const res = await fetchImpl(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ManikpurEidgahMapResolver/1.0',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      const isRedirect = res.status >= 300 && res.status < 400;
      const location = res.headers?.get?.('location');

      if (isRedirect && location) {
        if (hop === MAX_REDIRECTS) {
          return { ok: false, error: 'Too many redirects (max 5 allowed).', blocked: true };
        }
        const nextUrl = new URL(location, currentUrl).toString();
        currentUrl = nextUrl;

        // Check immediately if the redirect URL already contains exact pin coordinates
        const extracted = extractCoordsFromGoogleMapsUrl(currentUrl);
        if (extracted.ok && !extracted.isFallbackViewport) {
          return {
            ok: true,
            finalUrl: currentUrl,
            ...extracted,
          };
        }
        continue;
      }

      // Reached final URL
      const extracted = extractCoordsFromGoogleMapsUrl(currentUrl);
      if (extracted.ok) {
        return {
          ok: true,
          finalUrl: currentUrl,
          ...extracted,
        };
      }

      return {
        ok: false,
        finalUrl: currentUrl,
        error: 'Resolved URL did not contain recognizable coordinates.',
      };
    }

    return { ok: false, error: 'Too many redirects (max 5 allowed).', blocked: true };
  } catch (err) {
    if (err?.name === 'AbortError') {
      return { ok: false, error: 'Link resolution timed out (5 seconds).' };
    }
    return { ok: false, error: err?.message || 'Failed to resolve Google Maps link.' };
  } finally {
    clearTimeout(timer);
  }
}
