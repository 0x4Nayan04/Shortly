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

- Raw click events are retained for 30 days.
- Aggregated analytics can be kept longer to provide historical insights.

## Your Control

- If you delete a short URL, its analytics are deleted along with it.
- You can request deletion of your account and associated data at any time.

## Transparency

- This policy will be updated whenever we change our analytics collection or retention practices.
- We will always document what changes and why.
