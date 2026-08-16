import { expect, test } from '@playwright/test';

test('shows the default sample as a built-in sample', async ({ page }) => {
  await page.goto('/');
  await page.getByTitle('Toggle Toolbar').click();
  await page.getByTitle('View saved samples').click();

  const defaultSample = page.locator('.sample-item', {
    hasText: 'Default sample',
  });
  await expect(defaultSample).toContainText('Built in');
  await expect(defaultSample.getByRole('button')).toHaveCount(0);
});
