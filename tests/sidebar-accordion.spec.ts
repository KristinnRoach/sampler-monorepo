import { test, expect } from '@playwright/test';

// Minimal test for Sidebar Accordion switching

test.describe('Sidebar Accordion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can switch between Menu and Saved Samples sections', async ({
    page,
  }) => {
    // Open sidebar with Menu section
    await page.getByTitle('Toggle sidebar menu').click();
    await expect(
      page.getByRole('heading', { name: /sidebar menu/i })
    ).toBeVisible();
    // Menu section should be visible
    await expect(
      page.locator('.accordion-header', { hasText: 'Menu' })
    ).toHaveClass(/open/);
    await expect(page.getByText('Home')).toBeVisible();

    // Switch to Saved Samples section
    await page.getByRole('button', { name: /saved samples/i }).click();
    await expect(
      page.getByRole('button', { name: /saved samples/i })
    ).toHaveClass(/open/);
    await expect(
      page
        .getByText('No saved samples')
        .or(page.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/))
    ).toBeVisible();

    // Switch back to Menu section
    await page.getByRole('button', { name: /menu/i }).click();

    // Debug: print aria-expanded and class for Menu header
    const menuHeader = page.locator('.accordion-header', { hasText: 'Menu' });
    const ariaExpanded = await menuHeader.getAttribute('aria-expanded');
    const menuClass = await menuHeader.getAttribute('class');
    // eslint-disable-next-line no-console
    console.log(
      'Menu header aria-expanded:',
      ariaExpanded,
      'class:',
      menuClass
    );

    // Print the sidebar DOM for inspection
    const sidebarHtml = await page.locator('.sidebar').innerHTML();
    // eslint-disable-next-line no-console
    console.log('Sidebar DOM:', sidebarHtml);

    await expect(menuHeader).toHaveClass(/open/);
    await expect(page.getByText('Home')).toBeVisible();

    // Switch to Saved Samples section again
    await page
      .locator('.accordion-header', { hasText: 'Saved Samples' })
      .click();
    await expect(
      page.locator('.accordion-header', { hasText: 'Saved Samples' })
    ).toHaveClass(/open/);
  });
});
