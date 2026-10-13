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
import type { ShopperStores } from '@/scapi';
import { boutiqueImagePath, filterBoutiques, getAppointmentSlots } from './boutiques';

const mockStores: ShopperStores.schemas['Store'][] = [
    {
        id: 'ln-boutique-geneva',
        name: 'Geneva Boutique',
        city: 'Geneva',
        countryCode: 'CH',
        postalCode: '1201',
    },
    {
        id: 'ln-boutique-london',
        name: 'London Boutique',
        city: 'London',
        countryCode: 'GB',
        postalCode: 'W1K 2RH',
    },
    {
        id: 'ln-boutique-newyork',
        name: 'New York Boutique',
        city: 'New York',
        countryCode: 'US',
        postalCode: '10065',
    },
    {
        id: 'ln-boutique-tokyo',
        name: 'Tokyo Boutique',
        city: 'Tokyo',
        countryCode: 'JP',
        postalCode: '104-0061',
    },
];

describe('boutiques', () => {
    test('filters by country and postal code', () => {
        expect(filterBoutiques(mockStores, 'US', '')).toHaveLength(1);
        expect(filterBoutiques(mockStores, 'US', '')[0]?.city).toBe('New York');
        expect(filterBoutiques(mockStores, '', '1201')[0]?.city).toBe('Geneva');
        expect(filterBoutiques(mockStores, 'GB', 'W1K')[0]?.city).toBe('London');
        expect(filterBoutiques(mockStores, 'JP', '1201')).toHaveLength(0);
    });

    test('returns weekday slots and none on Sunday', () => {
        expect(getAppointmentSlots('ln-boutique-geneva', '2030-06-14')).toContain('10:00');
        expect(getAppointmentSlots('ln-boutique-geneva', '2030-06-16')).toHaveLength(0);
        expect(getAppointmentSlots('ln-boutique-tokyo', '2030-06-17')).toContain('11:00');
    });
});

describe('boutiqueImagePath', () => {
    test('reads the c_facadeImage custom attribute (single dataset source)', () => {
        expect(
            boutiqueImagePath({
                id: 'ln-boutique-geneva',
                c_facadeImage: 'images/salons/geneva.webp',
            } as ShopperStores.schemas['Store'])
        ).toBe('images/salons/geneva.webp');
    });

    test('returns undefined when c_facadeImage is absent — no code-side derivation', () => {
        expect(boutiqueImagePath({ id: 'ln-boutique-geneva' })).toBeUndefined();
        expect(boutiqueImagePath({ id: 'ln-boutique-geneva', image: 'images/salons/standard.webp' })).toBeUndefined();
        expect(
            boutiqueImagePath({ id: 'ln-boutique-geneva', c_facadeImage: '' } as ShopperStores.schemas['Store'])
        ).toBeUndefined();
    });
});
