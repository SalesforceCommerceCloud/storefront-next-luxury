/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import 'reflect-metadata';
import Header, { HeaderMetadata } from './index';
import { getRegionDefinitions } from '@/lib/decorators/region-definition';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

vi.mock('@/components/link', () => ({
    Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
        <a href={to} {...rest}>
            {children}
        </a>
    ),
}));

vi.mock('@/components/header/search', () => ({
    default: () => <div data-testid="search" />,
}));

vi.mock('@/components/header/cart-badge', () => ({
    default: () => <div data-testid="cart-badge" />,
}));

vi.mock('@/components/header/user-actions/user-actions', () => ({
    default: () => <div data-testid="user-actions" />,
}));

vi.mock('@/components/header/wishlist-icon', () => ({
    default: () => <div data-testid="wishlist-icon" />,
}));

vi.mock('@/components/cimulate', () => ({
    openAgentWidget: vi.fn(),
    isCimulateEnabled: vi.fn(() => false),
    validateCimulateConfig: vi.fn(() => false),
}));

vi.mock('@/targets/ui-target', () => ({
    UITarget: () => null,
}));

vi.mock('@salesforce/storefront-next-runtime/config', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@salesforce/storefront-next-runtime/config')>();
    return {
        ...actual,
        useConfig: () => ({ cimulateAgent: { enabled: false } }),
    };
});

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

function renderHeader(ui: React.ReactElement) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>{ui}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('Luxury Header', () => {
    describe('full variant (default)', () => {
        it('renders a left logo with search, account, wishlist, and cart', () => {
            renderHeader(<Header />);
            expect(screen.getByTestId('header-logo')).toBeInTheDocument();
            expect(screen.getAllByTestId('search').length).toBeGreaterThan(0);
            expect(screen.getByTestId('header-search-toggle')).toBeInTheDocument();
            expect(screen.queryByTestId('header-search-mobile')).not.toBeInTheDocument();
            expect(screen.getByTestId('user-actions')).toBeInTheDocument();
            expect(screen.getByTestId('wishlist-icon')).toBeInTheDocument();
            expect(screen.getByTestId('cart-badge')).toBeInTheDocument();
        });

        it('opens the mobile search field from the search icon', async () => {
            const user = userEvent.setup();
            renderHeader(<Header />);
            await user.click(screen.getByTestId('header-search-toggle'));
            expect(screen.getByTestId('header-search-mobile')).toBeInTheDocument();
            expect(screen.getByTestId('header-search-toggle')).toHaveAttribute('aria-expanded', 'true');
        });

        it('renders children passed as navigation menu', () => {
            renderHeader(
                <Header>
                    <nav data-testid="nav-menu">menu</nav>
                </Header>
            );
            expect(screen.getAllByTestId('nav-menu').length).toBeGreaterThanOrEqual(1);
        });

        it('exposes a catalog row slot under the lockup', () => {
            renderHeader(<Header />);
            expect(document.querySelector('[data-slot="luxury-catalog-slot"]')).toBeInTheDocument();
        });

        it('exposes a utility slot for Watch Finder and Boutiques', () => {
            renderHeader(<Header />);
            expect(document.querySelector('[data-slot="luxury-utility-slot"]')).toBeInTheDocument();
        });

        it('exposes conceal-on-scroll state on the full header', () => {
            renderHeader(<Header />);
            const header = document.querySelector('[data-slot="site-header"]');
            expect(header).toHaveAttribute('data-header-concealed', 'false');
            expect(header?.className).toMatch(/fixed/);
        });

        it('renders the provided announcementSlot', () => {
            renderHeader(<Header announcementSlot={<div data-testid="announcement-slot">Announcement</div>} />);
            expect(screen.getByTestId('announcement-slot')).toBeInTheDocument();
        });
    });

    describe('checkout variant', () => {
        it('renders only logo and cart badge', () => {
            renderHeader(<Header variant="checkout" />);
            expect(screen.getByTestId('header-logo')).toBeInTheDocument();
            expect(screen.getByTestId('cart-badge')).toBeInTheDocument();
            expect(screen.queryByTestId('search')).not.toBeInTheDocument();
            expect(screen.queryByTestId('user-actions')).not.toBeInTheDocument();
            expect(document.querySelector('[data-slot="site-header"]')).not.toHaveAttribute('data-header-concealed');
        });
    });
});

describe('Luxury HeaderMetadata', () => {
    it('declares a single announcement region', () => {
        const definitions = getRegionDefinitions(HeaderMetadata);
        expect(definitions).toHaveLength(1);
        expect(definitions[0].id).toBe('announcement');
    });
});
