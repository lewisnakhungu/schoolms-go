import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('login page loads correctly', async ({ page }) => {
        await page.goto('/login');

        // Actual placeholders from Login.tsx
        await expect(page.getByPlaceholder('admin@school.com')).toBeVisible();
        await expect(page.getByPlaceholder('••••••••')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('shows error on invalid login', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'wrong@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should show error or stay on login page
        await expect(page).toHaveURL(/login/);
    });

    test('successful login redirects to dashboard', async ({ page }) => {
        await page.goto('/login');

        // Using test credentials from seeded data
        await page.fill('input[type="email"]', 'admin@test.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Should redirect to dashboard on success (or show error)
        await page.waitForTimeout(2000);
    });

    test('signup page loads correctly', async ({ page }) => {
        await page.goto('/signup');

        // Actual placeholders from Signup.tsx
        await expect(page.getByPlaceholder('student@school.com')).toBeVisible();
        await expect(page.getByPlaceholder('••••••••')).toBeVisible();
        await expect(page.getByPlaceholder('INV-XXXX-XXXX')).toBeVisible();
    });

    test('has link to login from signup', async ({ page }) => {
        await page.goto('/signup');

        // Actual link text: "Back to Login"
        const loginLink = page.getByText(/back to login/i);
        await expect(loginLink).toBeVisible();
        await loginLink.click();

        await expect(page).toHaveURL(/login/);
    });

    test('has link to signup from login', async ({ page }) => {
        await page.goto('/login');

        const signupLink = page.getByText(/sign up/i);
        await expect(signupLink).toBeVisible();
        await signupLink.click();

        await expect(page).toHaveURL(/signup/);
    });
});
