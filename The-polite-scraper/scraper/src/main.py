import os
import time
import requests
import re
import datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "cache"))
USER_AGENT = "FlyRankInternship-A9/1.0 (+https://github.com/saikatdhrobo/Flyrank-Internship)"
TIMEOUT = 10

def fetch_page(url: str, cache_filename: str = None, delay: float = 0.5) -> str:
    """
    Fetches a page politely. If cache_filename is provided, uses local caching.
    """
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

    if cache_filename:
        cache_path = os.path.join(CACHE_DIR, cache_filename)
        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                content = f.read()
            print(f"CACHE HIT: {url} ({len(content.encode('utf-8'))} bytes)")
            return content

    # Polite delay before request
    if delay > 0:
        time.sleep(delay)

    print(f"FETCH: {url}")
    headers = {"User-Agent": USER_AGENT}
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        if response.status_code != 200:
            print(f"FAILED to fetch {url}: HTTP status {response.status_code}")
            response.raise_for_status()
        
        content = response.text
        if cache_filename:
            cache_path = os.path.join(CACHE_DIR, cache_filename)
            with open(cache_path, "w", encoding="utf-8") as f:
                f.write(content)
        
        print(f"SUCCESS: {url} ({len(content.encode('utf-8'))} bytes)")
        return content
    except Exception as e:
        print(f"ERROR fetching {url}: {e}")
        raise

def discover_books(start_url: str, max_pages: int = 3) -> list[tuple[str, str]]:
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
            html_content = fetch_page(current_url, cache_filename, delay=0.5)
        except Exception as e:
            print(f"Error fetching catalogue page {current_url}: {e}")
            break
            
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Extract book links
        book_links = soup.select("ol.row li article.product_pod h3 a")
        for link in book_links:
            href = link.get("href")
            if href:
                absolute_url = urljoin(current_url, href)
                discovered_books.append((absolute_url, current_url))
                
        # Find next page link
        next_button = soup.select_one("li.next a")
        if next_button:
            next_href = next_button.get("href")
            current_url = urljoin(current_url, next_href)
        else:
            current_url = None
            
    # Remove duplicate books (preserving order)
    seen = set()
    unique_books = []
    for url, source in discovered_books:
        if url not in seen:
            seen.add(url)
            unique_books.append((url, source))
            
    print(f"catalogue_pages={pages_crawled}, discovered={len(discovered_books)}, unique_urls={len(unique_books)}")
    return unique_books

def get_detail_cache_filename(url: str) -> str:
    """
    Generates a clean cache filename for detail pages based on the book path slug.
    """
    parsed = urlparse(url)
    path = parsed.path
    match = re.search(r"([^/]+)/index\.html$", path)
    if match:
        return f"book-{match.group(1)}.html"
    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", path)
    return f"book-{safe_name}.html"

def parse_detail_page(html_content: str, product_url: str, source_page: str, fetched_at: str) -> dict:
    """
    Parses a book detail page and returns raw extracted fields.
    """
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

def main():
    print("Polite Scraper starting (Stage 3)...")
    start_url = "https://books.toscrape.com/catalogue/page-1.html"
    books = discover_books(start_url, max_pages=3)
    
    raw_records = []
    for url, source in books:
        cache_file = get_detail_cache_filename(url)
        try:
            html_content = fetch_page(url, cache_file, delay=0.5)
            cache_path = os.path.join(CACHE_DIR, cache_file)
            mtime = os.path.getmtime(cache_path)
            dt = datetime.datetime.fromtimestamp(mtime, tz=datetime.timezone.utc)
            fetched_at = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            
            record = parse_detail_page(html_content, url, source, fetched_at)
            raw_records.append(record)
        except Exception as e:
            print(f"Error processing detail page {url}: {e}")
            
    print(f"detail_pages={len(raw_records)}")
    if raw_records:
        import pprint
        print("\nSample raw record:")
        pprint.pprint(raw_records[0])

if __name__ == "__main__":
    main()
