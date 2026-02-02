from playwright.sync_api import sync_playwright

def verify_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        try:
            print("Navigating to http://localhost:3000/#/login")
            page.goto("http://localhost:3000/#/login", timeout=30000)
            page.wait_for_timeout(5000)

            content = page.content()
            print(f"Page Content Length: {len(content)}")
            print(f"Page Content Snippet: {content[:1000]}")

            with open("page_dump.html", "w") as f:
                f.write(content)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_load()
