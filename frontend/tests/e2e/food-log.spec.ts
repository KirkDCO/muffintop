import { test, expect } from '@playwright/test';

// Helper to log a food with all necessary steps
async function logFood(page: import('@playwright/test').Page, searchTerm: string) {
  await page.getByRole('button', { name: '+ Log Food' }).click();
  await page.getByPlaceholder(/search/i).fill(searchTerm);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.food-card', { timeout: 10000 });
  await page.locator('.food-card').first().click();

  // Wait for food detail and select a portion
  await expect(page.getByText(/Select Portion/i)).toBeVisible({ timeout: 5000 });
  await page.locator('.portion-option').first().click();
  await expect(page.getByRole('button', { name: /Log This Food/i })).toBeEnabled({ timeout: 5000 });
  await page.getByRole('button', { name: /Log This Food/i }).click();
  await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });
}

test.describe('Food Logging Flow', () => {
  const testUserName = `E2E-FoodLog-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Should redirect to user selection if no user
    await expect(page).toHaveURL(/\/select-user/);

    // Click Add New User button to start creation flow
    await page.getByRole('button', { name: '+ Add New User' }).click();

    // Fill in name and proceed through wizard
    await page.getByPlaceholder('Enter your name').fill(testUserName);
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Nutrients - just click Next to accept defaults
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Targets - click Create Account
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: `Hello, ${testUserName}` })).toBeVisible();
  });

  test('should search for food and log it', async ({ page }) => {
    // Click Log Food button
    await page.getByRole('button', { name: '+ Log Food' }).click();

    // Wait for modal to appear
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // Search for a food
    await page.getByPlaceholder(/search/i).fill('banana');
    await page.keyboard.press('Enter');

    // Wait for search results
    await page.waitForSelector('.food-card', { timeout: 10000 });

    // Click on first food result
    await page.locator('.food-card').first().click();

    // Wait for food detail to show and select a portion
    await expect(page.getByText(/Select Portion/i)).toBeVisible({ timeout: 5000 });

    // Select the first portion option (not the custom grams option)
    const portionOption = page.locator('.portion-option').first();
    await portionOption.click();

    // Wait for button to be enabled
    await expect(page.getByRole('button', { name: /Log This Food/i })).toBeEnabled({ timeout: 5000 });

    // Click Log This Food
    await page.getByRole('button', { name: /Log This Food/i }).click();

    // Modal should close
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });

    // Food should appear in the log
    await expect(page.locator('.entries-list')).toContainText(/banana/i, { timeout: 5000 });
  });

  test('should delete a logged food entry', async ({ page }) => {
    // Log a food using helper
    await logFood(page, 'apple');

    // Verify food was logged
    await expect(page.locator('.entries-list')).toContainText(/apple/i, { timeout: 5000 });

    // Find and click delete button - it requires two clicks for confirmation
    await page.locator('.delete-btn').first().click(); // First click shows confirm

    // Wait for confirm state then click again
    await page.waitForSelector('.delete-btn.confirm', { timeout: 2000 });
    await page.locator('.delete-btn.confirm').first().click(); // Second click deletes

    // Wait for entry to be removed from DOM
    await page.waitForFunction(
      () => !document.querySelector('.entries-list')?.textContent?.toLowerCase().includes('apple'),
      { timeout: 5000 }
    );
  });

  test('should show daily summary after logging food', async ({ page }) => {
    // Log a food using helper
    await logFood(page, 'chicken');

    // There should be at least one entry in the entries list
    await expect(page.locator('.entries-list .food-log-entry')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between dates', async ({ page }) => {
    // Click previous day button
    await page.getByRole('button', { name: '←' }).click();

    // URL or date input should change
    const dateInput = page.locator('input[type="date"]');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedDate = yesterday.toISOString().split('T')[0];
    await expect(dateInput).toHaveValue(expectedDate);

    // Click next day button
    await page.getByRole('button', { name: '→' }).click();

    // Should be back to today
    const today = new Date().toISOString().split('T')[0];
    await expect(dateInput).toHaveValue(today);
  });
});
