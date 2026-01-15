import { test, expect } from '@playwright/test';

test.describe('Recipe Creation Flow', () => {
  const testUserName = `E2E-Recipe-${Date.now()}`;
  const testRecipeName = `TestRecipe-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Create user quickly
    await page.goto('/select-user');
    await page.click('text=+ Add New User');
    await page.fill('[placeholder="Enter your name"]', testUserName);
    await page.click('text=Next');
    await page.click('text=Next');
    await page.click('text=Create Account');
    await expect(page).toHaveURL('/');

    // Go to recipes
    await page.click('text=Recipes');
    await expect(page).toHaveURL('/recipes');
  });

  test('should create and view a recipe', async ({ page }) => {
    // Click new recipe
    await page.click('text=+ New Recipe');

    // Wait for recipe builder to load
    await page.waitForSelector('[placeholder="Enter recipe name"]', { timeout: 5000 });

    // Fill recipe name
    await page.fill('[placeholder="Enter recipe name"]', testRecipeName);

    // Click Add Ingredient to show search
    await page.click('text=+ Add Ingredient');

    // Fill ingredient search
    await page.fill('[placeholder="Search for an ingredient..."]', 'rice');
    await page.keyboard.press('Enter');

    // Wait for results and click first
    await page.waitForSelector('.food-card', { timeout: 5000 });
    await page.click('.food-card');

    // Verify ingredient was added
    await page.waitForTimeout(500);
    const ingredientCount = await page.locator('.ingredient-item, .ingredient-row').count();
    console.log('Ingredients count:', ingredientCount);

    // Check if Save button is enabled
    const saveButton = page.locator('text=Save Recipe');
    const isDisabled = await saveButton.isDisabled();
    console.log('Save button disabled:', isDisabled);

    // Save recipe
    await saveButton.click();

    // Wait for save to complete - the "+ New Recipe" button reappears when back in list mode
    await page.waitForSelector('text=+ New Recipe', { timeout: 10000 });

    // Recipe should appear in list after save
    await expect(page.getByText(testRecipeName)).toBeVisible({ timeout: 5000 });
  });
});
