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
import type { ShopperStores } from '@/scapi';

/**
 * The five luxury boutique store IDs configured in sites/Luxury/stores.xml.
 */
export const BOUTIQUE_IDS = [
    'ln-boutique-geneva',
    'ln-boutique-london',
    'ln-boutique-newyork',
    'ln-boutique-paris',
    'ln-boutique-tokyo',
] as const;

/**
 * Catalog-relative facade path for a boutique, read solely from the dataset-provisioned `facadeImage`
 * store custom attribute (SCAPI surfaces custom attributes as `c_*`). This is the single source of
 * truth for the boutique image path — it lives only in the store record, never derived in storefront
 * code, so there is no path convention duplicated between the dataset and the app. Resolved to a DIS
 * URL by `resolveStoreImageUrl`.
 *
 * The path is carried on a custom attribute rather than the built-in store `image` field because
 * SCAPI's `getStores` does not surface the standard `image` field on this instance.
 *
 * @param store - The boutique store.
 * @returns The catalog-relative facade path from `c_facadeImage`, or `undefined` when it is unset.
 */
export function boutiqueImagePath(store: ShopperStores.schemas['Store']): string | undefined {
    const facade = (store as { c_facadeImage?: unknown }).c_facadeImage;
    return typeof facade === 'string' && facade.length > 0 ? facade : undefined;
}

/**
 * Filter stores by country code and postal/city query.
 *
 * @param stores - Stores to filter
 * @param countryCode - ISO country code (empty = all)
 * @param postalQuery - Postal code or city query (empty = all)
 * @returns Filtered stores
 */
export function filterBoutiques(
    stores: ShopperStores.schemas['Store'][],
    countryCode: string,
    postalQuery: string
): ShopperStores.schemas['Store'][] {
    const postal = postalQuery.trim().toLowerCase().replaceAll(/\s+/g, '');
    return stores.filter((store) => {
        if (countryCode && store.countryCode !== countryCode) return false;
        if (!postal) return true;
        const haystack = `${store.postalCode ?? ''}${store.city ?? ''}`.toLowerCase().replaceAll(/\s+/g, '');
        return haystack.includes(postal);
    });
}

/**
 * Extract unique country codes from stores.
 *
 * @param stores - Stores to extract country codes from
 * @returns Array of unique country codes
 */
export function boutiqueCountryCodes(stores: ShopperStores.schemas['Store'][]): string[] {
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
