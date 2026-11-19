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
import { type ReactElement, useCallback } from 'react';
import {
    redirect,
    useFetcher,
    useNavigation,
    type LoaderFunctionArgs,
    type ShouldRevalidateFunctionArgs,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import { SeoMeta } from '@/components/seo-meta';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import { getLogger } from '@/lib/logger.server';
import { getAuth as getAuthServer } from '@/middlewares/auth.server';
import { buildUrlFromContext } from '@/lib/url.server';
import { routes } from '@/route-paths';
import { UITarget } from '@/targets/ui-target';
import { getAppointmentProvider } from '@/lib/appointment-scheduler/get-provider.server';
import type { ServiceTerritoryOption } from '@/lib/appointment-scheduler';
import {
    AppointmentProvider,
    type ServiceEntry,
} from '@/extensions/appointment-scheduling/context/appointment-context';
import { enrichFromCatalog } from '../lib/appointment-enrichment.server';
import { fetchBoutiquesForEnrichment, BOUTIQUE_IDS } from '../lib/stores.server';
import { getCurrentCustomer } from '@/lib/api/customer.server';
import type { ShopperStores } from '@/scapi';

const BOOKING_WINDOW_DAYS = 90;

export type LuxuryAppointmentsPageData = {
    pageUrl: string;
    territories: ServiceTerritoryOption[];
    workTypes?: ServiceEntry[];
    slots?: { startTime: string; endTime: string }[];
    advanceNoticeMinutes: number;
    shopperName?: string;
    shopperEmail?: string;
    schedulerEnabled: boolean;
};

export function shouldRevalidate({
    currentUrl,
    nextUrl,
    defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
    const prev = currentUrl.searchParams;
    const next = nextUrl.searchParams;
    return (
        defaultShouldRevalidate ||
        prev.get('territory') !== next.get('territory') ||
        prev.get('workType') !== next.get('workType')
    );
}

export async function loader({ request, context }: LoaderFunctionArgs): Promise<LuxuryAppointmentsPageData> {
    const config = getConfig(context);
    const logger = getLogger(context);
    const session = getAuthServer(context);
    if (session.userType !== 'registered' || !session.customerId) {
        logger.warn('Appointments: unauthenticated access, redirecting to login');
        const returnPath = new URL(request.url).pathname + new URL(request.url).search;
        const loginUrl = new URL(buildUrlFromContext(routes.login, context), request.url);
        loginUrl.searchParams.set('returnUrl', returnPath);
        throw redirect(loginUrl.toString());
    }

    const url = new URL(request.url);
    const territoryId = url.searchParams.get('territory') ?? undefined;
    const workTypeId = url.searchParams.get('workType') ?? undefined;
    const siteId = config.scheduler?.siteId;
    const schedulerEnabled = Boolean(config.features?.appointment?.enabled);

    // Fetch territories and customer in parallel.
    const [territoriesResult, customer] = await Promise.all([
        (async () => {
            try {
                return await getAppointmentProvider(config, context).getServiceTerritories({ siteId });
            } catch {
                return { success: false as const, error: { code: 'UNAVAILABLE' as const } };
            }
        })(),
        getCurrentCustomer(context).catch(() => null),
    ]);

    const rawTerritories: ServiceTerritoryOption[] = territoriesResult.success ? territoriesResult.territories : [];

    let territories: ServiceTerritoryOption[];
    let workTypes: ServiceEntry[] | undefined;
    let slots: { startTime: string; endTime: string }[] | undefined;

    if (schedulerEnabled) {
        if (territoryId) {
            // Enrich territories and fetch work types for the selected territory in parallel.
            const [enrichedTerritories, workTypesResult] = await Promise.all([
                enrichFromCatalog(context, rawTerritories),
                (async () => {
                    try {
                        return await getAppointmentProvider(config, context).getWorkTypes({ territoryId });
                    } catch {
                        return { success: false as const, error: { code: 'UNAVAILABLE' as const } };
                    }
                })(),
            ]);

            territories = enrichedTerritories;

            const rawWorkTypes = workTypesResult.success ? workTypesResult.workTypes : [];
            const rawMapped = rawWorkTypes.map((wt) => ({
                id: wt.id,
                workType: wt.id,
                minutes: wt.durationMinutes,
                titleKey: null as null,
                title: wt.name,
                workTypeGroupId: wt.workTypeGroupId,
                externalId: wt.externalId,
            }));
            workTypes = await enrichFromCatalog(context, rawMapped);

            if (workTypeId) {
                // Fetch availability for the full booking window.
                const selectedWorkType = rawWorkTypes.find((wt) => wt.id === workTypeId);
                const workTypeGroupId = selectedWorkType?.workTypeGroupId;
                const now = new Date();
                const endWindow = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

                try {
                    const availabilityResult = await getAppointmentProvider(config, context).getAvailability({
                        startTime: now.toISOString(),
                        endTime: endWindow.toISOString(),
                        territoryId,
                        workTypeId,
                        workTypeGroupId,
                    });
                    if (availabilityResult.success) {
                        slots = availabilityResult.slots.map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
                    }
                } catch {
                    // non-fatal — availability degrades gracefully to empty calendar
                }
            }
        } else {
            territories = await enrichFromCatalog(context, rawTerritories);
        }
    } else {
        // Scheduler not provisioned: source boutiques from SFCC dataset stores, work types from
        // c_supportedWorkTypes on the selected store. Slots are always empty (appointment unavailable
        // message shown instead), directing shoppers to contact the boutique directly.
        const rawStores = await fetchBoutiquesForEnrichment(context, [...BOUTIQUE_IDS]).catch(() => []);
        const storeItems = rawStores.map((s: ShopperStores.schemas['Store']) => ({
            id: s.id ?? '',
            sfId: s.id ?? '',
            name: s.name ?? '',
            timezone: 'UTC',
            externalId: s.id,
            address1: s.address1,
            city: s.city,
            countryCode: s.countryCode,
            postalCode: s.postalCode,
            phone: s.phone,
            latitude: typeof s.latitude === 'number' ? s.latitude : undefined,
            longitude: typeof s.longitude === 'number' ? s.longitude : undefined,
        }));
        territories = await enrichFromCatalog(context, storeItems);

        if (territoryId) {
            const selectedStore = rawStores.find((s: ShopperStores.schemas['Store']) => s.id === territoryId);
            const rawWorkTypes = (selectedStore as { c_supportedWorkTypes?: string | string[] } | undefined)
                ?.c_supportedWorkTypes;
            // Parse c_supportedWorkTypes: comma-separated string (import) or array (set-of-string).
            const supportedIds =
                typeof rawWorkTypes === 'string'
                    ? rawWorkTypes
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : Array.isArray(rawWorkTypes)
                      ? rawWorkTypes
                      : [];
            if (supportedIds.length > 0) {
                const workTypeSeeds = supportedIds.map((id) => ({
                    id,
                    externalId: id,
                    workType: id,
                    minutes: 0,
                    titleKey: null as null,
                }));
                workTypes = await enrichFromCatalog(context, workTypeSeeds);
            }
            // Slots always empty when scheduler disabled — triggers "contact boutique" unavailability message.
            slots = [];
        }
    }

    const shopperName = customer
        ? [customer.firstName, customer.lastName].filter(Boolean).join(' ') || undefined
        : undefined;

    return {
        pageUrl: buildCanonicalUrl(url.origin, url.pathname, url.search),
        territories,
        workTypes,
        slots,
        advanceNoticeMinutes: config.features.appointment?.advanceNoticeMinutes ?? 120,
        shopperName,
        shopperEmail: customer?.email ?? customer?.login ?? undefined,
        schedulerEnabled,
    };
}

export default function LuxuryAppointmentsPage({
    loaderData,
}: {
    loaderData: LuxuryAppointmentsPageData;
}): ReactElement {
    const { t } = useTranslation('watch');
    const bookingFetcher = useFetcher<{ success: boolean; serviceAppointmentId?: string; error?: string }>();
    const navigation = useNavigation();

    const onBook = useCallback(
        (formData: FormData) => {
            void bookingFetcher.submit(formData, { method: 'POST', action: '/resource/appointment-book' });
        },
        [bookingFetcher]
    );

    return (
        <AppointmentProvider
            territories={loaderData.territories}
            workTypes={loaderData.workTypes}
            slots={loaderData.slots}
            advanceNoticeMinutes={loaderData.advanceNoticeMinutes}
            onBook={onBook}
            bookingSubmitting={bookingFetcher.state !== 'idle'}
            bookingResult={bookingFetcher.data}
            shopperName={loaderData.shopperName}
            shopperEmail={loaderData.shopperEmail}
            schedulerEnabled={loaderData.schedulerEnabled}
            isNavigating={navigation.state === 'loading'}>
            <div className="flex h-full min-h-0 w-full flex-1 flex-col">
                <SeoMeta
                    rawTitle
                    title={t('boutiquesPage.appointmentTitle')}
                    description={t('boutiquesPage.body')}
                    openGraph={{ type: 'website', url: loaderData.pageUrl }}
                />
                <UITarget targetId="sfcc.scheduler.appointment-locator" />
            </div>
        </AppointmentProvider>
    );
}
