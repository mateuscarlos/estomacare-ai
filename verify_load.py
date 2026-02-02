from playwright.sync_api import sync_playwright

def verify_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000", timeout=30000)

            # Wait a bit to let React hydrate and Suspense settle
            page.wait_for_timeout(3000)

            print("Taking screenshot...")
            page.screenshot(path="verification.png")
            print("Screenshot saved to verification.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_load()
