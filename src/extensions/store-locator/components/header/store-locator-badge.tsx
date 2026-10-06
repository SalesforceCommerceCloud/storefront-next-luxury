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
import { lazy, Suspense, type ReactElement } from 'react';
import { useStoreLocator } from '@/extensions/store-locator/providers/store-locator';

const StoreLocatorSheet = lazy(() => import('@/extensions/store-locator/components/header/store-locator-sheet'));

/**
 * Boutiques already live in the header utility links, so luxury renders NO standalone find-a-store icon.
 *
 * But this header slot (`sfcc.header.before.cart`) is also the host that mounts the store-locator sheet
 * when it is opened PROGRAMMATICALLY — e.g. selecting "Collect at Boutique" on a cart line item calls
 * `openStoreLocator()`, which flips the provider's `isOpen`. We mirror the sheet directly to that flag (no
 * local open state) so both opening and closing — including a programmatic `close()` after the shopper picks
 * a boutique — are honoured. The visible trigger button is omitted.
 *
 * Returning `null` unconditionally (the previous behaviour) removed the sheet host entirely, which left the
 * BOPIS "Collect at Boutique" flow unable to open the boutique picker (the click appeared to do nothing).
 */
export default function StoreLocatorBadge(): ReactElement | null {
    const isOpen = useStoreLocator((state) => state.isOpen);
    const closeStoreLocator = useStoreLocator((state) => state.close);

    // No visible find-a-store icon in the luxury header — only mount the sheet once it's opened.
    if (!isOpen) return null;

    return (
        <Suspense fallback={null}>
            {/* No trigger child — the sheet is opened programmatically (controlled via `open`), so it renders no
                empty, non-interactive trigger. Focus returns to whatever opened it (the cart's pickup control). */}
            <StoreLocatorSheet
                open={true}
                onOpenChange={(next) => {
                    if (!next) closeStoreLocator();
                }}
            />
        </Suspense>
    );
}
