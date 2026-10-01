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
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { ShopperStores } from '@/scapi';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import { boutiqueCountryCodes, filterBoutiques } from '../../lib/boutiques';
import BoutiqueMap from '../boutique-map';

export const boutiqueStageGrid =
    'grid h-full min-h-0 lg:grid-cols-[minmax(18rem,32rem)_minmax(0,1fr)] lg:items-stretch';
export const boutiqueStageLeft = 'relative min-h-[18rem] overflow-hidden lg:h-full lg:min-h-0';
export const boutiqueStageRight =
    '@container flex min-h-0 flex-col border-border px-[var(--page-gutter)] pt-16 pb-8 lg:h-full lg:overflow-y-auto lg:overscroll-y-contain lg:border-l lg:py-8';

type BoutiqueDirectoryProps = {
    stores: ShopperStores.schemas['Store'][];
    selectedId?: string;
    onSelect: (id: string) => void;
    lead?: ReactElement | null;
    chrome?: ReactElement | null;
};

function regionName(countryCode: string | undefined, locale: string): string | undefined {
    if (!countryCode) return undefined;
    try {
        return new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode) ?? countryCode;
    } catch {
        return countryCode;
    }
}

function addressLine(store: ShopperStores.schemas['Store']): string {
    return [store.address1, store.postalCode, store.city].filter(Boolean).join(', ');
}

export default function BoutiqueDirectory({
    stores,
    selectedId,
    onSelect,
    lead,
    chrome,
}: BoutiqueDirectoryProps): ReactElement {
    const { t, i18n } = useTranslation('watch');
    const [countryCode, setCountryCode] = useState('');
    const [postalQuery, setPostalQuery] = useState('');
    const [focusedId, setFocusedId] = useState(selectedId || stores[0]?.id || '');
    const countries = useMemo(() => boutiqueCountryCodes(stores), [stores]);
    const visible = useMemo(
        () => filterBoutiques(stores, countryCode, postalQuery),
        [stores, countryCode, postalQuery]
    );

    useEffect(() => {
        if (selectedId) setFocusedId(selectedId);
    }, [selectedId]);

    useEffect(() => {
        if (!visible.some((store) => store.id === focusedId)) {
            setFocusedId(visible[0]?.id ?? '');
        }
    }, [visible, focusedId]);

    return (
        <section
            className="flex h-full min-h-0 flex-col"
            data-testid="boutique-directory"
            data-slot="luxury-boutique-finder">
            <div className={boutiqueStageGrid}>
                <div className={boutiqueStageLeft}>
                    <BoutiqueMap stores={visible.length ? visible : stores} selectedId={focusedId} />
                </div>
                <div className={boutiqueStageRight}>
                    {chrome ? <div className="mb-8">{chrome}</div> : null}
                    {lead ? <div className="mb-6">{lead}</div> : null}
                    <p className="text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        {t('boutiquesPage.directoryTitle', { defaultValue: 'Our boutiques' })}
                    </p>
                    <p className="mt-2 font-serif text-2xl">{t('boutiquesPage.stepLocation')}</p>
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="boutique-filters">
                        <div className="flex min-w-0 flex-col gap-2">
                            <label className="text-sm" htmlFor="boutique-filter-country">
                                {t('boutiquesPage.filterCountry')}
                            </label>
                            <div className="w-full [&>[data-slot=native-select-wrapper]]:w-full">
                                <NativeSelect
                                    id="boutique-filter-country"
                                    value={countryCode}
                                    onChange={(event) => setCountryCode(event.target.value)}
                                    aria-label={t('boutiquesPage.filterCountry')}
                                    className="w-full">
                                    <NativeSelectOption value="">
                                        {t('boutiquesPage.filterAllCountries')}
                                    </NativeSelectOption>
                                    {countries.map((code) => (
                                        <NativeSelectOption key={code} value={code}>
                                            {regionName(code, i18n.language) ?? code}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </div>
                        </div>
                        <div className="flex min-w-0 flex-col gap-2">
                            <label className="text-sm" htmlFor="boutique-filter-postal">
                                {t('boutiquesPage.filterPostal')}
                            </label>
                            <Input
                                id="boutique-filter-postal"
                                value={postalQuery}
                                onChange={(event) => setPostalQuery(event.target.value)}
                                autoComplete="postal-code"
                            />
                        </div>
                    </div>
                    {visible.length === 0 ? (
                        <p className="mt-10 text-muted-foreground">{t('boutiquesPage.noFilterMatches')}</p>
                    ) : (
                        <ul className="mt-6 grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3">
                            {visible.map((store) => {
                                const selected = store.id === focusedId;
                                const country = regionName(store.countryCode, i18n.language);
                                const place = [store.city, country].filter(Boolean).join(' · ');
                                return (
                                    <li key={store.id}>
                                        <button
                                            type="button"
                                            aria-pressed={selected}
                                            className={cn(
                                                'flex w-full flex-col overflow-hidden border text-left transition-colors',
                                                selected
                                                    ? 'border-foreground bg-muted/40'
                                                    : 'border-border hover:border-foreground/40'
                                            )}
                                            onClick={() => store.id && onSelect(store.id)}>
                                            {store.image ? (
                                                <img
                                                    src={store.image}
                                                    alt=""
                                                    className="aspect-[4/3] w-full object-cover"
                                                    data-testid="boutique-facade"
                                                />
                                            ) : null}
                                            <span className="flex min-w-0 flex-col p-4">
                                                {place ? (
                                                    <span className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                        {place}
                                                    </span>
                                                ) : null}
                                                <span className="mt-2 block font-serif text-xl">{store.name}</span>
                                                <span className="mt-2 block text-sm text-muted-foreground">
                                                    {addressLine(store)}
                                                </span>
                                                {store.storeHours ? (
                                                    <span className="mt-2 block text-sm">{store.storeHours}</span>
                                                ) : null}
                                                {store.phone ? (
                                                    <span className="mt-1 block text-sm text-muted-foreground">
                                                        {store.phone}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
