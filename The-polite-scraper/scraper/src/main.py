import os
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

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
            # We don't print the whole HTML, just report size as requested.
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
            # First catalogue page fetch doesn't need delay for development if it is in cache,
            # but for live requests fetch_page sleeps 0.5s.
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

def main():
    print("Polite Scraper starting (Stage 2)...")
    start_url = "https://books.toscrape.com/catalogue/page-1.html"
    discover_books(start_url, max_pages=3)

if __name__ == "__main__":
    main()
