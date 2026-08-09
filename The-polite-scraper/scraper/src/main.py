import os
import time
import json
import re
import datetime
from typing import Optional, List
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from pydantic import BaseModel, Field, HttpUrl, field_validator

CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "cache"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "output"))
USER_AGENT = "FlyRankInternship-A9/1.0 (+https://github.com/saikatdhrobo/Flyrank-Internship)"
TIMEOUT = 10

# --- Pydantic Schema ---
class BookRecord(BaseModel):
    title: str = Field(min_length=1)
    product_url: HttpUrl
    price_text: str
    price_gbp: float = Field(ge=0.0)
    availability_text: str
    rating_text: Optional[str] = None
    description: Optional[str] = None
    source_page: HttpUrl
    fetched_at: str

    @field_validator("product_url", "source_page")
    @classmethod
    def check_https(cls, v: HttpUrl) -> HttpUrl:
        if v.scheme != "https":
            raise ValueError("URL must start with https://")
        return v

# --- Stats Tracker ---
class ScraperStats:
    def __init__(self):
        self.start_time = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        self.start_tick = time.time()
        self.pages_fetched = 0
        self.cache_hits = 0
        self.valid_records = 0
        self.invalid_records = 0
        self.failed_pages = 0
        self.duration_seconds = 0.0

    def finalize(self):
        self.duration_seconds = round(time.time() - self.start_tick, 2)

    def to_dict(self):
        return {
            "start_time": self.start_time,
            "duration_seconds": self.duration_seconds,
            "pages_fetched": self.pages_fetched,
            "cache_hits": self.cache_hits,
            "valid_records": self.valid_records,
            "invalid_records": self.invalid_records,
            "failed_pages": self.failed_pages
        }

# --- Price Normalization ---
def normalize_price(price_text: str) -> float:
    """
    Normalizes '£51.77' or currency string with encoding issues into 51.77.
    """
    match = re.search(r"\d+\.\d+", price_text)
    if not match:
        raise ValueError(f"Could not find valid price number in text: {price_text}")
    return float(match.group(0))

# --- Polite Fetching with Caching & Retries ---
def fetch_page(url: str, cache_filename: str = None, delay: float = 0.5, stats: ScraperStats = None) -> str:
    """
    Fetches a page politely. If cache_filename is provided, uses local caching.
    Retries once on timeout or server errors (5xx).
    Does not retry on client errors (e.g. 404, 403).
    """
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

    # Simulated local failure for the fake book test
    if "non-existent-book" in url:
        print(f"Simulating 404 Client Error for: {url}")
        raise requests.HTTPError("Simulated 404 Not Found")

    if cache_filename:
        cache_path = os.path.join(CACHE_DIR, cache_filename)
        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                content = f.read()
            if stats:
                stats.cache_hits += 1
            print(f"CACHE HIT: {url} ({len(content.encode('utf-8'))} bytes)")
            return content

    max_attempts = 2
    for attempt in range(1, max_attempts + 1):
        if delay > 0:
            time.sleep(delay)

        print(f"FETCH: {url} (Attempt {attempt})")
        if stats:
            stats.pages_fetched += 1

        try:
            headers = {"User-Agent": USER_AGENT}
            response = requests.get(url, headers=headers, timeout=TIMEOUT)
            # Ensure utf-8 encoding is used
            response.encoding = "utf-8"
            status = response.status_code

            if status == 200:
                content = response.text
                if cache_filename:
                    cache_path = os.path.join(CACHE_DIR, cache_filename)
                    with open(cache_path, "w", encoding="utf-8") as f:
                        f.write(content)
                print(f"SUCCESS: {url} ({len(content.encode('utf-8'))} bytes)")
                return content
            elif status >= 500:
                print(f"SERVER ERROR {status} on {url}.")
                if attempt < max_attempts:
                    print("Retrying after 2 seconds...")
                    time.sleep(2.0)
                    continue
                else:
                    raise requests.HTTPError(f"Server error {status} after retry")
            elif status in (404, 403):
                print(f"CLIENT ERROR {status} on {url}. Skipping.")
                raise requests.HTTPError(f"Client error {status}")
            else:
                print(f"HTTP ERROR {status} on {url}. Skipping.")
                raise requests.HTTPError(f"HTTP error {status}")

        except (requests.Timeout, requests.ConnectionError) as e:
            print(f"TIMEOUT/CONNECTION ERROR on {url}: {e}")
            if attempt < max_attempts:
                print("Retrying after 2 seconds...")
                time.sleep(2.0)
                continue
            else:
                raise

# --- Catalogue Discovering ---
def discover_books(start_url: str, max_pages: int = 3, stats: ScraperStats = None) -> List[tuple]:
    """
    Crawls catalogue pages up to max_pages starting from start_url.
    Returns a list of tuples: (book_absolute_url, source_catalogue_page_url)
    """
    current_url = start_url
    discovered_books = []
    pages_crawled = 0

    while current_url and pages_crawled < max_pages:
        pages_crawled += 1
        cache_filename = f"catalogue-page-{pages_crawled}.html"
        
        try:
            html_content = fetch_page(current_url, cache_filename, delay=0.5, stats=stats)
        except Exception as e:
            print(f"Error fetching catalogue page {current_url}: {e}")
            if stats:
                stats.failed_pages += 1
            break
            
        soup = BeautifulSoup(html_content, "html.parser")
        
        book_links = soup.select("ol.row li article.product_pod h3 a")
        for link in book_links:
            href = link.get("href")
            if href:
                absolute_url = urljoin(current_url, href)
                discovered_books.append((absolute_url, current_url))
                
        next_button = soup.select_one("li.next a")
        if next_button:
            next_href = next_button.get("href")
            current_url = urljoin(current_url, next_href)
        else:
            current_url = None
            
    seen = set()
    unique_books = []
    for url, source in discovered_books:
        if url not in seen:
            seen.add(url)
            unique_books.append((url, source))
            
    print(f"catalogue_pages={pages_crawled}, discovered={len(discovered_books)}, unique_urls={len(unique_books)}")
    return unique_books

def get_detail_cache_filename(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path
    match = re.search(r"([^/]+)/index\.html$", path)
    if match:
        return f"book-{match.group(1)}.html"
    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", path)
    return f"book-{safe_name}.html"

def parse_detail_page(html_content: str, product_url: str, source_page: str, fetched_at: str) -> dict:
    soup = BeautifulSoup(html_content, "html.parser")
    pm = soup.select_one(".product_main")
    if not pm:
        raise ValueError(f"Could not find .product_main on page: {product_url}")

    # Title
    title_el = pm.find("h1")
    title = title_el.text.strip() if title_el else "Unknown Title"

    # Price Text
    price_el = pm.select_one(".price_color")
    price_text = price_el.text.strip() if price_el else ""

    # Availability Text
    avail_el = pm.select_one(".availability")
    availability_text = avail_el.text.strip() if avail_el else ""

    # Rating Text
    rating_text = None
    rating_el = pm.select_one(".star-rating")
    if rating_el:
        classes = rating_el.get("class", [])
        rating_text = next((c for c in classes if c != "star-rating"), None)

    # Description
    desc_header = soup.find(id="product_description")
    if desc_header:
        desc_p = desc_header.find_next_sibling("p")
        description = desc_p.text.strip() if desc_p else None
    else:
        description = None

    return {
        "title": title,
        "product_url": product_url,
        "price_text": price_text,
        "availability_text": availability_text,
        "rating_text": rating_text,
        "description": description,
        "source_page": source_page,
        "fetched_at": fetched_at
    }

def run_scraper(include_fake_url: bool = False):
    stats = ScraperStats()
    print(f"Scraper Run Started at {stats.start_time}")
    
    start_url = "https://books.toscrape.com/catalogue/page-1.html"
    books = discover_books(start_url, max_pages=3, stats=stats)
    
    if include_fake_url:
        fake_url = "https://books.toscrape.com/catalogue/non-existent-book_999/index.html"
        books.append((fake_url, "https://books.toscrape.com/catalogue/page-1.html"))
        print(f"Added fake URL to books list: {fake_url}")

    good_records = []
    errors = []

    for url, source in books:
        cache_file = get_detail_cache_filename(url)
        try:
            html_content = fetch_page(url, cache_file, delay=0.5, stats=stats)
            cache_path = os.path.join(CACHE_DIR, cache_file)
            mtime = os.path.getmtime(cache_path)
            dt = datetime.datetime.fromtimestamp(mtime, tz=datetime.timezone.utc)
            fetched_at = dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            raw_record = parse_detail_page(html_content, url, source, fetched_at)
            
            # Normalize and Validate
            try:
                price_gbp = normalize_price(raw_record["price_text"])
                pydantic_input = {**raw_record, "price_gbp": price_gbp}
                
                validated = BookRecord(**pydantic_input)
                good_records.append(validated.model_dump(mode='json'))
                stats.valid_records += 1
            except Exception as val_err:
                print(f"VALIDATION FAILED for {url}: {val_err}")
                errors.append({
                    "record": raw_record,
                    "error": str(val_err)
                })
                stats.invalid_records += 1

        except Exception as fetch_err:
            print(f"FETCH FAILED for detail page {url}: {fetch_err}")
            stats.failed_pages += 1

    stats.finalize()

    # Create output directory if it doesn't exist
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Write good records (Idempotency: overwriting the file ensures exactly the same count)
    with open(os.path.join(OUTPUT_DIR, "books.json"), "w", encoding="utf-8") as f:
        json.dump(good_records, f, indent=2)

    # Write errors
    with open(os.path.join(OUTPUT_DIR, "errors.json"), "w", encoding="utf-8") as f:
        json.dump(errors, f, indent=2)

    # Write run report
    report_dict = stats.to_dict()
    with open(os.path.join(OUTPUT_DIR, "run-report.json"), "w", encoding="utf-8") as f:
        json.dump(report_dict, f, indent=2)

    print("\n--- RUN REPORT ---")
    print(json.dumps(report_dict, indent=2))
    print(f"Books: {len(good_records)} saved. Errors: {len(errors)} saved.")

def main():
    run_scraper(include_fake_url=True)

if __name__ == "__main__":
    main()
