import os
import time
import requests

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

def main():
    print("Polite Scraper starting (Stage 1)...")
    url = "https://books.toscrape.com/catalogue/page-1.html"
    fetch_page(url, "catalogue-page-1.html", delay=0.0)

if __name__ == "__main__":
    main()
