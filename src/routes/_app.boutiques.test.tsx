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
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import BoutiquesPage, { loader } from './_app.boutiques';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

const mockFetchProductById = vi.hoisted(() =>
    vi.fn((_context: unknown, id: string) => {
        // For master ID requests, return a master product
        if (id === 'ln-heritage-001') {
            return Promise.resolve({
                id: 'ln-heritage-001',
                name: 'The Classic Automatic',
                c_referenceNumber: 'LN-HER-001-SS-LB-BK',
                c_collection: 'heritage',
                imageGroups: [
                    {
                        viewType: 'large',
                        images: [
                            {
                                link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-heritage-001.webp',
                                alt: 'The Classic Automatic',
                            },
                        ],
                    },
                ],
            });
        }
        // For variant ID requests, return a variant that points to the master
        if (id === 'ln-heritage-001-steel-leather-black-40') {
            return Promise.resolve({
                id: 'ln-heritage-001-steel-leather-black-40',
                name: 'The Classic Automatic',
                c_referenceNumber: 'LN-HER-001-SS-LB-BK',
                c_collection: 'heritage',
                master: { masterId: 'ln-heritage-001' },
                imageGroups: [
                    {
                        viewType: 'large',
                        images: [
                            {
                                link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-heritage-001.webp',
                                alt: 'The Classic Automatic',
                            },
                        ],
                    },
                ],
            });
        }
        return Promise.resolve({
            id,
            name: 'Generic Watch',
            imageGroups: [
                {
                    viewType: 'large',
                    images: [
                        {
                            link: `https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/${id}.webp`,
                            alt: 'Watch',
                        },
                    ],
                },
            ],
        });
    })
);

vi.mock('@/lib/stores.server', () => ({
    fetchBoutiques: vi.fn(() => Promise.resolve([])),
}));

// The loader fetches categories only to borrow a DIS version prefix for boutique facade URLs; the
// loader tests exercise store/product wiring, so an empty category list is enough (templateUrl stays
// undefined → store images pass through unchanged).
vi.mock('@/lib/api/categories.server', () => ({
    fetchCategories: vi.fn(() => Promise.resolve([])),
}));

// getConfig reads from the request context store; the loader tests use a bare context, so stub it.
vi.mock('@salesforce/storefront-next-runtime/config', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@salesforce/storefront-next-runtime/config')>()),
    getConfig: vi.fn(() => ({ images: { host: 'https://edge.disstg.commercecloud.salesforce.com' } })),
}));

vi.mock('@/lib/api/search.server', () => ({
    fetchSearchProducts: vi.fn(() => Promise.resolve({ hits: [] })),
}));

vi.mock('@/lib/api/products.server', () => ({
    fetchProductById: mockFetchProductById,
}));

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: () => null,
}));

vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router')>();
    return {
        ...actual,
        useFetcher: () => ({
            state: 'idle',
            data: undefined,
            load: vi.fn(),
            submit: vi.fn(),
        }),
    };
});

describe('BoutiquesPage', () => {
    test('renders the full-page locator with a map', () => {
        const mockStores = [
            {
                id: 'ln-boutique-geneva',
                name: 'Geneva Boutique',
                address1: '12 Quai des Bergues',
                city: 'Geneva',
                stateCode: 'GE',
                postalCode: '1201',
                countryCode: 'CH',
                latitude: 46.207,
                longitude: 6.148,
                inventoryId: 'inventory-ln-boutique-geneva',
            },
        ];
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <BoutiquesPage
                        loaderData={{ pageUrl: 'http://localhost/boutiques', stores: mockStores, catalog: [] }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.getByRole('heading', { name: /book an appointment/i })).toBeInTheDocument();
        expect(screen.getByTestId('boutique-locator')).toBeInTheDocument();
        expect(screen.getByTestId('boutique-directory')).toBeInTheDocument();
        expect(screen.getByTestId('boutique-map')).toBeInTheDocument();
        expect(screen.getByTestId('boutique-appointment')).toBeInTheDocument();
    });

    test('loader returns a canonical page URL and optional product', async () => {
        const data = await loader({
            request: new Request('http://localhost/global/en-US/boutiques?product=ln-heritage-001'),
            url: new URL('http://localhost/global/en-US/boutiques?product=ln-heritage-001'),
            params: {},
            context: {} as never,
            pattern: '/boutiques',
        });
        expect(data.pageUrl).toContain('boutiques');
        expect(data.productId).toBe('ln-heritage-001');
        expect(data.productName).toBe('The Classic Automatic');
        expect(data.piece?.id).toBe('ln-heritage-001');
        expect(data.piece?.name).toBe('The Classic Automatic');
        expect(data.piece?.reference).toBe('LN-HER-001-SS-LB-BK');
        expect(data.piece?.image).toContain('ln-heritage-001');
    });

    test('loader ignores appointment skip flags and still carries the product', async () => {
        const data = await loader({
            request: new Request('http://localhost/global/en-US/boutiques?product=ln-heritage-001&appointment=1'),
            url: new URL('http://localhost/global/en-US/boutiques?product=ln-heritage-001&appointment=1'),
            params: {},
            context: {} as never,
            pattern: '/boutiques',
        });
        expect(data.productId).toBe('ln-heritage-001');
        expect(data.piece?.name).toBe('The Classic Automatic');
        expect(data).not.toHaveProperty('appointment');
    });

    test('loader does not run a catalog search (the browse-all picker was removed)', async () => {
        const { fetchSearchProducts } = await import('@/lib/api/search.server');
        vi.mocked(fetchSearchProducts).mockClear();
        const data = await loader({
            request: new Request('http://localhost/global/en-US/boutiques'),
            url: new URL('http://localhost/global/en-US/boutiques'),
            params: {},
            context: {} as never,
            pattern: '/boutiques',
        });
        expect(data.catalog).toEqual([]);
        // The unconditional cgid=root search — which could time out and take the page down — is gone.
        expect(fetchSearchProducts).not.toHaveBeenCalled();
    });

    test('loader maps a variant id to the master timepiece', async () => {
        const data = await loader({
            request: new Request(
                'http://localhost/global/en-US/boutiques?product=ln-heritage-001-steel-leather-black-40'
            ),
            url: new URL('http://localhost/global/en-US/boutiques?product=ln-heritage-001-steel-leather-black-40'),
            params: {},
            context: {} as never,
            pattern: '/boutiques',
        });
        expect(data.productId).toBe('ln-heritage-001');
        expect(data.piece?.id).toBe('ln-heritage-001');
        expect(data.piece?.name).toBe('The Classic Automatic');
    });
});
