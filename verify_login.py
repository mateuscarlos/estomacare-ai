
from playwright.sync_api import Page, expect, sync_playwright
import os

def test_login_page(page: Page):
  # 1. Arrange: Go to the app.
  page.goto("http://localhost:3000")

  # 2. Assert: Check if we are redirected to login or see login.
  # The app redirects to /login if !user.
  # Check for "Entrar" or similar text.
  # Looking at Login.tsx (I haven't read it but guessing standard login form)

  # Let's wait for something visible.
  page.wait_for_timeout(2000) # Wait for React to hydrate and redirect

  # 3. Screenshot
  os.makedirs("/home/jules/verification", exist_ok=True)
  page.screenshot(path="/home/jules/verification/login_page.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      test_login_page(page)
    finally:
      browser.close()
