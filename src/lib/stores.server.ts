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
import type { RouterContextProvider } from 'react-router';
import type { ShopperStores } from '@/scapi';
import { createApiClients } from '@/lib/api-clients.server';
import { getLogger } from '@/lib/logger.server';
import { NormalizedApiError } from '@/lib/api/normalized-api-error';
import { BOUTIQUE_IDS } from './boutiques';

/**
 * Fetch all luxury boutique stores from SCAPI.
 *
 * Calls the canonical `shopperStores.getStores` SCAPI endpoint directly with the
 * fixed list of boutique store IDs, so the luxury boutique locator does not depend
 * on any optional extension (e.g. BOPIS) that may be stripped from a build.
 * Returns an array (not a Map), ordered by `BOUTIQUE_IDS`, for easier consumption
 * by UI components expecting `Store[]`.
 *
 * @param context - Router context
 * @returns Array of boutique stores (empty when the API returns no data)
 * @throws {NormalizedApiError} When the API request fails
 */
export async function fetchBoutiques(
    context: Readonly<RouterContextProvider>
): Promise<ShopperStores.schemas['Store'][]> {
    const logger = getLogger(context);
    const clients = createApiClients(context);

    try {
        const { data: storesData } = await clients.shopperStores.getStores({
            params: {
                query: {
                    ids: [...BOUTIQUE_IDS].join(','),
                },
            },
        });

        const storesMap = new Map<string, ShopperStores.schemas['Store']>();
        storesData?.data?.forEach((store) => {
            if (store.id) {
                storesMap.set(store.id, store);
            }
        });

        return BOUTIQUE_IDS.map((id) => storesMap.get(id)).filter((store): store is ShopperStores.schemas['Store'] =>
            Boolean(store)
        );
    } catch (error) {
        logger.error('shopperStores.getStores failed for boutiques', { boutiqueIds: [...BOUTIQUE_IDS] });
        throw new NormalizedApiError(error);
    }
}
