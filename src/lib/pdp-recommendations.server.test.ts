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
import { describe, expect, test, vi, beforeEach } from 'vitest';
import type { ShopperProducts, ShopperSearch } from '@/scapi';
import { createTestContext } from '@/lib/test-utils';
import { fetchCarouselProducts } from '@/components/product-carousel/loaders';
import { fetchCollectionCandidatePool, deriveYouMightAlsoLike } from './pdp-recommendations.server';

vi.mock('@/components/product-carousel/loaders', () => ({
    fetchCarouselProducts: vi.fn(),
}));

const mockFetchCarouselProducts = vi.mocked(fetchCarouselProducts);

function buildProduct(overrides: Record<string, unknown> = {}): ShopperProducts.schemas['Product'] {
    return {
        id: 'ln-heritage-001',
        primaryCategory: { id: 'heritage' },
        ...overrides,
    } as ShopperProducts.schemas['Product'];
}

function buildHit(productId: string): ShopperSearch.schemas['ProductSearchHit'] {
    return { productId } as ShopperSearch.schemas['ProductSearchHit'];
}

describe('deriveYouMightAlsoLike', () => {
    test('excludes the current product by its own sku, master, and variants', () => {
        const product = buildProduct({
            id: 'ln-heritage-001-variant',
            master: { masterId: 'ln-heritage-001' },
        });
        const hits = [
            buildHit('ln-heritage-001'), // current master → excluded
            buildHit('ln-heritage-002'),
            buildHit('ln-heritage-005'),
        ];
        const { recs } = deriveYouMightAlsoLike(hits, product);
        expect(recs?.map((r) => r.productId)).toEqual(['ln-heritage-002', 'ln-heritage-005']);
    });

    test('respects the limit', () => {
        const product = buildProduct();
        const hits = Array.from({ length: 20 }, (_, i) => buildHit(`ln-other-${i}`));
        const { recs } = deriveYouMightAlsoLike(hits, product, 12);
        expect(recs).toHaveLength(12);
    });

    test('returns an empty recommendation when nothing remains after self-exclusion', () => {
        const product = buildProduct({ id: 'ln-heritage-001' });
        const result = deriveYouMightAlsoLike([buildHit('ln-heritage-001')], product);
        expect(result).toEqual({});
    });
});

describe('fetchCollectionCandidatePool', () => {
    beforeEach(() => {
        mockFetchCarouselProducts.mockReset();
    });

    test('returns an empty pool when the watch has no category', async () => {
        const context = createTestContext();
        const pool = await fetchCollectionCandidatePool(
            context,
            buildProduct({ primaryCategory: undefined, primaryCategoryId: undefined })
        );
        expect(pool).toEqual([]);
        expect(mockFetchCarouselProducts).not.toHaveBeenCalled();
    });

    test('fetches the collection pool by category id and returns its hits', async () => {
        mockFetchCarouselProducts.mockResolvedValue({
            hits: [buildHit('ln-heritage-002')],
        } as Awaited<ReturnType<typeof fetchCarouselProducts>>);
        const context = createTestContext();
        const pool = await fetchCollectionCandidatePool(context, buildProduct());
        expect(mockFetchCarouselProducts).toHaveBeenCalledWith(
            context,
            expect.objectContaining({ categoryId: 'heritage' })
        );
        expect(pool.map((h) => h.productId)).toEqual(['ln-heritage-002']);
    });

    test('degrades to an empty pool when the search fails', async () => {
        mockFetchCarouselProducts.mockRejectedValue(new Error('SCAPI down'));
        const context = createTestContext();
        const pool = await fetchCollectionCandidatePool(context, buildProduct());
        expect(pool).toEqual([]);
    });
});
