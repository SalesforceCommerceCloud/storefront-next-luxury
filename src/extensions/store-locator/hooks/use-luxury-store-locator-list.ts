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
import { useEffect, useMemo, useState } from 'react';
import { useFetcher } from 'react-router';
import type { ShopperStores } from '@/scapi';
import { useStoreLocatorList as useCanonicalStoreLocatorList } from '@/extensions/store-locator/hooks/use-store-locator-list';
import type { FetchBoutiquesResult } from '../routes/resource.boutiques';

/**
 * Luxury overlay of the store-locator list hook. The canonical list stays
 * empty until a search; salons must be visible on first paint, so this
 * fetches all boutiques from SCAPI on mount and still honours a country
 * filter when the shopper uses the find-a-store form.
 */
export function useStoreLocatorList() {
    const result = useCanonicalStoreLocatorList();
    const fetcher = useFetcher<FetchBoutiquesResult>();
    const [allSalons, setAllSalons] = useState<ShopperStores.schemas['Store'][]>([]);

    useEffect(() => {
        // Guard `fetcher.load`: it is absent during SSR and in snapshot/story
        // environments that stub `useFetcher` without a loader.
        if (fetcher.state === 'idle' && !fetcher.data && allSalons.length === 0 && typeof fetcher.load === 'function') {
            void fetcher.load('/resource/boutiques');
        }
    }, [fetcher, allSalons.length]);

    useEffect(() => {
        if (fetcher.data?.success && Array.isArray(fetcher.data.stores)) {
            setAllSalons(fetcher.data.stores);
        }
    }, [fetcher.data]);

    const stores = useMemo(() => {
        const countryCode = result.searchParams?.countryCode;
        if (result.hasSearched && result.mode === 'input' && countryCode) {
            const match = allSalons.filter((salon) => salon.countryCode === countryCode);
            return match.length > 0 ? match : allSalons;
        }
        return allSalons;
    }, [allSalons, result.hasSearched, result.mode, result.searchParams?.countryCode]);

    return {
        ...result,
        hasSearched: true,
        hasError: fetcher.data?.success === false,
        isLoading: fetcher.state === 'loading',
        geoError: false,
        stores,
        storesPaginated: stores,
    } as const;
}

export type { SearchStoresResult } from '@/extensions/store-locator/hooks/use-store-locator-list';
