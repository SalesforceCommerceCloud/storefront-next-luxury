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
import { useTranslation } from 'react-i18next';
import type { ServiceTerritoryOption } from '@/lib/appointment-scheduler';
import BoutiqueMap from '../boutique-map';

function addressLine(store: ServiceTerritoryOption): string {
    return [store.address1, store.postalCode, store.city].filter(Boolean).join(', ');
}

export default function StoreStill({ store }: { store: ServiceTerritoryOption }): ReactElement {
    const { i18n } = useTranslation('watch');
    const countryLabel = (() => {
        if (!store.countryCode) return undefined;
        try {
            return (
                new Intl.DisplayNames([i18n.language], { type: 'region' }).of(store.countryCode) ?? store.countryCode
            );
        } catch {
            return store.countryCode;
        }
    })();
    const place = [store.city, countryLabel].filter(Boolean).join(' · ');
    return (
        <aside className="absolute inset-0 bg-muted" data-testid="appointment-store-still">
            {/* Show the selected boutique's OSM map (facade is the map's own fallback), not the facade
                photo — the map keeps the selected-boutique location visible through the booking steps. */}
            <BoutiqueMap stores={[store]} selectedId={store.id} hideLabel />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground md:p-8">
                {place ? (
                    <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] opacity-80">{place}</p>
                ) : null}
                <p className="mt-2 font-serif text-3xl">{store.name}</p>
                <p className="mt-2 text-sm opacity-90">{addressLine(store)}</p>
                {store.phone ? <p className="mt-1 text-sm opacity-75">{store.phone}</p> : null}
            </div>
        </aside>
    );
}
