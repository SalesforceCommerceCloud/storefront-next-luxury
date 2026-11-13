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

/**
 * Fetch luxury boutique stores from SCAPI by explicit store IDs, for image enrichment.
 *
 * Used as the B2C enrichment step in the boutiques loader: territories come from Core
 * (ServiceTerritory) and their `externalId` values (B2C store IDs) are passed here to
 * retrieve facade image paths (`c_facadeImage`) stored in the SCAPI store record.
 *
 * @param context - Router context
 * @param ids - B2C store IDs to fetch (typically the `externalId` values of Core territories)
 * @returns Array of SCAPI store records (empty when the API returns no data)
 * @throws {NormalizedApiError} When the API request fails
 */
export async function fetchBoutiquesForEnrichment(
    context: Readonly<RouterContextProvider>,
    ids: string[]
): Promise<ShopperStores.schemas['Store'][]> {
    if (ids.length === 0) return [];
    const logger = getLogger(context);
    const clients = createApiClients(context);

    try {
        const { data: storesData } = await clients.shopperStores.getStores({
            params: {
                query: {
                    ids: ids.join(','),
                },
            },
        });

        const storesMap = new Map<string, ShopperStores.schemas['Store']>();
        storesData?.data?.forEach((store) => {
            if (store.id) {
                storesMap.set(store.id, store);
            }
        });

        return ids
            .map((id) => storesMap.get(id))
            .filter((store): store is ShopperStores.schemas['Store'] => Boolean(store));
    } catch (error) {
        logger.error('shopperStores.getStores failed for boutique enrichment', { ids });
        throw new NormalizedApiError(error);
    }
}
