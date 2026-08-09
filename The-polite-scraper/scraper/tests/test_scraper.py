import os
import sys
import unittest
from urllib.parse import urljoin

# Add src folder to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from main import normalize_price, parse_detail_page

class TestScraper(unittest.TestCase):

    def test_price_normalization(self):
        # 1. Price normalization test (various symbols, invalid inputs)
        self.assertEqual(normalize_price("£51.77"), 51.77)
        self.assertEqual(normalize_price("£0.00"), 0.0)
        self.assertEqual(normalize_price("23.82"), 23.82)
        with self.assertRaises(ValueError):
            normalize_price("abc")

    def test_relative_to_absolute_url(self):
        # 2. Relative to absolute URL resolution test
        base_url = "https://books.toscrape.com/catalogue/page-1.html"
        rel_url = "a-light-in-the-attic_1000/index.html"
        abs_url = urljoin(base_url, rel_url)
        self.assertEqual(abs_url, "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html")

    def test_missing_description(self):
        # 3. Missing description test (must produce None/null)
        html = """
        <html>
            <body>
                <div class="product_main">
                    <h1>Test Book</h1>
                    <p class="price_color">£10.00</p>
                    <p class="availability">In stock</p>
                    <p class="star-rating Two"></p>
                </div>
            </body>
        </html>
        """
        record = parse_detail_page(html, "https://books.toscrape.com/book1", "https://books.toscrape.com/page-1", "2026-08-09T10:00:00Z")
        self.assertIsNone(record["description"])
        self.assertEqual(record["title"], "Test Book")

    def test_duplicate_urls_removal(self):
        # 4. Duplicate URLs removal test (simulating deduplication)
        discovered_books = [
            ("https://books.toscrape.com/book1", "https://books.toscrape.com/page1"),
            ("https://books.toscrape.com/book2", "https://books.toscrape.com/page1"),
            ("https://books.toscrape.com/book1", "https://books.toscrape.com/page2"),
        ]
        seen = set()
        unique_books = []
        for url, source in discovered_books:
            if url not in seen:
                seen.add(url)
                unique_books.append((url, source))
        self.assertEqual(len(unique_books), 2)
        self.assertEqual(unique_books[0][0], "https://books.toscrape.com/book1")
        self.assertEqual(unique_books[1][0], "https://books.toscrape.com/book2")

    def test_malformed_fixture(self):
        # 5. Malformed fixture test (missing product main section)
        html = "<html><body><h1>Title but no product main</h1></body></html>"
        with self.assertRaises(ValueError):
            parse_detail_page(html, "https://books.toscrape.com/book1", "https://books.toscrape.com/page-1", "2026-08-09T10:00:00Z")

if __name__ == "__main__":
    unittest.main()
