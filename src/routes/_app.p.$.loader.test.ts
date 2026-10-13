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

import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { RouterContextProvider } from 'react-router';
import type { ShopperProducts } from '@/scapi';
import { loader } from './_app.p.$';
import type { Route } from './+types/_app.p.$';
import { appConfigContext } from '@salesforce/storefront-next-runtime/config';
import { authContext } from '@/middlewares/auth.utils';
import { siteContext } from '@salesforce/storefront-next-runtime/site-context';

// Mock fetchProductById directly
const mockFetchProductById = vi.hoisted(() => vi.fn());
const mockAttemptRouteSeoFallback = vi.hoisted(() => vi.fn());
// @sfdc-extension-block-start SFDC_EXT_SHIPPING_DELIVERY
const mockGetInitialDeliveryDestination = vi.hoisted(() =>
    vi.fn<() => Promise<{ postalCode: string; countryCode?: string } | null>>(() => Promise.resolve(null))
);
// @sfdc-extension-block-end SFDC_EXT_SHIPPING_DELIVERY

vi.mock('@/lib/api/products.server', () => ({
    fetchProductById: mockFetchProductById,
    fetchProductsByIds: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/lib/seo/route-fallback.server', () => ({
    attemptRouteSeoFallback: mockAttemptRouteSeoFallback,
}));

vi.mock('@/lib/api/search.server', () => ({
    fetchSearchProducts: vi.fn(() => Promise.resolve({ hits: [] })),
}));

// @sfdc-extension-block-start SFDC_EXT_SHIPPING_DELIVERY
vi.mock('@/extensions/shipping-delivery/lib/api/delivery-destination-cookie.server', () => ({
    getInitialDeliveryDestination: mockGetInitialDeliveryDestination,
}));
// @sfdc-extension-block-end SFDC_EXT_SHIPPING_DELIVERY

vi.mock('@/middlewares/auth.server', () => ({
    getAuth: vi.fn(() => ({ customerId: null })),
}));

// Mock Page Designer functions - use vi.hoisted to avoid hoisting issues
const mockFetchPageWithComponentData = vi.hoisted(() =>
    vi.fn(() =>
        Promise.resolve({
            id: 'pdp',
            typeId: 'page',
            aspectTypeId: 'pdp',
            name: 'Product Detail Page',
            regions: [],
            componentData: {},
        })
    )
);

vi.mock('@/lib/page-designer/page-loader.server', () => ({
    fetchPageWithComponentData: mockFetchPageWithComponentData,
}));

vi.mock('@/lib/product/recommendations.server', () => ({
    fetchProductRecommendations: vi.fn(() => Promise.resolve({ recoUUID: 'test', recs: [] })),
}));

// @sfdc-extension-block-start SFDC_EXT_BOPIS
import { selectedStoreContext } from '@/extensions/store-locator/middlewares/selected-store.server';
// @sfdc-extension-block-end SFDC_EXT_BOPIS

describe('Product Route Loaders', () => {
    const mockProduct: ShopperProducts.schemas['Product'] = {
        id: 'test-product-123',
        name: 'Test Product',
        primaryCategoryId: 'test-category-123',
        shortDescription: 'Test product description',
        longDescription: 'Long test product description',
        master: undefined,
    };

    const mockAppConfig = {
        commerce: {
            api: {
                organizationId: 'test-org',
                siteId: 'test-site',
                clientId: 'test-client-id',
                proxy: '/api/commerce',
            },
        },
        sitePreferences: {
            productDetailSitePreferences: {},
        },
    };
    let activeAppConfig: object = mockAppConfig;

    const mockAuthSession = {
        ref: Promise.resolve({
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            token_type: 'Bearer',
        }),
    };

    // @sfdc-extension-block-start SFDC_EXT_BOPIS
    let mockSelectedStoreInfo: { id?: string; name?: string; inventoryId?: string } | null = null;
    // @sfdc-extension-block-end SFDC_EXT_BOPIS

    const mockContext = {
        locale: 'en-US',
        currency: 'USD',
        siteId: 'test-site',
        get: vi.fn((context) => {
            if (context === appConfigContext) {
                return activeAppConfig;
            }
            if (context === authContext) {
                return mockAuthSession;
            }
            if (context === siteContext) {
                return { currency: 'USD', site: { id: 'test-site' }, locale: { id: 'en-US' } };
            }
            // @sfdc-extension-block-start SFDC_EXT_BOPIS
            if (context === selectedStoreContext) {
                return mockSelectedStoreInfo;
            }
            // @sfdc-extension-block-end SFDC_EXT_BOPIS
            return undefined;
        }),
        set: vi.fn(),
    } as unknown as Readonly<RouterContextProvider>;

    beforeEach(() => {
        vi.clearAllMocks();
        activeAppConfig = mockAppConfig;
        mockAttemptRouteSeoFallback.mockResolvedValue(undefined);
    });

    describe('loader function', () => {
        test('301-redirects a stale slug from the existing product lookup', async () => {
            activeAppConfig = {
                ...mockAppConfig,
                url: {
                    seoRoutes: {
                        'test-site': {
                            product: { prefix: 'p' },
                            category: { prefix: 'c', mode: 'id-suffix' },
                        },
                    },
                },
            };
            mockFetchProductById.mockResolvedValueOnce({ ...mockProduct, slug: 'current café' });
            const request = new Request('https://example.com/p/old-slug/test-product-123?color=blue');

            const response = await loader({
                request,
                params: {
                    siteId: 'test-site',
                    localeId: 'en-US',
                    '*': 'old-slug/test-product-123',
                } as Route.LoaderArgs['params'],
                context: mockContext,
                url: new URL(request.url),
                pattern: '/p/*',
            }).then(
                () => undefined,
                (error: unknown) => error as Response
            );

            expect(response?.status).toBe(301);
            expect(response?.headers.get('Location')).toBe('/p/current%20caf%C3%A9/test-product-123?color=blue');
            expect(mockFetchProductById).toHaveBeenCalledOnce();
            expect(mockAttemptRouteSeoFallback).not.toHaveBeenCalled();
        });

        test('returns the resolved product with its primaryCategory expansion', async () => {
            const productWithCategory = {
                ...mockProduct,
                primaryCategory: {
                    id: 'test-category-123',
                    name: 'Test Category',
                    parentCategoryTree: [
                        { id: 'root-cat', name: 'Root' },
                        { id: 'test-category-123', name: 'Test Category' },
                    ],
                },
            };
            mockFetchProductById.mockResolvedValueOnce(productWithCategory);

            const request = new Request('https://example.com/p/test-product-123');
            const context = mockContext;

            const result = await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', '*': 'test-product-123' },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            expect(result.product).toEqual(productWithCategory);
            // The breadcrumb source is carried on the product — no separate category fetch.
            expect(mockFetchProductById).toHaveBeenCalledTimes(1);
        });

        test('resolves the product ID from the configured alias splat', async () => {
            activeAppConfig = {
                ...mockAppConfig,
                url: {
                    seoRoutes: {
                        'test-site': {
                            product: { prefix: 'p' },
                            category: { prefix: 'c', mode: 'id-suffix' },
                        },
                    },
                },
            };
            mockFetchProductById.mockResolvedValueOnce(mockProduct);
            const request = new Request('https://example.com/p/test-product-123');

            await loader({
                request,
                params: {
                    siteId: 'test-site',
                    localeId: 'en-US',
                    '*': 'test-product-123',
                } as Route.LoaderArgs['params'],
                context: mockContext,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            expect(mockFetchProductById).toHaveBeenCalledWith(mockContext, 'test-product-123', expect.any(Object));
        });

        test('does not fetch a product when the alias is invalid for the active site', async () => {
            activeAppConfig = {
                ...mockAppConfig,
                url: {
                    seoRoutes: {
                        'test-site': {
                            product: { prefix: 'p' },
                            category: { prefix: 'c', mode: 'id-suffix' },
                        },
                    },
                },
            };
            const redirect = new Response(null, { status: 302, headers: { Location: '/p/current-product' } });
            mockAttemptRouteSeoFallback.mockResolvedValueOnce(redirect);
            const request = new Request('https://example.com/product/test-product-123');

            const result = await loader({
                request,
                params: {
                    siteId: 'test-site',
                    localeId: 'en-US',
                    '*': 'test-product-123',
                } as Route.LoaderArgs['params'],
                context: mockContext,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            expect(result).toBe(redirect);
            expect(mockFetchProductById).not.toHaveBeenCalled();
        });

        // @sfdc-extension-block-start SFDC_EXT_SHIPPING_DELIVERY
        test('does not include the shopper delivery destination in cacheable PDP loader data', async () => {
            mockFetchProductById.mockResolvedValueOnce(mockProduct);

            const request = new Request('https://example.com/p/test-product-123');
            const result = await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', '*': 'test-product-123' },
                context: mockContext,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            expect(result).not.toHaveProperty('initialDestinationPromise');
            expect(result).toHaveProperty('alsoBuyRecommendations');
            expect(mockGetInitialDeliveryDestination).not.toHaveBeenCalled();
        });
        // @sfdc-extension-block-end SFDC_EXT_SHIPPING_DELIVERY

        test('does not fetch the master product for a variant (breadcrumbs come from the expansion)', async () => {
            const variantProduct = {
                ...mockProduct,
                id: 'variant-product-123',
                primaryCategoryId: null,
                master: { masterId: 'master-product-123' },
                primaryCategory: {
                    id: 'variant-cat',
                    name: 'Variant Cat',
                    parentCategoryTree: [{ id: 'variant-cat', name: 'Variant Cat' }],
                },
            };
            mockFetchProductById.mockResolvedValueOnce(variantProduct);

            const request = new Request('https://example.com/p/variant-product-123');
            const result = await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', '*': 'variant-product-123' },
                context: mockContext,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            expect(result.product).toEqual(variantProduct);
            expect(mockFetchProductById).toHaveBeenCalledTimes(1);
        });

        test('throws Response with original status when product fetch fails with NormalizedApiError', async () => {
            const { NormalizedApiError } = await import('@/lib/api/normalized-api-error');
            const { ApiError } = await import('@/scapi');

            const apiError = new ApiError({
                status: 404,
                statusText: 'Not Found',
                headers: new Headers(),
                body: { type: 'Not Found', title: 'Not Found', detail: 'Product not found' },
                rawBody: JSON.stringify({ detail: 'Product not found' }),
                url: 'https://api.example.com/products/nonexistent',
                method: 'GET',
            });
            mockFetchProductById.mockRejectedValueOnce(new NormalizedApiError(apiError));

            const request = new Request('https://example.com/p/nonexistent');
            const params = { '*': 'nonexistent' };
            const context = mockContext;

            const error = await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            }).then(
                () => {
                    throw new Error('expected loader to throw a Response');
                },
                (e: unknown) => e
            );

            expect(error).toBeInstanceOf(Response);
            const response = error as Response;
            expect(response.status).toBe(404);
            expect(await response.text()).toBe('Product not found');
            expect(mockAttemptRouteSeoFallback).toHaveBeenCalledOnce();
            expect(mockAttemptRouteSeoFallback).toHaveBeenCalledWith(context, request);
        });

        test('throws Response 500 when product fetch fails with non-API error', async () => {
            const { NormalizedApiError } = await import('@/lib/api/normalized-api-error');
            mockFetchProductById.mockRejectedValueOnce(new NormalizedApiError(new TypeError('Network failure')));

            const request = new Request('https://example.com/p/sku-network');
            const params = { '*': 'sku-network' };
            const context = mockContext;

            const error = await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            }).then(
                () => {
                    throw new Error('expected loader to throw a Response');
                },
                (e: unknown) => e
            );

            expect(error).toBeInstanceOf(Response);
            expect((error as Response).status).toBe(500);
        });

        test('throws Response 404 when fetchProductById returns null', async () => {
            mockFetchProductById.mockResolvedValueOnce(null);

            const request = new Request('https://example.com/p/empty-result');
            const params = { '*': 'empty-result' };
            const context = mockContext;

            const error = await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            }).then(
                () => {
                    throw new Error('expected loader to throw a Response');
                },
                (e: unknown) => e
            );

            expect(error).toBeInstanceOf(Response);
            expect((error as Response).status).toBe(404);
        });

        test('handles product with variant ID in search params', async () => {
            mockFetchProductById.mockResolvedValueOnce(mockProduct);

            const request = new Request('https://example.com/p/test-product-123?pid=variant-123');
            const params = { '*': 'test-product-123' };
            const context = mockContext;

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            // Should use the pid parameter instead of productId
            expect(mockFetchProductById.mock.calls[0][1]).toBe('variant-123');
        });
    });

    // @sfdc-extension-block-start SFDC_EXT_BOPIS
    describe('loader function with BOPIS extension', () => {
        test('includes inventoryIds when store is selected in context', async () => {
            mockFetchProductById.mockResolvedValueOnce(mockProduct);

            mockSelectedStoreInfo = {
                id: 'store-123',
                inventoryId: 'inventory-123',
                name: 'Test Store',
            };

            const request = new Request('https://example.com/p/test-product-123');
            const params = { '*': 'test-product-123' };
            const context = mockContext;

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            // Verify fetchProductById was called with inventoryIds parameter
            expect(mockFetchProductById).toHaveBeenCalledWith(
                context,
                'test-product-123',
                expect.objectContaining({ inventoryIds: ['inventory-123'] })
            );

            mockSelectedStoreInfo = null;
        });

        test('does not include inventoryIds when store is not selected', async () => {
            mockFetchProductById.mockResolvedValueOnce(mockProduct);
            mockSelectedStoreInfo = null;

            const request = new Request('https://example.com/p/test-product-123');
            const params = { '*': 'test-product-123' };
            const context = mockContext;

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            // Verify fetchProductById was called without inventoryIds parameter
            expect(mockFetchProductById.mock.calls[0][2]).not.toHaveProperty('inventoryIds');
        });

        test('handles store info without inventoryId', async () => {
            mockFetchProductById.mockResolvedValueOnce(mockProduct);

            mockSelectedStoreInfo = {
                id: 'store-123',
                name: 'Test Store',
                // No inventoryId
            };

            const request = new Request('https://example.com/p/test-product-123');
            const params = { '*': 'test-product-123' };
            const context = mockContext;

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            // Verify fetchProductById was called without inventoryIds parameter
            expect(mockFetchProductById.mock.calls[0][2]).not.toHaveProperty('inventoryIds');

            mockSelectedStoreInfo = null;
        });
    });
    // @sfdc-extension-block-end SFDC_EXT_BOPIS

    describe('getPageData helper function', () => {
        test('uses pid parameter when present in URL', async () => {
            mockFetchProductById.mockResolvedValueOnce(mockProduct);

            const request = new Request('https://example.com/p/test-product-123?pid=variant-456');
            const params = { '*': 'test-product-123' };
            const context = mockContext;

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            // Should use the pid parameter instead of productId
            expect(mockFetchProductById.mock.calls[0][1]).toBe('variant-456');
        });

        test('uses productId when pid parameter is not present', async () => {
            mockFetchProductById.mockResolvedValueOnce(mockProduct);

            const request = new Request('https://example.com/p/test-product-123');
            const params = { '*': 'test-product-123' };
            const context = mockContext;

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            // Should use the productId from params
            expect(mockFetchProductById.mock.calls[0][1]).toBe('test-product-123');
        });

        test('includes all required expand parameters', async () => {
            mockFetchProductById.mockResolvedValueOnce(mockProduct);

            const request = new Request('https://example.com/p/test-product-123');
            const params = { '*': 'test-product-123' };
            const context = mockContext;

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            const callOptions = mockFetchProductById.mock.calls[0][2];
            expect(callOptions.expand).toContain('availability');
            expect(callOptions.expand).toContain('bundled_products');
            expect(callOptions.expand).toContain('images');
            expect(callOptions.expand).toContain('options');
            expect(callOptions.expand).toContain('page_meta_tags');
            expect(callOptions.expand).toContain('prices');
            expect(callOptions.expand).toContain('promotions');
            expect(callOptions.expand).toContain('set_products');
            expect(callOptions.expand).toContain('variations');
            expect(callOptions.allImages).toBe(true);
            expect(callOptions.perPricebook).toBe(true);
        });

        test('passes primaryCategoryId to fetchPageWithComponentData as the category fallback', async () => {
            mockFetchProductById.mockResolvedValueOnce(mockProduct);

            const request = new Request('https://example.com/p/test-product-123');
            const params = { '*': 'test-product-123' };

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context: mockContext,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            expect(mockFetchPageWithComponentData).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    aspectType: 'pdp',
                    productId: 'test-product-123',
                    categoryId: 'test-category-123',
                })
            );
        });

        test('prefers primaryCategory.id over primaryCategoryId for the Page Designer categoryId', async () => {
            const productWithBoth = {
                ...mockProduct,
                primaryCategoryId: 'legacy-cat-id',
                primaryCategory: { id: 'expansion-cat-id', name: 'Expansion Cat' },
            };
            mockFetchProductById.mockResolvedValueOnce(productWithBoth);

            const request = new Request('https://example.com/p/test-product-123');
            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', '*': 'test-product-123' },
                context: mockContext,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            expect(mockFetchPageWithComponentData).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    aspectType: 'pdp',
                    productId: 'test-product-123',
                    categoryId: 'expansion-cat-id',
                })
            );
        });

        test('omits categoryId from fetchPageWithComponentData when product has no primaryCategoryId', async () => {
            const productWithoutCategory = {
                ...mockProduct,
                primaryCategoryId: null,
            };
            mockFetchProductById.mockResolvedValueOnce(productWithoutCategory);

            const request = new Request('https://example.com/p/test-product-123');
            const params = { '*': 'test-product-123' };

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context: mockContext,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            expect(mockFetchPageWithComponentData).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ aspectType: 'pdp', productId: 'test-product-123' })
            );
            expect(mockFetchPageWithComponentData).not.toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ categoryId: expect.anything() })
            );
        });

        test('uses variant pid as productId for fetchPageWithComponentData', async () => {
            const variantProduct = { ...mockProduct, id: 'variant-pid-123', primaryCategoryId: 'variant-cat-123' };
            mockFetchProductById.mockResolvedValueOnce(variantProduct);

            const request = new Request('https://example.com/p/test-product-123?pid=variant-pid-123');
            const params = { '*': 'test-product-123' };

            await loader({
                request,
                params: { siteId: 'test-site', localeId: 'en-US', ...params },
                context: mockContext,
                url: new URL(request.url),
                pattern: '/p/*',
            });

            expect(mockFetchPageWithComponentData).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    aspectType: 'pdp',
                    productId: 'variant-pid-123',
                    categoryId: 'variant-cat-123',
                })
            );
        });
    });
});
