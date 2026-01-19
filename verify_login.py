
from playwright.sync_api import Page, expect, sync_playwright
import os
import time

def verify_password_toggle(page: Page):
  # 1. Arrange: Go to the app.
  page.goto("http://localhost:4173/")

  # Expect to be on login page.
  expect(page.get_by_text("EstomaCare AI")).to_be_visible()

  # 2. Type password
  # Note: "Senha" matches both label and button aria-label text if fuzzy, so be specific if needed.
  # But get_by_label usually matches the associated label.
  password_input = page.get_by_label("Senha", exact=True)
  password_input.fill("secret123")

  # 3. Screenshot Hidden
  os.makedirs("/home/jules/verification", exist_ok=True)
  page.screenshot(path="/home/jules/verification/1_password_hidden.png")

  # Verify type is password
  type_attr = password_input.get_attribute("type")
  if type_attr != "password":
      print(f"Error: Expected type='password', got '{type_attr}'")
  else:
      print("Pass: Initial type is 'password'")

  # 4. Click Toggle
  # Toggle button has aria-label="Mostrar senha" initially
  toggle_btn = page.get_by_label("Mostrar senha")
  toggle_btn.click()

  # 5. Screenshot Visible
  page.screenshot(path="/home/jules/verification/2_password_visible.png")

  # Verify type is text
  type_attr = password_input.get_attribute("type")
  if type_attr != "text":
      print(f"Error: Expected type='text', got '{type_attr}'")
  else:
      print("Pass: Type is 'text' after click")

  # 6. Click Toggle again
  toggle_btn = page.get_by_label("Ocultar senha") # Label changes
  toggle_btn.click()

  # 7. Screenshot Hidden again
  page.screenshot(path="/home/jules/verification/3_password_hidden_again.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      verify_password_toggle(page)
    finally:
      browser.close()
