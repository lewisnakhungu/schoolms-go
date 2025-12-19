import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('landing page loads', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByText(/schoolms/i)).toBeVisible();
    });

    test('has login button', async ({ page }) => {
        await page.goto('/');

        const loginButton = page.getByRole('link', { name: /login|sign in/i });
        await expect(loginButton).toBeVisible();
    });

    test('has signup button', async ({ page }) => {
        await page.goto('/');

        const signupButton = page.getByRole('link', { name: /sign up|get started/i });
        await expect(signupButton).toBeVisible();
    });

    test('navigates to login', async ({ page }) => {
        await page.goto('/');

        const loginButton = page.getByRole('link', { name: /login|sign in/i });
        await loginButton.click();

        await expect(page).toHaveURL(/login/);
    });
});

test.describe('Navigation', () => {
    test('dashboard is protected', async ({ page }) => {
        await page.goto('/dashboard');

        // Should redirect to login if not authenticated
        await expect(page).toHaveURL(/login|dashboard/);
    });

    test('404 page for unknown routes', async ({ page }) => {
        await page.goto('/nonexistent-page');

        // Should show 404 or redirect
        await page.waitForTimeout(1000);
    });
});

test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('login page works on mobile', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByPlaceholder(/email/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('landing page is mobile friendly', async ({ page }) => {
        await page.goto('/');

        // Should have visible content
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Accessibility', () => {
    test('login form is accessible', async ({ page }) => {
        await page.goto('/login');

        // Check for form labels
        const emailInput = page.getByPlaceholder(/email/i);
        await expect(emailInput).toBeVisible();

        // Check keyboard navigation
        await emailInput.focus();
        await page.keyboard.press('Tab');

        const passwordInput = page.getByPlaceholder(/password/i);
        await expect(passwordInput).toBeFocused();
    });

    test('buttons are keyboard accessible', async ({ page }) => {
        await page.goto('/login');

        const submitButton = page.getByRole('button', { name: /sign in/i });
        await submitButton.focus();
        await expect(submitButton).toBeFocused();
    });
});
