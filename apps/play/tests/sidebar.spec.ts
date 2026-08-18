import { test, expect } from '@playwright/test';

test.describe('Sample Library sidebar', () => {
  test('opens from the toolbar and closes again', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveClass(/sidebar-closed/);

    await page.getByTitle('Toggle Toolbar').click();
    await page.getByTitle('View saved samples').click();
    await expect(sidebar).toHaveClass(/sidebar-open/);
    await expect(
      page.getByRole('heading', { name: 'Sample Library' })
    ).toBeVisible();

    await sidebar.locator('.close-button').click();
    await expect(sidebar).toHaveClass(/sidebar-closed/);
  });
});
