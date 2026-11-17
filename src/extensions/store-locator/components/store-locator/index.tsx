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
import { useTranslation } from 'react-i18next';
import { useStoreLocator } from '@/extensions/store-locator/providers/store-locator';
import { useStoreSelection } from '@/extensions/store-locator/providers/selection';
import StoreSelectionFeedback from '@/extensions/store-locator/providers/chooser-feedback';
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
    const selectionPending = useStoreLocator((s) => s.selectionPending);
    const selectionError = useStoreLocator((s) => s.selectionError);
    const close = useStoreLocator((s) => s.close);
    const { select } = useStoreSelection();
    const { stores, availability } = useBoutiqueList(pickupContext);
    // Set when THIS sheet submitted a selection; the sheet closes only once that exact store is confirmed,
    // which the cart line item then uses to submit the pickup.
    const pendingId = useRef<string | null>(null);

    useEffect(() => {
        if (!pendingId.current || selectionPending) return;
        const id = pendingId.current;
        if (selectionError) {
            pendingId.current = null;
            return;
        }
        if (selectedStoreInfo?.id === id) {
            pendingId.current = null;
            close();
        }
    }, [selectionPending, selectionError, selectedStoreInfo?.id, close]);

    const handleSelect = useCallback(
        (id: string) => {
            if (selectionPending) return;
            const store = stores.find((s) => s.id === id);
            if (!store?.id) return;
            const info = {
                id: store.externalId ?? store.id,
                name: store.name || store.id,
                inventoryId: store.inventoryId,
            };
            pendingId.current = info.id;
            select(info);
        },
        [selectionPending, stores, select]
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
                selectionPending={selectionPending}
            />
            <StoreSelectionFeedback />
        </section>
    );
}
