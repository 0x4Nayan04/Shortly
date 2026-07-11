# Privacy Policy

Shortly is built as a privacy-first URL shortener. We collect the smallest
amount of data needed to operate the service and show useful analytics. We do
not sell personal information. We share data only with service providers
(subprocessors) that help us run Shortly, as described below.

**Data controller:** Shortly (operator contact on the [Contact](/contact) page).

_Last updated: July 2026_

## What We Collect

### Redirect analytics (all visitors)

For each redirect, we record:

- Timestamp (when the redirect occurred)
- Country (derived from IP address via GeoIP lookup)
- Normalized referrer hostname (if a valid HTTP(S) referrer is provided)
- User agent details (device type, browser, OS)

We do not store raw IP addresses. We use the IP address only at request time to
derive a country and discard it immediately.

### Registered accounts

We store your name, email, and password hash so you can sign in and manage your
links. Session auth uses an HTTP-only cookie (not used to track visitors). Email
addresses are used for verification and password reset when email is enabled. We
record when you accepted our Terms of Service (`acceptedTermsAt` and
`termsVersion`).

### Click counts

We send the redirect first, then record the visit. This keeps links fast. In rare
cases — for example, if someone closes the tab very quickly — a visit may not
appear in your analytics. We prioritize fast redirects over perfectly exact
counts.

## What We Do Not Collect

- Full IP addresses (stored)
- Fingerprints or cross-site identifiers
- Cookies for tracking visitors across sites
- Exact location data (city, GPS)
- Personal information about anonymous link visitors beyond the analytics above

## Legal Basis (EEA/UK users)

Where applicable privacy law requires a legal basis:

- **Contract:** account data and link management to provide the service you
  requested.
- **Legitimate interests:** minimal redirect analytics to secure the platform,
  prevent abuse, and show link owners aggregated insights — balanced against
  visitor privacy (no raw IP storage, 30-day TTL).
- **Consent:** where required for optional communications (e.g. marketing — not
  currently offered).

## Subprocessors & Third Parties

We use trusted providers to host and operate Shortly. They process data on our
instructions:

| Provider | Purpose | Data involved |
| -------- | ------- | ------------- |
| MongoDB Atlas | Database hosting | Accounts, links, click events |
| Resend | Transactional email | Email address, message content |
| Hosting (e.g. Vercel, Railway/Render/Fly) | App & API delivery | Request metadata, logs |
| GeoIP (geoip-lite) | Country lookup at redirect time | IP used transiently, not stored |
| Gravatar | Default account avatar | Email hash |

We do not authorize subprocessors to use your data for their own marketing.

## International Transfers

Infrastructure may be located outside your country (including the United States).
Where required, we rely on appropriate safeguards (such as standard contractual
clauses) for cross-border transfers.

## Data Retention

- **Raw click events** are automatically deleted after **30 days** via a MongoDB
  TTL index on the timestamp field.
- **Aggregated statistics** are computed on demand from remaining raw data and
  are not stored permanently.
- If you delete a short URL, its click events remain until their 30-day expiry
  but are no longer linked to an active account or destination.
- **Account data** is retained while your account is active and removed when you
  delete your account (subject to brief backup retention by subprocessors).

## Your Rights & Choices

Depending on your location, you may have rights to access, correct, delete, or
export personal data, object to certain processing, or lodge a complaint with a
supervisory authority.

- **Delete links** — clears destination and counters; slug tombstone remains.
- **Delete account** — removes your user record and associated click data in one
  server transaction.
- **Contact us** — [support@shortly.nayanswarnkar.com](mailto:support@shortly.nayanswarnkar.com)
  (or addresses on the Contact page) to exercise rights or ask questions.

We respond to verified requests within applicable legal timeframes.

## Abuse Reports

Reports submitted via the abuse form may include an optional reporter email,
reported slug, and description. We use this to investigate violations and
retire malicious links. See our [Terms of Service](/terms).

## Children

Shortly is not directed at children under 13 (or the minimum age in your
jurisdiction). We do not knowingly collect personal information from children.
Contact us if you believe a child has provided data.

## Security

We use industry-standard measures (TLS, hashed passwords, HTTP-only session
cookies, rate limiting). Report vulnerabilities to
[security@shortly.nayanswarnkar.com](mailto:security@shortly.nayanswarnkar.com).

## Policy Changes

We update this policy when practices change. Material updates will be posted
here with a new “Last updated” date. Continued use after changes constitutes
notice of the updated policy where permitted by law.

## Jurisdiction

This policy is governed by the laws applicable to the Shortly operator. Specific
venue and dispute terms may be set out in our Terms of Service.
