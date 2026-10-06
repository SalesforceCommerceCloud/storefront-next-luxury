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

interface UseBoutiqueListResult {
    stores: ShopperStores.schemas['Store'][];
    availability?: Record<string, BoutiqueAvailability>;
    isLoading: boolean;
    hasError: boolean;
}

/**
 * Loads every luxury boutique for the cart "Collect at Boutique" picker, so the branded list is seeded on open
 * (no postal/radius search — wrong model for a handful of flagship boutiques). When a `pickupContext` is present,
 * the request carries the line item so the loader returns per-boutique pickup availability for it.
 *
 * @param pickupContext - The cart line item being collected (from the store-locator provider), or null
 * @returns The boutiques, optional per-boutique availability, and fetch state
 */
export function useBoutiqueList(pickupContext?: PickupContext | null): UseBoutiqueListResult {
    const fetcher = useFetcher<FetchBoutiquesResult>();
    const productId = pickupContext?.productId;
    const quantity = pickupContext?.quantity ?? 1;

    useEffect(() => {
        // `fetcher.load` is absent during SSR and in snapshot/story environments that stub `useFetcher`.
        if (typeof fetcher.load !== 'function') return;
        const query = productId ? `?productId=${encodeURIComponent(productId)}&quantity=${quantity}` : '';
        void fetcher.load(`/resource/boutiques${query}`);
        // Reload only when the collected item changes; the sheet remounts per open, so this runs on open.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, quantity]);

    return {
        stores: fetcher.data?.success ? (fetcher.data.stores ?? []) : [],
        availability: fetcher.data?.availability,
        isLoading: fetcher.state === 'loading',
        hasError: fetcher.data?.success === false,
    };
}
