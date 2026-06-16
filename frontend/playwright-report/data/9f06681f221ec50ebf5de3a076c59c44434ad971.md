# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.js >> Store Manager Flow >> Chef can schedule production and log EOD outcome/waste
- Location: tests\e2e\e2e.spec.js:59:3

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator:  locator('button:has-text("Recipe Library") ~ button:has-text("Log EOD Outcome / Waste")')
Expected: "rgb(232, 168, 56)"
Received: "rgb(71, 85, 105)"
Timeout:  5000ms

Call log:
  - Expect "toHaveCSS" with timeout 5000ms
  - waiting for locator('button:has-text("Recipe Library") ~ button:has-text("Log EOD Outcome / Waste")')
    14 × locator resolved to <button>…</button>
       - unexpected value "rgb(71, 85, 105)"

```

```yaml
- button "Log EOD Outcome / Waste"
```

# Test source

```ts
  10  |     await page.fill('input[type="password"]', 'ChangeMe123!');
  11  |     await page.click('button[type="submit"]');
  12  |     
  13  |     await page.waitForLoadState('networkidle');
  14  |     await page.waitForTimeout(1000); // Wait for animations
  15  |     
  16  |     // 2. Navigate to Indent Material
  17  |     await page.click('button:has-text("Indent Material")');
  18  |     await page.waitForTimeout(1000);
  19  |     
  20  |     // Check departments are present
  21  |     const dropdown = page.locator('select.indent-field').first();
  22  |     const options = await dropdown.locator('option').allTextContents();
  23  |     
  24  |     expect(options.some(t => t.includes('SI-MEALS'))).toBeTruthy();
  25  |     expect(options.some(t => t.includes('CHAT & SOFTY'))).toBeTruthy();
  26  |     
  27  |     // Select CHAT & SOFTY
  28  |     await dropdown.selectOption({ label: 'CHAT & SOFTY (CHT)' });
  29  |     
  30  |     // Fill the first row
  31  |     await page.fill('input.item-combobox-input', 'Atta');
  32  |     await page.click('text=Atta/ आटा');
  33  |     await page.fill('input[type="number"]', '10');
  34  |     
  35  |     // Submit
  36  |     await page.click('button:has-text("Submit Indent")');
  37  |     await page.waitForSelector('text=Indent submitted ✓', { timeout: 5000 });
  38  |     
  39  |     // 3. Navigate to Store Issuance
  40  |     await page.click('button:has-text("Store Issuance")');
  41  |     await page.waitForTimeout(1000);
  42  |     
  43  |     // 4. Issue the indent
  44  |     // Select the pending indent from the dropdown
  45  |     const selectIndent = page.locator('select:has-text("Choose pending indent")');
  46  |     await selectIndent.selectOption({ index: 1 });
  47  |     
  48  |     // Verify the item is in the issue form
  49  |     await expect(page.locator('tr:has-text("Atta/ आटा")')).toBeVisible();
  50  |     
  51  |     // Confirm the item by clicking the checkbox
  52  |     await page.click('button[aria-label="Confirm item"]');
  53  |     
  54  |     // Issue the material
  55  |     await page.click('button:has-text("Issue & Update Stock")');
  56  |     await page.waitForSelector('text=Material issued and stock updated ✓', { timeout: 5000 });
  57  |   });
  58  | 
  59  |   test('Chef can schedule production and log EOD outcome/waste', async ({ page }) => {
  60  |     // 1. Login
  61  |     await page.goto('http://localhost:8008');
  62  |     await page.waitForLoadState('networkidle');
  63  |     
  64  |     await page.fill('input[autocomplete="email"]', 'manager@kapila.local');
  65  |     await page.fill('input[type="password"]', 'ChangeMe123!');
  66  |     await page.click('button[type="submit"]');
  67  |     
  68  |     await page.waitForLoadState('networkidle');
  69  |     await page.waitForTimeout(1000);
  70  |     
  71  |     // 2. Navigate to Production Planner
  72  |     await page.click('button:has-text("Production Planner")');
  73  |     await page.waitForTimeout(1000);
  74  |     
  75  |     // 3. Verify tabs exist
  76  |     await expect(page.locator('main button:has-text("Recipe Library")')).toBeVisible();
  77  |     await expect(page.locator('main button:has-text("Menu & Production Schedule")')).toBeVisible();
  78  |     await expect(page.locator('main button:has-text("Log EOD Outcome / Waste")')).toBeVisible();
  79  |     await expect(page.locator('main button:has-text("Waste Analytics")')).toBeVisible();
  80  |     
  81  |     // 4. Click Menu & Production Schedule tab
  82  |     await page.click('main button:has-text("Menu & Production Schedule")');
  83  |     await page.waitForTimeout(500);
  84  |     
  85  |     // 5. Select a recipe from the dropdown
  86  |     const recipeSelect = page.locator('label:has-text("Choose a Recipe to Schedule") + select');
  87  |     await expect(recipeSelect).toBeVisible();
  88  |     await recipeSelect.selectOption({ label: 'STF Plain Rice (STAFF)' });
  89  |     
  90  |     // 6. Wait for the scheduling form to render
  91  |     await expect(page.locator('button:has-text("Confirm Production Plan")')).toBeVisible();
  92  | 
  93  |     // Select plate count and set today's date
  94  |     await page.click('button.plates-btn:has-text("150")');
  95  |     
  96  |     const todayStr = new Date().toISOString().slice(0, 10);
  97  |     const dateInput = page.locator('label:has-text("Planned Production Date") + input');
  98  |     await dateInput.fill(todayStr);
  99  |     
  100 |     // 7. Confirm Production Plan
  101 |     await page.click('button:has-text("Confirm Production Plan")');
  102 |     await page.waitForSelector('text=Production plan confirmed ✓', { timeout: 5000 });
  103 |     
  104 |     // 8. Go to Log Outcome
  105 |     await page.click('main button:has-text("Go to Log Outcome")');
  106 |     await page.waitForTimeout(500);
  107 |     
  108 |     // 9. Verify we are on Log EOD Outcome / Waste tab
  109 |     const activeTab = page.locator('button:has-text("Recipe Library") ~ button:has-text("Log EOD Outcome / Waste")');
> 110 |     await expect(activeTab).toHaveCSS('border-bottom-color', 'rgb(232, 168, 56)'); // matches gold color #e8a838
      |                             ^ Error: expect(locator).toHaveCSS(expected) failed
  111 |     
  112 |     // 10. Click Log EOD Outcome / Waste button for the plan in the list
  113 |     await page.locator('div[style*="max-height"] button:has-text("Log EOD Outcome / Waste")').first().click();
  114 |     
  115 |     // 11. Fill in actual sold plates
  116 |     const soldInput = page.locator('label:has-text("Plates Actually Sold") + input');
  117 |     await soldInput.fill('130');
  118 |     
  119 |     // Check that remaining/wasted plates auto-calculated to 20
  120 |     const wastedInput = page.locator('label:has-text("Plates Remaining / Unsold (Wasted)") + input');
  121 |     const wastedVal = await wastedInput.inputValue();
  122 |     expect(wastedVal).toBe('20');
  123 |     
  124 |     // 12. Submit EOD Report
  125 |     await page.click('button:has-text("Submit EOD Report")');
  126 |     await page.waitForSelector('text=End-of-day report submitted successfully ✓', { timeout: 5000 });
  127 |     
  128 |     // 13. Verify completed outcomes displayed
  129 |     await expect(page.locator('text=Sold: 130 plates')).toBeVisible();
  130 |     await expect(page.locator('text=Wasted: 20 plates')).toBeVisible();
  131 |   });
  132 | });
  133 | 
```