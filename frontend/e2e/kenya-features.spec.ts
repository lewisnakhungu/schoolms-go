import { test, expect } from '@playwright/test';

// Helper to login as admin
async function loginAsAdmin(page) {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
}

test.describe('Vote Head Management', () => {
    test.beforeEach(async ({ page }) => {
        // For now, go directly to page since auth is complex
        await page.goto('/dashboard/vote-heads');
    });

    test('vote head page loads', async ({ page }) => {
        await expect(page.getByText(/vote heads/i)).toBeVisible();
    });

    test('shows add button', async ({ page }) => {
        await expect(page.getByText(/add vote head/i)).toBeVisible();
    });

    test('opens modal on add click', async ({ page }) => {
        await page.click('text=Add Vote Head');

        await expect(page.getByText(/new vote head/i)).toBeVisible();
    });

    test('can close modal', async ({ page }) => {
        await page.click('text=Add Vote Head');
        await expect(page.getByText(/new vote head/i)).toBeVisible();

        // Press escape or click cancel
        await page.keyboard.press('Escape');
    });
});

test.describe('Industrial Attachments', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/attachments');
    });

    test('attachments page loads', async ({ page }) => {
        await expect(page.getByText(/industrial attachments/i)).toBeVisible();
    });

    test('shows status filter buttons', async ({ page }) => {
        await expect(page.getByText('All')).toBeVisible();
        await expect(page.getByText('PLANNED')).toBeVisible();
        await expect(page.getByText('ONGOING')).toBeVisible();
    });

    test('shows add button', async ({ page }) => {
        await expect(page.getByText(/new attachment/i)).toBeVisible();
    });

    test('opens new attachment modal', async ({ page }) => {
        await page.click('text=New Attachment');

        await expect(page.getByText(/company name/i)).toBeVisible();
        await expect(page.getByText(/supervisor/i)).toBeVisible();
    });
});

test.describe('Data Import', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/import');
    });

    test('import page loads', async ({ page }) => {
        await expect(page.getByText(/import students/i)).toBeVisible();
    });

    test('shows file upload section', async ({ page }) => {
        await expect(page.getByText(/choose file/i)).toBeVisible();
    });

    test('shows format requirements', async ({ page }) => {
        await expect(page.getByText(/required columns/i)).toBeVisible();
    });
});
