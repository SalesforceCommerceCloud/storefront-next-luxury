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
/** @sfdc-extension-file SFDC_EXT_STORE_LOCATOR */
import { data, type LoaderFunctionArgs } from 'react-router';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import type { ShopperStores } from '@/scapi';
import { fetchBoutiques } from '../lib/stores.server';
import { fetchCategories } from '@/lib/api/categories.server';
import { createApiClients } from '@/lib/api-clients.server';
import { getLogger } from '@/lib/logger.server';
// Per-boutique pickup availability is a BOPIS concern — `isStoreOutOfStock` is a BOPIS-gated export. Gate the
// import so stripping BOPIS (store-locator kept) leaves this route building a plain boutique list.
// @sfdc-extension-block-start SFDC_EXT_BOPIS
import { isStoreOutOfStock } from '@/lib/product/inventory-utils';
// @sfdc-extension-block-end SFDC_EXT_BOPIS
import { extractResponseError } from '@/lib/utils';
import { resolveStoreImageUrl } from '../lib/store-image';
import { boutiqueImagePath } from '../lib/boutiques';

/** Per-boutique pickup availability for the item a shopper is collecting. */
export interface BoutiqueAvailability {
    inStock: boolean;
    ats?: number;
}

/**
 * Result of the boutiques loader.
 *
 * `availability` is keyed by store id and is only populated when the request carries a `productId` — it tells
 * the picker which boutiques stock the item being collected so it can sort/badge/disable accordingly.
 */
export interface FetchBoutiquesResult {
    success: boolean;
    stores?: ShopperStores.schemas['Store'][];
    availability?: Record<string, BoutiqueAvailability>;
    error?: string;
}

/**
 * Server-side loader to fetch luxury boutiques, optionally augmented with per-boutique pickup availability.
 *
 * Returns all luxury boutique stores from SCAPI (client-side country/postal filtering happens in the UI). When
 * `?productId=` is present, it also resolves the product against every boutique's inventory list and returns an
 * `availability` map so the cart "Collect at Boutique" picker can show which boutiques stock that line item.
 *
 * Availability is best-effort: a product-lookup failure returns the boutiques with no availability map rather
 * than blocking the picker (the place-order backstop still enforces real stock at checkout).
 *
 * @param args - Loader function arguments (request carries optional `productId` + `quantity`; context for SCAPI)
 * @returns JSON response with boutique data (+ optional availability) or error
 */
export async function loader({
    request,
    context,
}: LoaderFunctionArgs): Promise<ReturnType<typeof data<FetchBoutiquesResult>>> {
    const logger = getLogger(context);
    logger.debug('Boutiques: loader starting');
    try {
        const url = new URL(request.url);
        const productId = url.searchParams.get('productId') ?? undefined;
        const quantity = Math.max(1, Number(url.searchParams.get('quantity')) || 1);

        // Boutiques + a category (solely as a DIS version-prefix template for the facade images). SCAPI returns
        // the store image as a catalog-relative path; resolve it to a DIS URL the same way the boutiques page
        // does, otherwise the picker renders a broken `demandware.static` image. Category fetch failure is
        // swallowed — the tiles just degrade to text.
        const [rawStores, categories] = await Promise.all([
            fetchBoutiques(context),
            fetchCategories(context, 'root', 1).catch(() => []),
        ]);
        const config = getConfig(context);
        const templateUrl = categories
            .map((category) => category.image)
            .find((imageUrl): imageUrl is string => typeof imageUrl === 'string' && imageUrl.length > 0);
        const stores = rawStores.map((store) => {
            const resolved = resolveStoreImageUrl(boutiqueImagePath(store), templateUrl, config);
            return resolved ? { ...store, image: resolved } : store;
        });

        let availability: Record<string, BoutiqueAvailability> | undefined;
        // @sfdc-extension-block-start SFDC_EXT_BOPIS
        if (productId) {
            availability = await computeBoutiqueAvailability(context, stores, productId, quantity, logger);
        }
        // @sfdc-extension-block-end SFDC_EXT_BOPIS

        return data({
            success: true,
            stores,
            ...(availability ? { availability } : {}),
        });
    } catch (error) {
        logger.error('Boutiques: fetch failed', { error });
        const { responseMessage, status_code } = await extractResponseError(error as Error);
        return data(
            {
                success: false,
                error: responseMessage,
            },
            { status: Number(status_code) }
        );
    }
}

/**
 * Resolve `productId` against each boutique's inventory list and map store id → pickup availability. Mirrors the
 * canonical BOPIS store-stock check (`getProducts` with `expand: ['availability']` + the stores' inventory ids,
 * then `isStoreOutOfStock`). Returns `undefined` on lookup failure so the caller can fail open.
 *
 * BOPIS-gated: it computes pickup availability and depends on the BOPIS-only `isStoreOutOfStock`.
 */
// @sfdc-extension-block-start SFDC_EXT_BOPIS
async function computeBoutiqueAvailability(
    context: LoaderFunctionArgs['context'],
    stores: ShopperStores.schemas['Store'][],
    productId: string,
    quantity: number,
    logger: ReturnType<typeof getLogger>
): Promise<Record<string, BoutiqueAvailability> | undefined> {
    const inventoryIds = [
        ...new Set(stores.map((store) => store.inventoryId).filter((id): id is string => Boolean(id))),
    ];
    if (inventoryIds.length === 0) {
        return undefined;
    }

    try {
        const clients = createApiClients(context);
        const { data: productsData } = await clients.shopperProducts.getProducts({
            params: {
                query: {
                    ids: [productId],
                    expand: ['availability'],
                    inventoryIds,
                },
            },
        });
        const product = productsData?.data?.[0];
        if (!product) {
            return undefined;
        }

        const availability: Record<string, BoutiqueAvailability> = {};
        for (const store of stores) {
            if (!store.id) continue;
            const storeInventory = product.inventories?.find((inv) => inv.id === store.inventoryId);
            availability[store.id] = {
                inStock: Boolean(store.inventoryId) && !isStoreOutOfStock(product, store.inventoryId, quantity),
                ats: storeInventory?.ats,
            };
        }
        return availability;
    } catch (error) {
        logger.warn('Boutiques: availability lookup failed, returning boutiques without availability', {
            productId,
            error,
        });
        return undefined;
    }
}
// @sfdc-extension-block-end SFDC_EXT_BOPIS
