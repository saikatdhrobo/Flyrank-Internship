# The Polite Scraper

A polite, robust web scraping pipeline built in Python. It discovers books on the Books to Scrape practice sandbox, crawls all 60 book detail pages politely (using caching and headers), normalizes and validates data using Pydantic, handles failures gracefully, and outputs the scraped records and run reports.

## Target Classification

- **Target Site:** Books to Scrape (`https://books.toscrape.com/`)
- **Purpose:** Educational/sandbox site built specifically for practicing web scraping.
- **Scope:** First 3 catalogue pages only (which contain 60 books total).
- **Data Collected:** Book title, product detail URL, raw price text, availability status text, rating, description text, discovery source page, and fetch timestamp.
- **Appropriateness:** Scraping this site is appropriate because it is a publicly declared sandbox environment explicitly intended for developers to practice and learn scraping without commercial restriction or causing operational disruption.
- **Robots.txt Result:** No robots file found (`robots.txt` returned a 404 status code).

> "I will not reuse this code on another site without checking its rules and terms first."

---

## Installation & Setup

This project uses the Python lane (Python 3.10+).

### 1. Requirements

Ensure you have Python 3.10+ installed. The project relies on the following standard libraries:
- `requests` (for HTTP requests)
- `beautifulsoup4` (for HTML parsing)
- `pydantic` (for schema validation)

To install them, run:
```bash
pip install requests beautifulsoup4 pydantic
```

### 2. Run the Scraper

To execute the scraper pipeline, run:
```bash
python scraper/src/main.py
```

### 3. Run the Test Suite

To execute the 5 unit tests validating the parser (price normalization, URL resolving, description fallback, deduplication, and malformed HTML handling):
```bash
python -m unittest discover -s scraper/tests -p "test_*.py"
```

---

## Record Schema

Data is validated against a Pydantic `BookRecord` model defined as follows:

| Field | Type | Description | Required | Validation Rule |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `str` | Title of the book | Yes | Minimum 1 character |
| `product_url` | `HttpUrl` | Absolute URL to the book's detail page | Yes | Enforces `https://` prefix |
| `price_text` | `str` | Raw price string (e.g. `'£51.77'`) | Yes | None |
| `price_gbp` | `float` | Cleaned price in GBP | Yes | Must be >= 0.0 |
| `availability_text`| `str` | Raw availability status (e.g. `'In stock'`) | Yes | None |
| `rating_text` | `Optional[str]`| Rating word (e.g. `'Three'`, `'Four'`) | No | Default `None` |
| `description` | `Optional[str]`| Book description text | No | Default `None` (fallback) |
| `source_page` | `HttpUrl` | Catalogue page where book was found | Yes | Enforces `https://` prefix |
| `fetched_at` | `str` | Timestamp of fetch in ISO-8601 UTC | Yes | ISO-8601 string format |

---

## Politeness Rules Followed

1. **Honest User-Agent:** The scraper identifies itself with a custom User-Agent identifying the internship assignment and pointing to the code repository:
   `FlyRankInternship-A9/1.0 (+https://github.com/saikatdhrobo/Flyrank-Internship)`
2. **Polite Request Delays:** Live network requests are spaced out with a `500 ms` sleep interval.
3. **Timeouts:** A request timeout of `10 seconds` is enforced to prevent the program hanging indefinitely.
4. **Local Caching:** Raw HTML files are cached under `scraper/cache/` (e.g. `catalogue-page-X.html` and slug-based file names for book detail pages). Subsequent runs read from the local cache rather than hitting the live site, protecting the sandbox server.
5. **No Client Error Retries:** The scraper retries server errors (5xx) or network timeouts exactly once, but immediately skips 404 or 403 errors to avoid making redundant, rude queries.

---

## Why a Browser Was Not Used

This assignment did not use a browser because the target sandbox pages serve completely static, pre-rendered HTML content. All target data points are embedded in the server-side HTML response and don't require JavaScript execution. Running a headless browser (like Playwright/Selenium) would add significant performance overhead (slow startup and high memory/CPU usage) and operational costs for no functional benefit.

---

## Honest Limitation

- **Structure Dependency:** The parser relies on CSS selector names (like `.price_color`, `.product_main h1`, `.availability`, and `.star-rating`) and markup structure (`#product_description + p`). If the site's layout or structure changes or updates class names, the scraper will fail validation and record failures in `errors.json`.
- **Static Only:** It cannot handle modern single-page applications (SPAs) where data is loaded dynamically via client-side JavaScript APIs after the initial HTML is parsed.

---

## Ethics Note

In our own words:
- **Always prioritize official APIs:** If a service provides a public, official API, use it instead of scraping web pages.
- **Respect barriers and rules:** Never bypass logins, paywalls, CAPTCHAs, or rate limits. Always respect the rules outlined in a site's `robots.txt` or terms of service.
- **Collect only what is needed:** Minimize the scope of collection to only what is necessary, saving network bandwidth and storage.

---

## Sample Run Report

The following is a report generated from the execution run:

```json
{
  "start_time": "2026-08-09T10:46:30Z",
  "duration_seconds": 1.36,
  "pages_fetched": 0,
  "cache_hits": 63,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 1
}
```
*(Note: `failed_pages` is `1` because we added a mock non-existent book URL to verify the scraper's error handling and reporting resilience).*
