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
import { useCallback, useEffect, useRef, type ReactElement } from 'react';
import { useFetcher } from 'react-router';
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import { isNativeStoreSelectionEnabled } from '@/lib/shopper-context/store-selection';
import type { action as selectStoreAction } from '@/extensions/store-locator/routes/action.set-selected-store';
import { useTranslation } from 'react-i18next';
import { resourceRoutes } from '@/route-paths';
import { useToast } from '@/components/toast';
import { useStoreLocator } from '@/extensions/store-locator/providers/store-locator';
import BoutiqueDirectory from '../../../../components/boutique-directory';
import { useBoutiqueList } from '../../hooks/use-boutique-list';

/**
 * Store-locator body for the luxury vertical — the surface the cart "Collect at Boutique" flow opens.
 *
 * The canonical picker is a postal/radius search that stays empty until the shopper searches and, for a handful
 * of flagship boutiques, returns nothing. Instead this seeds the branded {@link BoutiqueDirectory} with all
 * boutiques (map + client-side country/postal filter). When the cart opened the sheet for a specific line item
 * (via the provider's `pickupContext`), the list is augmented with per-boutique stock for that item. Selecting a
 * boutique writes it to the store-locator selection (carrying the inventory id) and closes the sheet, which the
 * cart line item then uses to submit the pickup.
 */
export default function StoreLocator(): ReactElement {
    const { t } = useTranslation('extStoreLocator');
    const pickupContext = useStoreLocator((s) => s.pickupContext);
    const selectedStoreInfo = useStoreLocator((s) => s.selectedStoreInfo);
    const setSelectedStoreInfo = useStoreLocator((s) => s.setSelectedStoreInfo);
    const close = useStoreLocator((s) => s.close);
    const { stores, availability } = useBoutiqueList(pickupContext);
    const persistFetcher = useFetcher<typeof selectStoreAction>();
    const nativeEnabled = isNativeStoreSelectionEnabled(useConfig().features.shopperContext);
    const selectionPending = useRef(false);
    const isSelecting = nativeEnabled && persistFetcher.state !== 'idle';
    const { addToast } = useToast();
    const lastError = useRef<unknown>(null);
    const lastSuccess = useRef<unknown>(null);
    useEffect(() => {
        if (!nativeEnabled || persistFetcher.state !== 'idle' || persistFetcher.data?.success !== false) return;
        if (lastError.current === persistFetcher.data) return;
        lastError.current = persistFetcher.data;
        addToast(
            t(
                persistFetcher.data.code === 'STORE_CHANGE_CONFIRMATION_REQUIRED'
                    ? 'storeLocator.list.storeChangeUnavailable'
                    : 'storeLocator.list.fetchError'
            ),
            'error'
        );
    }, [nativeEnabled, persistFetcher.state, persistFetcher.data, addToast, t]);
    useEffect(() => {
        if (
            nativeEnabled &&
            persistFetcher.state === 'idle' &&
            persistFetcher.data?.success &&
            'selectedStoreInfo' in persistFetcher.data &&
            lastSuccess.current !== persistFetcher.data
        ) {
            lastSuccess.current = persistFetcher.data;
            setSelectedStoreInfo(persistFetcher.data.selectedStoreInfo);
            close();
        }
    }, [nativeEnabled, persistFetcher.state, persistFetcher.data, setSelectedStoreInfo, close]);

    const handleSelect = useCallback(
        (id: string) => {
            if (nativeEnabled && (selectionPending.current || persistFetcher.state !== 'idle')) return;
            const store = stores.find((s) => s.id === id);
            if (!store?.id) return;
            // Keep legacy optimistic selection; native mode publishes only the committed response.
            const info = {
                id: store.externalId ?? store.id,
                name: store.name || store.id,
                inventoryId: store.inventoryId,
            };
            if (!nativeEnabled) setSelectedStoreInfo(info);
            const formData = new FormData();
            formData.set('storeInfo', JSON.stringify(info));
            if (!nativeEnabled) {
                void persistFetcher.submit(formData, { method: 'POST', action: resourceRoutes.setSelectedStore });
                close();
                return;
            }
            selectionPending.current = true;
            void (async () => {
                try {
                    await persistFetcher.submit(formData, { method: 'POST', action: resourceRoutes.setSelectedStore });
                } catch {
                    addToast(t('storeLocator.list.fetchError'), 'error');
                } finally {
                    selectionPending.current = false;
                }
            })();
        },
        [nativeEnabled, stores, setSelectedStoreInfo, persistFetcher, close, addToast, t]
    );

    // Wrap in the same labelled landmark the canonical store-locator renders (`store-locator-heading`), so the
    // shared store-locator section contract — and the stories/tests that assert it — holds for both verticals.
    return (
        <section aria-labelledby="store-locator-heading">
            <h2 id="store-locator-heading" className="sr-only">
                {t('storeLocator.title')}
            </h2>
            <BoutiqueDirectory
                layout="panel"
                stores={stores}
                availability={availability}
                selectedId={stores.find((store) => (store.externalId ?? store.id) === selectedStoreInfo?.id)?.id}
                onSelect={handleSelect}
                selectionPending={isSelecting}
            />
        </section>
    );
}
