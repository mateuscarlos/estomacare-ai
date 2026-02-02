from playwright.sync_api import sync_playwright

def verify_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        try:
            url = "http://localhost:4173"
            print(f"Navigating to {url}")
            page.goto(url, timeout=30000)
            page.wait_for_timeout(5000)

            # Check for specific elements
            if page.locator(".animate-spin").count() > 0:
                print("Element with .animate-spin found (Loader)")

            if page.locator("text=Login").count() > 0:
                print("Text 'Login' found")

            if page.locator("input[type='email']").count() > 0:
                print("Email input found")

            print("Taking screenshot...")
            page.screenshot(path="verification_preview.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_load()
