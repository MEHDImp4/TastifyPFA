from playwright.sync_api import sync_playwright
import time
import json

def run():
    with sync_playwright() as p:
        device = p.devices['iPhone 13 Pro']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(**device)
        page = context.new_page()

        page.on('console', lambda msg: print(f"PAGE LOG: {msg.text}"))

        print("Navigating to login...")
        page.goto('http://localhost:3000/login')
        page.wait_for_load_state('networkidle')

        print("Logging in...")
        page.fill('[data-testid="login-username"]', 'serveur_test')
        page.fill('[data-testid="login-password"]', 'password123')
        page.click('[data-testid="login-submit"]')
        page.wait_for_url('**/salle')

        print("Navigating to Table 1...")
        page.goto('http://localhost:3000/ordering/1')
        page.wait_for_load_state('networkidle')
        
        # Wait for data to load
        time.sleep(3)
        
        # Inject script to get the state from the component if possible, 
        # or just inspect the DOM
        
        ticket_items = page.locator('[data-testid="ordering-cart"] .flex.flex-col > div').count()
        print(f"Number of items in ticket: {ticket_items}")
        
        # Take a screenshot to see what's going on
        page.screenshot(path='debug_ticket.png', full_page=True)
        
        # Inspect the content of the ticket
        content = page.locator('[data-testid="ordering-cart"]').inner_text()
        print("Ticket Content:")
        print(content)

        browser.close()

if __name__ == "__main__":
    run()
