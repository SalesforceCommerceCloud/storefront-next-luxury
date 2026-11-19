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
import { getLogger } from '@/lib/logger.server';
import { createApiClients } from '@/lib/api-clients.server';

/**
 * Enriches a list of items (territories, work types, or any item with `externalId`) with
 * dataset-provisioned content (name/title, image) fetched from the SFCC B2C product catalog.
 *
 * Each item's `externalId` must match a catalog product ID in the hidden `appointment-services`
 * category of the `luxury-appointment-services` catalog. Uses `toDisBaseUrl` to construct proper
 * DIS image URLs — same pipeline as regular product images.
 *
 * Falls back to the original item when no matching product is found (non-fatal).
 */
export async function enrichFromCatalog<T extends { externalId?: string; title?: string; image?: string }>(
    context: Readonly<RouterContextProvider>,
    items: T[]
): Promise<T[]> {
    const ids = items.map((item) => item.externalId).filter((id): id is string => Boolean(id));
    if (ids.length === 0) return items;

    const logger = getLogger(context);
    const clients = createApiClients(context);

    try {
        const productResults = await Promise.all(
            ids.map((id) =>
                clients.shopperProducts
                    .getProduct({ params: { path: { id }, query: { allImages: true } } })
                    .then(
                        (res: {
                            data?: {
                                id?: string;
                                name?: string;
                                imageGroups?: { images?: { link?: string }[] }[];
                            } | null;
                        }) => res.data ?? null
                    )
                    .catch(() => null)
            )
        );

        const productMap = new Map<string, { name?: string; imageUrl?: string; durationMinutes?: number }>();
        for (const p of productResults) {
            if (!p?.id) continue;
            const rawLink = p.imageGroups?.[0]?.images?.[0]?.link ?? undefined;
            const imageUrl = rawLink ?? undefined;
            const durationMinutes = (p as { c_durationMinutes?: unknown }).c_durationMinutes;
            productMap.set(p.id, {
                name: p.name ?? undefined,
                imageUrl,
                durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : undefined,
            });
        }

        return items.map((item) => {
            const product = item.externalId ? productMap.get(item.externalId) : undefined;
            if (!product) return item;
            return {
                ...item,
                ...(product.name ? { title: product.name } : {}),
                ...(product.imageUrl ? { image: product.imageUrl } : {}),
                ...(typeof product.durationMinutes === 'number' && product.durationMinutes > 0
                    ? { minutes: product.durationMinutes }
                    : {}),
            };
        });
    } catch (err) {
        logger.warn('Appointment catalog enrichment failed', { error: String(err) });
        return items;
    }
}
