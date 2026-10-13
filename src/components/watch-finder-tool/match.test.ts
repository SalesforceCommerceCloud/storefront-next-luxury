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
import { describe, expect, test } from 'vitest';
import type { ShopperSearch } from '@/scapi';
import { EMPTY_ANSWERS, matchesBudget, matchesWrist, rankFinderHits } from './match';

function hit(partial: Record<string, unknown>): ShopperSearch.schemas['ProductSearchHit'] {
    return {
        productId: String(partial.productId ?? 'id'),
        productName: String(partial.productName ?? 'Watch'),
        ...partial,
    } as ShopperSearch.schemas['ProductSearchHit'];
}

describe('watch finder matching', () => {
    test('budget bands exclude price-on-request except the haute tier', () => {
        expect(matchesBudget(2450, false, 'under5k')).toBe(true);
        expect(matchesBudget(2450, false, 'over20k')).toBe(false);
        expect(matchesBudget(undefined, true, 'under5k')).toBe(false);
        expect(matchesBudget(undefined, true, 'over20k')).toBe(true);
    });

    test('wrist bands map to case diameter', () => {
        expect(matchesWrist(37, 's')).toBe(true);
        expect(matchesWrist(42, 's')).toBe(false);
        expect(matchesWrist(40, 'm')).toBe(true);
        expect(matchesWrist(44, 'l')).toBe(true);
        expect(matchesWrist(38, 'unknown')).toBe(true);
    });

    test('ranks a shortlist and prefers the requested style', () => {
        const ranked = rankFinderHits(
            [
                hit({
                    productId: 'dive',
                    c_collection: 'dive',
                    c_caseDiameter: 43,
                    c_movement: 'automatic',
                    price: 6200,
                }),
                hit({
                    productId: 'dress',
                    c_collection: 'heritage',
                    c_caseDiameter: 38,
                    c_movement: 'manual',
                    price: 6800,
                }),
                hit({
                    productId: 'sport',
                    c_collection: 'sport',
                    c_caseDiameter: 42,
                    c_movement: 'automatic',
                    price: 9500,
                }),
            ],
            { ...EMPTY_ANSWERS, style: 'dressy', budget: 'from5kTo10k', wrist: 's', movement: 'any' }
        );

        expect(ranked).toHaveLength(3);
        expect(ranked[0]?.hit.productId).toBe('dress');
    });
});
