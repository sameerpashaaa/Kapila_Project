import { test, expect } from '@playwright/test';

test.describe('Store Manager Flow', () => {
  test('Manager can create an indent and issue it', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:8008');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[autocomplete="email"]', 'manager@kapila.local');
    await page.fill('input[type="password"]', 'ChangeMe123!');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for animations
    
    // 2. Navigate to Indent Material
    await page.click('button:has-text("Indent Material")');
    await page.waitForTimeout(1000);
    
    // Check departments are present
    const dropdown = page.locator('select.indent-field').first();
    const options = await dropdown.locator('option').allTextContents();
    
    expect(options.some(t => t.includes('South Indian'))).toBeTruthy();
    expect(options.some(t => t.includes('Bakery'))).toBeTruthy();
    
    // Select Bakery
    await dropdown.selectOption({ label: 'Bakery (BAKE)' });
    
    // Fill the first row
    await page.fill('input[placeholder="Item name"]', 'Premium Wheat Flour');
    await page.fill('input[type="number"]', '10');
    
    // Submit
    await page.click('button:has-text("Submit Indent")');
    await page.waitForSelector('text=Indent submitted ✓', { timeout: 5000 });
    
    // 3. Navigate to Store Issuance
    await page.click('button:has-text("Store Issuance")');
    await page.waitForTimeout(1000);
    
    // 4. Issue the indent
    // The Indent should appear in the pending list
    // Click the first pending indent card for Bakery
    await page.click('.issuance-card h3:has-text("Bakery") >> nth=0');
    
    // Verify the item is in the issue form
    await expect(page.locator('.issue-row >> text=Premium Wheat Flour')).toBeVisible();
    
    // Issue the material
    await page.click('button:has-text("Issue Material")');
    await page.waitForSelector('text=Material issued and stock updated ✓', { timeout: 5000 });
  });
});
