# Privacy Manifesto

Shortly is built as a privacy-first URL shortener. We collect the smallest
amount of data needed to provide useful analytics, and we never sell or share
that data with third parties.

## What We Collect

For each redirect, we record:
- Timestamp (when the redirect occurred)
- Country (derived from IP address via GeoIP lookup)
- Referrer domain (if provided by the browser)
- User agent details (device type, browser, OS)

We do not store raw IP addresses. We use the IP address only at request time to derive a country and discard it immediately.

## What We Do Not Collect

- Full IP addresses
- Fingerprints or cross-site identifiers
- Cookies for tracking
- Exact location data (city, GPS)
- Personal information about visitors

## Data Retention

- **Raw click events are automatically deleted after 30 days.** We use a MongoDB TTL index on the `timestamp` field, so deletion is automatic with no manual cleanup required. Once deleted, individual click records (country, device, browser, referrer) are permanently gone.
- **Aggregated statistics** (total clicks, top countries, device breakdowns) are computed on-demand from the remaining raw data and are not stored permanently.
- If you delete a short URL, its associated click events remain until their 30-day expiry but are no longer linked to any active account.

## Your Control

- If you delete a short URL, its analytics are deleted along with it.
- You can request deletion of your account and associated data at any time.

## Transparency

- This policy will be updated whenever we change our analytics collection or retention practices.
- We will always document what changes and why.
