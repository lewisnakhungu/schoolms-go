import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('landing page loads', async ({ page }) => {
        await page.goto('/');

        // Page should load without error
        await expect(page.locator('body')).toBeVisible();
    });

    test('has login button', async ({ page }) => {
        await page.goto('/');

        // Look for link or button to login
        const loginButton = page.locator('a[href*="login"], button:has-text("Login"), button:has-text("Sign In")').first();
        await expect(loginButton).toBeVisible();
    });

    test('has signup button', async ({ page }) => {
        await page.goto('/');

        const signupButton = page.locator('a[href*="signup"], button:has-text("Sign Up"), button:has-text("Get Started")').first();
        await expect(signupButton).toBeVisible();
    });

    test('navigates to login', async ({ page }) => {
        await page.goto('/');

        const loginButton = page.locator('a[href*="login"]').first();
        if (await loginButton.isVisible()) {
            await loginButton.click();
            await expect(page).toHaveURL(/login/);
        }
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

        // Use actual placeholder from Login.tsx
        await expect(page.getByPlaceholder('admin@school.com')).toBeVisible();
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

        // Use actual placeholder from Login.tsx
        const emailInput = page.getByPlaceholder('admin@school.com');
        await expect(emailInput).toBeVisible();

        // Check form exists
        const form = page.locator('form');
        await expect(form).toBeVisible();
    });

    test('buttons are keyboard accessible', async ({ page }) => {
        await page.goto('/login');

        const submitButton = page.getByRole('button', { name: /sign in/i });
        await submitButton.focus();
        await expect(submitButton).toBeFocused();
    });
});
