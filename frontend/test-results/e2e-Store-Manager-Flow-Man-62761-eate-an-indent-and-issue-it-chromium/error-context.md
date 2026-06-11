# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.js >> Store Manager Flow >> Manager can create an indent and issue it
- Location: tests\e2e\e2e.spec.js:4:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8008/
Call log:
  - navigating to "http://localhost:8008/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Store Manager Flow', () => {
  4  |   test('Manager can create an indent and issue it', async ({ page }) => {
  5  |     // 1. Login
> 6  |     await page.goto('http://localhost:8008');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8008/
  7  |     await page.waitForLoadState('networkidle');
  8  |     
  9  |     await page.fill('input[autocomplete="email"]', 'manager@kapila.local');
  10 |     await page.fill('input[type="password"]', 'ChangeMe123!');
  11 |     await page.click('button[type="submit"]');
  12 |     
  13 |     await page.waitForLoadState('networkidle');
  14 |     await page.waitForTimeout(1000); // Wait for animations
  15 |     
  16 |     // 2. Navigate to Indent Material
  17 |     await page.click('button:has-text("Indent Material")');
  18 |     await page.waitForTimeout(1000);
  19 |     
  20 |     // Check departments are present
  21 |     const dropdown = page.locator('select.indent-field').first();
  22 |     const options = await dropdown.locator('option').allTextContents();
  23 |     
  24 |     expect(options.some(t => t.includes('South Indian'))).toBeTruthy();
  25 |     expect(options.some(t => t.includes('Bakery'))).toBeTruthy();
  26 |     
  27 |     // Select Bakery
  28 |     await dropdown.selectOption({ label: 'Bakery (BAKE)' });
  29 |     
  30 |     // Fill the first row
  31 |     await page.fill('input[placeholder="Item name"]', 'Premium Wheat Flour');
  32 |     await page.fill('input[type="number"]', '10');
  33 |     
  34 |     // Submit
  35 |     await page.click('button:has-text("Submit Indent")');
  36 |     await page.waitForSelector('text=Indent submitted ✓', { timeout: 5000 });
  37 |     
  38 |     // 3. Navigate to Store Issuance
  39 |     await page.click('button:has-text("Store Issuance")');
  40 |     await page.waitForTimeout(1000);
  41 |     
  42 |     // 4. Issue the indent
  43 |     // The Indent should appear in the pending list
  44 |     // Click the first pending indent card for Bakery
  45 |     await page.click('.issuance-card h3:has-text("Bakery") >> nth=0');
  46 |     
  47 |     // Verify the item is in the issue form
  48 |     await expect(page.locator('.issue-row >> text=Premium Wheat Flour')).toBeVisible();
  49 |     
  50 |     // Issue the material
  51 |     await page.click('button:has-text("Issue Material")');
  52 |     await page.waitForSelector('text=Material issued and stock updated ✓', { timeout: 5000 });
  53 |   });
  54 | });
  55 | 
```