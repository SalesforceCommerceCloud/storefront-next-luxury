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
import { useEffect } from 'react';
import { useFetcher } from 'react-router';
import type { ShopperStores } from '@/scapi';
import type { PickupContext } from '@/extensions/store-locator/stores/store-locator-store';
import type { BoutiqueAvailability, FetchBoutiquesResult } from '../../../routes/resource.boutiques';
import type { AppointmentTerritoriesResult } from '@/extensions/appointment-scheduling/routes/resource.appointment-territories';
import type { ServiceTerritoryOption } from '@/lib/appointment-scheduler';

interface UseBoutiqueListResult {
    stores: ServiceTerritoryOption[];
    availability?: Record<string, BoutiqueAvailability>;
    isLoading: boolean;
    hasError: boolean;
}

/** Maps an SFCC store to the ServiceTerritoryOption shape used by BoutiqueDirectory. */
function storeToTerritory(s: ShopperStores.schemas['Store']): ServiceTerritoryOption {
    return {
        id: s.id ?? '',
        sfId: s.id ?? '',
        name: s.name ?? '',
        timezone: 'UTC',
        externalId: s.id,
        address1: s.address1,
        city: s.city,
        countryCode: s.countryCode,
        postalCode: s.postalCode,
        phone: s.phone,
        latitude: typeof s.latitude === 'number' ? s.latitude : undefined,
        longitude: typeof s.longitude === 'number' ? s.longitude : undefined,
    };
}

/**
 * Loads the luxury boutique list for the "Collect at Boutique" picker.
 *
 * Primary source: Core org service territories via `resource.appointment-territories`.
 * Fallback: SFCC dataset stores from `resource.boutiques` (mapped to ServiceTerritoryOption).
 *
 * Per-boutique pickup availability (stock check) always comes from `resource.boutiques`
 * since inventory lives in B2C — keyed by the store's `externalId` (B2C store ID).
 *
 * @param pickupContext - Cart line item being collected, or null
 */
export function useBoutiqueList(pickupContext?: PickupContext | null): UseBoutiqueListResult {
    // Primary: Core territories (boutique list from Salesforce Scheduler)
    const territoriesFetcher = useFetcher<AppointmentTerritoriesResult>();
    // Availability + fallback list: SFCC boutiques route
    const boutiqueFetcher = useFetcher<FetchBoutiquesResult>();

    const productId = pickupContext?.productId;
    const quantity = pickupContext?.quantity ?? 1;

    useEffect(() => {
        if (typeof territoriesFetcher.load !== 'function') return;
        void territoriesFetcher.load('/resource/appointment-territories');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (typeof boutiqueFetcher.load !== 'function') return;
        const query = productId ? `?productId=${encodeURIComponent(productId)}&quantity=${quantity}` : '';
        void boutiqueFetcher.load(`/resource/boutiques${query}`);
        // Reload only when the collected item changes; the sheet remounts per open.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, quantity]);

    const territoriesLoaded = territoriesFetcher.data !== undefined;
    const stores: ServiceTerritoryOption[] =
        territoriesLoaded && territoriesFetcher.data?.success
            ? (territoriesFetcher.data.territories ?? [])
            : (boutiqueFetcher.data?.stores ?? []).map(storeToTerritory);

    return {
        stores,
        availability: boutiqueFetcher.data?.availability,
        isLoading: territoriesFetcher.state === 'loading' || boutiqueFetcher.state === 'loading',
        hasError: territoriesLoaded
            ? territoriesFetcher.data?.success === false && boutiqueFetcher.data?.success === false
            : boutiqueFetcher.data?.success === false,
    };
}
