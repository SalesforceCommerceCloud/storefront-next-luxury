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

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import ProductView from './product-view';
import ProductViewProvider from '@/providers/product-view';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import type { ShopperProducts } from '@/scapi';
import { getTranslation } from '@salesforce/storefront-next-runtime/i18n';
import { createMockLuxuryWatch, createMockStrap } from '../../test-support/mock-watch';

const { t } = getTranslation();

// The hero renders <FadeThroughImage src={...} />. Mock it to capture the src the PDP feeds it — the
// fade animation itself is covered by the fade-through-image unit tests — so these tests stay focused on
// ProductView choosing the right hero for the current selection.
const capturedHeroProps: { last: { src?: string; alt?: string } | null } = { last: null };

vi.mock('@/components/fade-through-image', () => ({
    FadeThroughImage: (props: { src?: string; alt?: string }) => {
        capturedHeroProps.last = props;
        return <img alt={props.alt ?? ''} src={props.src ?? ''} data-testid="pdp-hero-image" />;
    },
}));

vi.mock('@/components/toast', () => ({
    useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/hooks/use-scapi-fetcher', () => {
    const cache = new Map<string, unknown>();
    return {
        useScapiFetcher: (client: string, method: string, options?: { params?: { path?: { id?: string } } }) => {
            if (client === 'shopperProducts' && method === 'getProduct') {
                const id = options?.params?.path?.id ?? 'unknown';
                if (!cache.has(id)) {
                    cache.set(id, {
                        load: () => Promise.resolve(),
                        state: 'idle',
                        success: true,
                        data: { id, inventory: { orderable: true, ats: 50, stockLevel: 50 } },
                        errors: undefined,
                    });
                }
                return cache.get(id);
            }
            return { load: () => Promise.resolve(), state: 'idle', success: false, data: undefined, errors: undefined };
        },
    };
});

const capturedProductItems: Array<{ productId?: string; quantity?: number }> = [];

function renderLuxuryPdp(
    productId: string,
    product: ShopperProducts.schemas['Product'],
    straps: ShopperProducts.schemas['Product'][] = []
) {
    const router = createMemoryRouter(
        [
            {
                path: '/product/:productId',
                element: (
                    <AllProvidersWrapper>
                        <ProductViewProvider product={product} mode="add">
                            <ProductView product={product} straps={straps} />
                        </ProductViewProvider>
                    </AllProvidersWrapper>
                ),
            },
            {
                path: '/boutiques',
                element: <div data-testid="boutiques-page" />,
            },
            {
                path: '/action/cart-item-add',
                action: async ({ request }) => {
                    const formData = await request.formData();
                    const raw = formData.get('productItem');
                    if (typeof raw === 'string') {
                        capturedProductItems.push(JSON.parse(raw) as { productId?: string; quantity?: number });
                    }
                    return { success: true };
                },
            },
        ],
        { initialEntries: [`/product/${productId}`] }
    );
    return { ...render(<RouterProvider router={router} />), product };
}

describe('Luxury ProductView appointment vs Add to Cart', () => {
    beforeEach(() => {
        capturedProductItems.length = 0;
        capturedHeroProps.last = null;
    });

    test('shows a single hero packshot and below-fold details', () => {
        const product = createMockLuxuryWatch();
        const straps = [createMockStrap('ln-strap-nato-navy'), createMockStrap('ln-strap-leather-black')];
        renderLuxuryPdp('ln-heritage-001', product, straps);
        // A single hero packshot, sourced from the product's first gallery image.
        expect(screen.getAllByTestId('pdp-hero-image')).toHaveLength(1);
        expect(String(capturedHeroProps.last?.src ?? '')).toMatch(/ln-heritage-001\.webp/);
        expect(screen.getByTestId('luxury-pdp-hero')).toBeInTheDocument();
        expect(screen.getByTestId('luxury-pdp-details')).toBeInTheDocument();
        expect(screen.queryByText(/market street/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/a automatic/i)).not.toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'Strap' })).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'Dial' })).toBeInTheDocument();
        expect(screen.queryByRole('radio', { name: '40mm' })).not.toBeInTheDocument();
        const strapsSelector = screen.getByTestId('strap-selector');
        expect(within(strapsSelector).getAllByRole('img').length).toBeGreaterThan(0);
    });

    test('hides Add to Cart and links Book an appointment for watches at or above $3,000', () => {
        const product = createMockLuxuryWatch({ id: 'ln-heritage-002', price: 3500 });
        renderLuxuryPdp('ln-heritage-002', product);
        expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
        const appointment = screen.getByRole('link', { name: /book an appointment/i });
        expect(appointment).toHaveAttribute('href', expect.stringContaining('/boutiques'));
        expect(appointment).toHaveAttribute('href', expect.stringContaining('product=ln-heritage-002'));
        expect(appointment).not.toHaveAttribute('href', expect.stringContaining('appointment=1'));
        expect(screen.getByRole('link', { name: /find a boutique/i })).toBeInTheDocument();
    });

    test('keeps Add to Cart for watches under $3,000 and still offers an appointment', () => {
        const product = createMockLuxuryWatch({ id: 'ln-heritage-005', price: 1500 });
        renderLuxuryPdp('ln-heritage-005', product);
        expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /book an appointment/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /find a boutique/i })).toBeInTheDocument();
    });

    test('enables Add to Cart once the first orderable variant is seeded', async () => {
        const product = createMockLuxuryWatch({ id: 'ln-sport-003', price: 2000 });
        renderLuxuryPdp('ln-sport-003', product);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add to cart/i })).toBeEnabled();
        });
        expect(screen.queryByText(t('product:selectAllOptions'))).not.toBeInTheDocument();
    });

    test('submits the matching SKU after the dial is changed', async () => {
        const user = userEvent.setup();
        const product = createMockLuxuryWatch({ id: 'ln-sport-003', price: 2000 });
        renderLuxuryPdp('ln-sport-003', product);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add to cart/i })).toBeEnabled();
        });

        const configurator = screen.getByTestId('watch-configurator');
        await user.click(within(configurator).getByRole('radio', { name: 'Black' }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add to cart/i })).toBeEnabled();
        });
        expect(screen.queryByText(t('product:selectAllOptions'))).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /add to cart/i }));
        await waitFor(() => {
            expect(capturedProductItems).toHaveLength(1);
        });
        expect(capturedProductItems[0]?.productId).toBe('ln-sport-003-steel-leather-black-black-40');
    });

    test('swaps the hero packshot when a tagged dial combo is chosen', async () => {
        const user = userEvent.setup();
        const product = createMockLuxuryWatch();
        renderLuxuryPdp('ln-heritage-001', product);
        const heroSrc = () => String(capturedHeroProps.last?.src ?? '');
        expect(heroSrc()).toMatch(/ln-heritage-001\.webp/);

        await user.click(screen.getByRole('radio', { name: /^White$/ }));
        expect(heroSrc()).toMatch(/white-leather-black/);

        await user.click(screen.getByRole('radio', { name: /^Black$/ }));
        expect(heroSrc()).toMatch(/ln-heritage-001\.webp/);

        await user.click(screen.getByRole('radio', { name: /^Leather Brown$/ }));
        expect(heroSrc()).toMatch(/black-leather-brown/);
    });

    test('an incompatible option stays disabled — the URL never carries an invalid combo', async () => {
        const user = userEvent.setup();
        // Guards the handleConfigChange contract from the other direction: because options are only
        // clickable when compatible with the whole selection, selecting White must leave the
        // incompatible Leather Brown strap disabled rather than letting it be chosen into the URL
        // (which is what would strand an option both aria-checked and disabled).
        const product = createMockLuxuryWatch({ id: 'ln-heritage-001', price: 1500 });
        renderLuxuryPdp('ln-heritage-001', product);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add to cart/i })).toBeEnabled();
        });

        await user.click(screen.getByRole('radio', { name: /^White$/ }));
        const white = screen.getByRole('radio', { name: /^White$/ });
        const leatherBrown = screen.getByRole('radio', { name: /^Leather Brown$/ });
        expect(white).toHaveAttribute('aria-checked', 'true');
        expect(white).toBeEnabled();
        // No white + leather_brown variant exists, so the strap is disabled and cannot be selected.
        expect(leatherBrown).toBeDisabled();
        await user.click(leatherBrown);
        expect(leatherBrown).toHaveAttribute('aria-checked', 'false');
        expect(white).toHaveAttribute('aria-checked', 'true');
    });
});
