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
import type { ServiceTerritoryOption } from '@/lib/appointment-scheduler';
import { boutiqueImagePath, filterBoutiques, getAppointmentSlots } from './boutiques';

const mockStores: ServiceTerritoryOption[] = [
    {
        id: 'ln-boutique-geneva',
        sfId: 'SF001',
        name: 'Geneva Boutique',
        timezone: 'Europe/Zurich',
        city: 'Geneva',
        countryCode: 'CH',
        postalCode: '1201',
    },
    {
        id: 'ln-boutique-london',
        sfId: 'SF002',
        name: 'London Boutique',
        timezone: 'Europe/London',
        city: 'London',
        countryCode: 'GB',
        postalCode: 'W1K 2RH',
    },
    {
        id: 'ln-boutique-newyork',
        sfId: 'SF003',
        name: 'New York Boutique',
        timezone: 'America/New_York',
        city: 'New York',
        countryCode: 'US',
        postalCode: '10065',
    },
    {
        id: 'ln-boutique-tokyo',
        sfId: 'SF004',
        name: 'Tokyo Boutique',
        timezone: 'Asia/Tokyo',
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
    test('returns the image field when set — populated by the B2C enrichment step', () => {
        expect(
            boutiqueImagePath({
                id: 'ln-boutique-geneva',
                sfId: 'SF001',
                name: 'Geneva Boutique',
                timezone: 'Europe/Zurich',
                image: 'https://example.com/images/salons/geneva.webp',
            })
        ).toBe('https://example.com/images/salons/geneva.webp');
    });

    test('returns undefined when image is absent', () => {
        expect(
            boutiqueImagePath({ id: 'ln-boutique-geneva', sfId: 'SF001', name: 'Geneva Boutique', timezone: 'UTC' })
        ).toBeUndefined();
    });
});
