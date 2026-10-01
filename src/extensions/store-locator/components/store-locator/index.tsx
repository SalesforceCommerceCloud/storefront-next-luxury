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
import type { ReactElement } from 'react';
import BoutiqueLocator from '../../../../components/boutique-locator';
import { useStoreLocatorList } from '../../hooks/use-luxury-store-locator-list';

/**
 * Full-page and sheet store locator — same list + appointment surface,
 * with the map only on the unconstrained page.
 *
 * Now fetches boutiques from SCAPI via the luxury store-locator hook.
 */
export default function StoreLocator(): ReactElement {
    const { stores } = useStoreLocatorList();

    return (
        <section aria-labelledby="store-locator-heading" className="p-4">
            <h2 id="store-locator-heading" className="sr-only">
                Boutiques
            </h2>
            <BoutiqueLocator stores={stores} />
        </section>
    );
}
