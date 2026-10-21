import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    test('filters roles by department', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter').selectOption({ label: 'Finance' });

        const visibleCards = page.locator('[data-testid="role-card"]:visible');
        await expect(visibleCards).toHaveCount(2);
        await expect(
            visibleCards.getByRole('heading', { name: 'Financial Analyst', exact: true }),
        ).toBeVisible();
        await expect(
            visibleCards.getByRole('heading', {
                name: 'Financial Reconciliation Specialist',
                exact: true,
            }),
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Procurement Analyst', exact: true }),
        ).not.toBeVisible();
    });

    test('filters roles by location', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('location-filter').selectOption({
            label: 'Remote (US & Canada)',
        });

        const visibleCards = page.locator('[data-testid="role-card"]:visible');
        await expect(visibleCards).toHaveCount(2);
        await expect(
            visibleCards.getByRole('heading', { name: 'Senior Frontend Engineer', exact: true }),
        ).toBeVisible();
        await expect(
            visibleCards.getByRole('heading', { name: 'Data Platform Engineer', exact: true }),
        ).toBeVisible();
    });

    test('combines department and location filters', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter').selectOption({ label: 'Finance' });
        await page.getByTestId('location-filter').selectOption({
            label: 'Woodinville, WA, USA',
        });

        const visibleCards = page.locator('[data-testid="role-card"]:visible');
        await expect(visibleCards).toHaveCount(1);
        await expect(
            visibleCards.getByRole('heading', { name: 'Financial Analyst', exact: true }),
        ).toBeVisible();
        await expect(page.getByTestId('filter-empty-state')).toBeHidden();
    });

    test('shows an empty state for no matches and resets filters', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter').selectOption({ label: 'Finance' });
        await page.getByTestId('location-filter').selectOption({
            label: 'London, United Kingdom',
        });

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(0);
        await expect(page.getByTestId('filter-empty-state')).toBeVisible();
        await expect(page.getByTestId('empty-state-text')).toHaveText(
            'No roles match your selected filters.',
        );

        await page.getByTestId('role-filter-reset').click();

        await expect(page.getByTestId('department-filter')).toHaveValue('');
        await expect(page.getByTestId('location-filter')).toHaveValue('');
        await expect(page.getByTestId('filter-empty-state')).toBeHidden();
        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(
            expectedRoleCount,
        );
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`keeps ${title} location on details, not starter cards`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByText(location, { exact: true })).toHaveCount(0);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
