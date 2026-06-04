# Privacy Policy

Shortly is built as a privacy-first URL shortener. We collect the smallest
amount of data needed to provide useful analytics, and we never sell or share
that data with third parties.

## What We Collect

For each redirect, we record:

- Timestamp (when the redirect occurred)
- Country (derived from IP address via GeoIP lookup)
- Referrer domain (if provided by the browser)
- User agent details (device type, browser, OS)

We do not store raw IP addresses. We use the IP address only at request time to
derive a country and discard it immediately.

**Registered accounts:** We store your name, email, and password hash so you can
sign in and manage your links. Session auth uses an HTTP-only cookie (not used
to track visitors). Email addresses are used for verification and password reset
when email is enabled.

**Click counts:** We send the redirect first, then record the visit. This keeps
links fast. In rare cases — for example, if someone closes the tab very quickly
— a visit may not appear in your analytics. We prioritize fast redirects over
perfectly exact counts.

## What We Do Not Collect

- Full IP addresses
- Fingerprints or cross-site identifiers
- Cookies for tracking
- Exact location data (city, GPS)
- Personal information about visitors

## Data Retention

- **Raw click events are automatically deleted after 30 days.** We use a MongoDB
  TTL index on the `timestamp` field, so deletion is automatic with no manual
  cleanup required. Once deleted, individual click records (country, device,
  browser, referrer) are permanently gone.
- **Aggregated statistics** (total clicks, top countries, device breakdowns) are
  computed on-demand from the remaining raw data and are not stored permanently.
- If you delete a short URL, its associated click events remain until their
  30-day expiry but are no longer linked to any active account.

## Your Control

- Deleting a short URL hides it from your dashboard immediately, but the
  underlying link record, lifetime click counter, and raw click events remain in
  storage until the 30-day TTL expires. To remove your data sooner, delete your
  account.
- You can request deletion of your account and associated data at any time.
  Account deletion removes your user record, short URLs, and click data in a
  single transactional flow on the server.

## Transparency

- This policy will be updated whenever we change our analytics collection or
  retention practices.
- We will always document what changes and why.

_Last updated: June 2026_
