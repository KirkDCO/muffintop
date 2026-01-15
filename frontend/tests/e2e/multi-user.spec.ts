import { test, expect } from '@playwright/test';

test.describe('Multi-User Isolation', () => {
  const user1Name = `E2E-User1-${Date.now()}`;
  const user2Name = `E2E-User2-${Date.now()}`;

  test('should create user and persist selection', async ({ page }) => {
    // Go to select user page
    await page.goto('/select-user');

    // Create a new user through the wizard
    await page.click('text=+ Add New User');
    await page.fill('[placeholder="Enter your name"]', user1Name);
    await page.click('text=Next');
    await page.click('text=Next');
    await page.click('text=Create Account');

    // Should be on dashboard - user name shown in "Hello, {name}"
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=/Hello,/')).toContainText(user1Name, { timeout: 5000 });

    // Reload - should still be same user
    await page.reload();
    await expect(page.locator('text=/Hello,/')).toContainText(user1Name, { timeout: 5000 });
  });

  test('should switch between users', async ({ page }) => {
    // Create first user
    await page.goto('/select-user');
    await page.click('text=+ Add New User');
    await page.fill('[placeholder="Enter your name"]', user1Name + '-A');
    await page.click('text=Next');
    await page.click('text=Next');
    await page.click('text=Create Account');
    await expect(page).toHaveURL('/');

    // Navigate to select user via direct URL (simpler than finding Switch User button)
    await page.goto('/select-user');

    // Create second user
    await page.click('text=+ Add New User');
    await page.fill('[placeholder="Enter your name"]', user2Name + '-B');
    await page.click('text=Next');
    await page.click('text=Next');
    await page.click('text=Create Account');

    // Should be logged in as user 2
    await expect(page.locator('text=/Hello,/')).toContainText(user2Name + '-B', { timeout: 5000 });

    // Switch back to user 1 via URL
    await page.goto('/select-user');
    await page.click(`text=${user1Name}-A`);
    await expect(page.locator('text=/Hello,/')).toContainText(user1Name + '-A', { timeout: 5000 });
  });
});
