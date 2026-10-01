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
import { useId, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoreLocatorList } from '@/extensions/store-locator/hooks/use-luxury-store-locator-list';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/typography';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import StoreDetails from '@/extensions/store-locator/components/store-locator/details';
import ListSkeleton from '@/extensions/store-locator/components/store-locator/list-skeleton';
import { APPOINTMENT_ANCHOR_ID, scrollToAppointment } from '../../../../lib/scroll-to-appointment';

export default function StoreLocatorList(): ReactElement | null {
    const { t } = useTranslation('extStoreLocator');
    const { t: tWatch } = useTranslation('watch');
    const instanceId = useId();
    const {
        selectedStoreInfo,
        setSelectedStoreInfo,
        geoError,
        hasSearched,
        hasError,
        isLoading,
        stores,
        storesPaginated,
        setPage,
    } = useStoreLocatorList();

    const renderMessage = (text: string, variant: 'info' | 'error' = 'info') => (
        <div className="my-6 text-center" role="status">
            <Typography variant="large" as="div" className={variant === 'error' ? 'text-destructive' : ''}>
                {text}
            </Typography>
            <Separator className="mt-4" />
        </div>
    );

    if (geoError) {
        return renderMessage(t('storeLocator.list.geoError'), 'error');
    }

    if (hasError) {
        return renderMessage(t('storeLocator.list.fetchError'), 'error');
    }

    if (!hasSearched) {
        return null;
    }

    if (isLoading) {
        return <ListSkeleton statusMessage={null} />;
    }

    if (!stores.length) {
        return renderMessage(t('storeLocator.list.noResults'));
    }

    return (
        <div className="mt-4">
            <RadioGroup
                className="store-locator-square-radio-group"
                name={`selectedStore-${instanceId}`}
                value={selectedStoreInfo?.id ?? ''}
                onValueChange={(value: string) => {
                    const selectedStore = storesPaginated.find((store) => store.id === value);
                    if (selectedStore) {
                        setSelectedStoreInfo(selectedStore);
                    }
                }}>
                <ul>
                    {storesPaginated.map((store, index) => {
                        const radioId = `selectedStore-${instanceId}-${store.id}`;
                        return (
                            <li key={store.id} className="py-3">
                                <div className="flex flex-col gap-3">
                                    <label className="flex items-start gap-3" htmlFor={radioId}>
                                        <RadioGroupItem
                                            id={radioId}
                                            value={store.id}
                                            className="store-locator-square-radio mt-1"
                                            aria-describedby={`store-info-${store.id}`}
                                            disabled={!store.inventoryId}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <StoreDetails
                                                store={store}
                                                showDistance={false}
                                                showStoreHours
                                                showPhone
                                                showEmail
                                                id={`store-info-${store.id}`}
                                            />
                                        </div>
                                    </label>
                                    <Button asChild size="sm" className="w-fit">
                                        <a
                                            href={`#${APPOINTMENT_ANCHOR_ID}`}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                setSelectedStoreInfo(store);
                                                scrollToAppointment();
                                            }}>
                                            {tWatch('boutiquesPage.bookAppointment', {
                                                defaultValue: 'Book appointment',
                                            })}
                                        </a>
                                    </Button>
                                </div>
                                {index < storesPaginated.length - 1 && <Separator className="my-3" />}
                            </li>
                        );
                    })}
                </ul>
            </RadioGroup>
            {stores.length > storesPaginated.length && (
                <div className="mt-3">
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setPage((page) => page + 1)}
                        id="load-more-button">
                        {t('storeLocator.list.loadMoreButton')}
                    </Button>
                </div>
            )}
        </div>
    );
}
