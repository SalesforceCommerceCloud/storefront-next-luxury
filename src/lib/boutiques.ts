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
import type { ServiceTerritoryOption } from '@/lib/appointment-scheduler';

/**
 * Resolved facade image URL for a boutique, taken directly from the `image` field on the
 * `ServiceTerritoryOption`. This field is populated by the B2C enrichment step in the boutiques
 * loader (`_app.boutiques.tsx`) and then stored on the territory object for downstream use.
 *
 * @param territory - The boutique territory.
 * @returns The resolved image URL, or `undefined` when it is unset.
 */
export function boutiqueImagePath(territory: ServiceTerritoryOption): string | undefined {
    return territory.image;
}

/**
 * Filter boutiques by country code and postal/city query.
 *
 * @param stores - Boutiques to filter
 * @param countryCode - ISO country code (empty = all)
 * @param postalQuery - Postal code or city query (empty = all)
 * @returns Filtered boutiques
 */
export function filterBoutiques(
    stores: ServiceTerritoryOption[],
    countryCode: string,
    postalQuery: string
): ServiceTerritoryOption[] {
    const postal = postalQuery.trim().toLowerCase().replaceAll(/\s+/g, '');
    return stores.filter((store) => {
        if (countryCode && store.countryCode !== countryCode) return false;
        if (!postal) return true;
        const haystack = `${store.postalCode ?? ''}${store.city ?? ''}`.toLowerCase().replaceAll(/\s+/g, '');
        return haystack.includes(postal);
    });
}

/**
 * Extract unique country codes from boutiques.
 *
 * @param stores - Boutiques to extract country codes from
 * @returns Array of unique country codes
 */
export function boutiqueCountryCodes(stores: ServiceTerritoryOption[]): string[] {
    return [...new Set(stores.flatMap((store) => (store.countryCode ? [store.countryCode] : [])))];
}

/**
 * Get available appointment slots for a boutique and date.
 *
 * Returns deterministic weekday-based slots. Sunday has none. Tokyo has a different
 * schedule than other boutiques. There is no SCAPI appointment API; this app-side logic
 * provides fixed demo slots for the booking UI.
 *
 * @param storeId - Store ID (optional)
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Array of time slots (e.g. ['10:00', '14:00'])
 */
export function getAppointmentSlots(storeId: string | undefined, date: string): string[] {
    if (!date) return [];
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) return [];
    const weekday = new Date(year, month - 1, day).getDay();
    if (Number.isNaN(weekday) || weekday === 0) return [];
    if (storeId === 'ln-boutique-tokyo') {
        return weekday === 6 ? ['11:00', '14:00'] : ['11:00', '13:00', '16:00', '18:00'];
    }
    return weekday === 6 ? ['10:00', '14:00'] : ['10:00', '11:00', '14:00', '16:00'];
}
