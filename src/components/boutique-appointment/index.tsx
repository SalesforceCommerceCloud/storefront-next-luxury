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
import { type FormEvent, type ReactElement, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import type { ShopperStores } from '@/scapi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { cn, resolveAssetUrl } from '@/lib/utils';
import { getAppointmentSlots } from '../../lib/boutiques';
import type { AppointmentPiece } from '@/lib/appointment';
import BoutiqueDirectory, { boutiqueStageGrid, boutiqueStageLeft, boutiqueStageRight } from '../boutique-directory';
import BoutiqueMap from '../boutique-map';

const BOOKING_WINDOW_DAYS = 90;

const STEPS = ['location', 'service', 'when', 'review'] as const;
type WizardStep = (typeof STEPS)[number];

const STEP_NAV = {
    location: 'boutiquesPage.stepNavLocation',
    service: 'boutiquesPage.stepNavService',
    when: 'boutiquesPage.stepNavWhen',
    review: 'boutiquesPage.stepNavReview',
} as const satisfies Record<WizardStep, `boutiquesPage.${string}`>;

const SERVICES = [
    {
        id: 'view',
        workType: 'private',
        minutes: 30,
        titleKey: 'boutiquesPage.reasonView',
        hintKey: 'boutiquesPage.reasonViewHint',
        // Editorial fallback; when arriving from a PDP the tile uses the selected piece's SCAPI image.
        image: resolveAssetUrl('/images/finder-band.webp'),
    },
    {
        id: 'advice',
        workType: 'consultation',
        minutes: 30,
        titleKey: 'boutiquesPage.reasonAdvice',
        hintKey: 'boutiquesPage.reasonAdviceHint',
        image: resolveAssetUrl('/images/salons/salon-interior.webp'),
    },
    {
        id: 'strap',
        workType: 'consultation',
        minutes: 20,
        titleKey: 'boutiquesPage.reasonStrap',
        hintKey: 'boutiquesPage.reasonStrapHint',
        image: resolveAssetUrl('/images/watches/ln-heritage-001-strap.webp'),
    },
    {
        id: 'service',
        workType: 'service',
        minutes: 15,
        titleKey: 'boutiquesPage.reasonService',
        hintKey: 'boutiquesPage.reasonServiceHint',
        image: resolveAssetUrl('/images/pages/servicing.webp'),
    },
    {
        id: 'collect',
        workType: 'service',
        minutes: 15,
        titleKey: 'boutiquesPage.reasonCollect',
        hintKey: 'boutiquesPage.reasonCollectHint',
        image: resolveAssetUrl('/images/pages/atelier.webp'),
    },
    {
        id: 'gift',
        workType: 'private',
        minutes: 30,
        titleKey: 'boutiquesPage.reasonGift',
        hintKey: 'boutiquesPage.reasonGiftHint',
        image: resolveAssetUrl('/images/pages/finishing.webp'),
    },
] as const;

function isoFromParts(year: number, monthIndex: number, day: number): string {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function localIsoToday(): string {
    const now = new Date();
    return isoFromParts(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDaysIso(iso: string, days: number): string {
    const [year, month, day] = iso.split('-').map(Number);
    const next = new Date(year, month - 1, day + days);
    return isoFromParts(next.getFullYear(), next.getMonth(), next.getDate());
}

function monthKey(year: number, monthIndex: number): string {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

function shiftMonth(year: number, monthIndex: number, delta: number): { year: number; month: number } {
    const next = new Date(year, monthIndex + delta, 1);
    return { year: next.getFullYear(), month: next.getMonth() };
}

function monthTitle(year: number, monthIndex: number, locale: string): string {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, monthIndex, 1));
}

function weekdayLabels(locale: string, start: 0 | 1): string[] {
    const sunday = new Date(2026, 8, 6);
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(sunday);
        day.setDate(sunday.getDate() + ((start + index) % 7));
        return fmt.format(day);
    });
}

function dayAriaLabel(iso: string, locale: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(year, month - 1, day));
}

function weekStartsOn(locale: string): 0 | 1 {
    return locale.toLowerCase().startsWith('en-us') ? 0 : 1;
}

function MonthCalendar({
    locale,
    minDate,
    selected,
    storeId,
    onSelect,
}: {
    locale: string;
    minDate: string;
    selected: string;
    storeId: string | undefined;
    onSelect: (iso: string) => void;
}): ReactElement {
    const { t } = useTranslation('watch');
    const maxDate = addDaysIso(minDate, BOOKING_WINDOW_DAYS);
    const start = weekStartsOn(locale);
    const [cursor, setCursor] = useState(() => {
        const iso = selected || minDate;
        const [year, month] = iso.split('-').map(Number);
        return { year, month: month - 1 };
    });

    useEffect(() => {
        if (!selected) return;
        const [year, month] = selected.split('-').map(Number);
        setCursor((current) =>
            current.year === year && current.month === month - 1 ? current : { year, month: month - 1 }
        );
    }, [selected]);

    const title = monthTitle(cursor.year, cursor.month, locale);
    const cursorMonth = monthKey(cursor.year, cursor.month);
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const pad = (new Date(cursor.year, cursor.month, 1).getDay() - start + 7) % 7;
    const leadingPads = Array.from({ length: pad }, (_, slot) => `${cursorMonth}-lead-${slot}`);
    const monthDays = Array.from({ length: daysInMonth }, (_, day) => isoFromParts(cursor.year, cursor.month, day + 1));
    const canPrev = cursorMonth > minDate.slice(0, 7);
    const canNext = cursorMonth < maxDate.slice(0, 7);

    return (
        <div data-testid="appointment-calendar" role="group" aria-label={t('boutiquesPage.date')}>
            <div className="flex items-center justify-between gap-3">
                <p className="font-serif text-3xl">{title}</p>
                <div className="flex gap-1">
                    <button
                        type="button"
                        className="inline-flex size-10 items-center justify-center disabled:text-muted-foreground/40"
                        aria-label={t('boutiquesPage.calendarPrev')}
                        disabled={!canPrev}
                        onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}>
                        <ChevronLeft className="size-5" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="inline-flex size-10 items-center justify-center disabled:text-muted-foreground/40"
                        aria-label={t('boutiquesPage.calendarNext')}
                        disabled={!canNext}
                        onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}>
                        <ChevronRight className="size-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
            <div className="mt-5" role="grid" aria-label={title}>
                <div className="grid grid-cols-7 border-b border-border pb-2.5 text-center text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {weekdayLabels(locale, start).map((label) => (
                        <span key={label}>{label}</span>
                    ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1">
                    {leadingPads.map((padKey) => (
                        <span key={padKey} />
                    ))}
                    {monthDays.map((iso) => {
                        const available =
                            iso >= minDate && iso <= maxDate && getAppointmentSlots(storeId, iso).length > 0;
                        const isSelected = selected === iso;
                        const isToday = iso === minDate;
                        return (
                            <button
                                key={iso}
                                type="button"
                                data-date={iso}
                                data-testid={available ? 'appointment-day' : undefined}
                                disabled={!available}
                                aria-pressed={isSelected}
                                aria-label={dayAriaLabel(iso, locale)}
                                onClick={() => onSelect(iso)}
                                className={cn(
                                    'h-12 text-base tabular-nums',
                                    isSelected && 'bg-foreground text-primary-foreground',
                                    !available && 'text-muted-foreground/35',
                                    available && !isSelected && 'hover:bg-muted',
                                    isToday && !isSelected && 'underline decoration-foreground/40 underline-offset-4'
                                )}>
                                {Number(iso.slice(-2))}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

type BoutiqueAppointmentProps = {
    stores: ShopperStores.schemas['Store'][];
    productId?: string;
    productName?: string;
    piece?: AppointmentPiece | null;
    catalog?: AppointmentPiece[];
};

function formatReviewDate(iso: string, locale: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(year, month - 1, day));
}

function addressLine(store: ShopperStores.schemas['Store']): string {
    return [store.address1, store.postalCode, store.city].filter(Boolean).join(', ');
}

function enrichPiece(
    piece: AppointmentPiece | null | undefined,
    productId?: string,
    productName?: string
): AppointmentPiece | null {
    const id = piece?.id || productId;
    if (!id && !productName) return null;
    return {
        id: id ?? '',
        name: piece?.name || productName || '',
        reference: piece?.reference,
        image: piece?.image,
        collection: piece?.collection,
    };
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }): ReactElement {
    return (
        <div className="flex min-w-0 flex-col gap-2">
            <label className="text-sm" htmlFor={id}>
                {label}
            </label>
            {children}
        </div>
    );
}

function SelectField({ children }: { children: ReactNode }): ReactElement {
    return <div className="w-full [&>[data-slot=native-select-wrapper]]:w-full">{children}</div>;
}

function PieceCard({ piece }: { piece: AppointmentPiece }): ReactElement {
    const { t } = useTranslation('watch');
    return (
        <div data-testid="appointment-product" className="flex gap-4 bg-muted/40 p-4 md:items-center md:gap-5">
            {piece.image ? (
                <img
                    src={resolveAssetUrl(piece.image)}
                    alt={piece.name}
                    className="size-20 shrink-0 bg-background object-contain"
                />
            ) : (
                <div className="size-20 shrink-0 bg-muted" aria-hidden="true" />
            )}
            <div className="min-w-0">
                {piece.collection ? (
                    <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground">
                        {piece.collection}
                    </p>
                ) : null}
                <p className="mt-1 font-serif text-base leading-snug md:text-lg">{piece.name}</p>
                {piece.reference ? (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {t('reference', { ref: piece.reference })}
                    </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">{t('boutiquesPage.appointmentProductHint')}</p>
            </div>
            <input type="hidden" name="productId" value={piece.id} />
            <input type="hidden" name="productName" value={piece.name} />
            {piece.reference ? <input type="hidden" name="productReference" value={piece.reference} /> : null}
        </div>
    );
}

function ServiceCard({
    selected,
    title,
    details,
    minutes,
    image,
    onSelect,
}: {
    selected: boolean;
    title: string;
    details: string;
    minutes: number;
    image: string;
    onSelect: () => void;
}): ReactElement {
    const { t } = useTranslation('watch');
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            data-testid="appointment-service"
            className={cn(
                'grid w-full grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden border text-left transition-colors',
                selected ? 'border-foreground bg-muted/40' : 'border-border hover:border-foreground/40'
            )}>
            <img src={resolveAssetUrl(image)} alt="" className="h-full min-h-[7.5rem] w-full object-cover" />
            <span className="flex min-w-0 flex-col justify-center p-3 sm:p-4">
                <span className="font-serif text-lg">{title}</span>
                <span className="mt-1 text-sm text-muted-foreground">{details}</span>
                <span className="mt-2 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {t('boutiquesPage.durationLine', { minutes })}
                </span>
            </span>
        </button>
    );
}

function WizardStepper({
    step,
    maxReached,
    onGoTo,
}: {
    step: WizardStep;
    maxReached: number;
    onGoTo: (next: WizardStep) => void;
}): ReactElement {
    const { t } = useTranslation('watch');
    const stepIndex = STEPS.indexOf(step);
    return (
        <nav aria-label={t('boutiquesPage.appointmentTitle')} className="w-fit max-w-full shrink-0">
            <ol className="flex items-start" data-testid="appointment-stepper">
                {STEPS.map((id, index) => {
                    const current = id === step;
                    const reachable = index <= maxReached;
                    const label = t(STEP_NAV[id]) as string;
                    const circle = (
                        <span
                            className={cn(
                                'flex size-9 items-center justify-center border text-sm',
                                current
                                    ? 'border-foreground bg-foreground text-primary-foreground'
                                    : reachable
                                      ? 'border-foreground text-foreground'
                                      : 'border-border text-muted-foreground'
                            )}>
                            {index + 1}
                        </span>
                    );
                    const body = (
                        <>
                            {circle}
                            <span
                                className={cn(
                                    'mt-2 text-center text-[0.6875rem] uppercase tracking-[0.12em]',
                                    current || reachable ? 'text-foreground' : 'text-muted-foreground'
                                )}>
                                {label}
                            </span>
                        </>
                    );
                    return (
                        <li key={id} className="flex shrink-0 items-center">
                            {reachable && !current ? (
                                <button
                                    type="button"
                                    aria-label={label}
                                    onClick={() => onGoTo(id)}
                                    className="flex w-14 flex-col items-center">
                                    {body}
                                </button>
                            ) : (
                                <div
                                    aria-current={current ? 'step' : undefined}
                                    className="flex w-14 flex-col items-center">
                                    {body}
                                </div>
                            )}
                            {index < STEPS.length - 1 ? (
                                <span
                                    className={cn('mb-6 h-px w-6', index < stepIndex ? 'bg-foreground' : 'bg-border')}
                                    aria-hidden="true"
                                />
                            ) : null}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

function SummaryRow({ title, detail, onEdit }: { title: string; detail?: string; onEdit: () => void }): ReactElement {
    const { t } = useTranslation('watch');
    return (
        <div className="flex items-center justify-between gap-3 border-b border-border py-2.5">
            <div className="min-w-0">
                <p className="font-serif text-base leading-snug">{title}</p>
                {detail ? <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p> : null}
            </div>
            <button
                type="button"
                onClick={onEdit}
                className="inline-flex shrink-0 items-center gap-1 text-xs"
                aria-label={`${t('boutiquesPage.edit') as string} ${title}`}>
                {t('boutiquesPage.edit')}
                <Pencil className="size-3" aria-hidden="true" />
            </button>
        </div>
    );
}

// Read-only summary row for the post-submit confirmation. Rendered inside a <dl> so screen
// readers hear each value with its term (the term is visually hidden to keep the Review-step look).
function ReviewDetail({ term, title, detail }: { term: string; title: string; detail?: string }): ReactElement {
    return (
        <div className="border-b border-border py-2.5">
            <dt className="sr-only">{term}</dt>
            <dd className="m-0">
                <p className="font-serif text-base leading-snug">{title}</p>
                {detail ? <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p> : null}
            </dd>
        </div>
    );
}

function StoreStill({ store }: { store: ShopperStores.schemas['Store'] }): ReactElement {
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
                {store.storeHours ? <p className="mt-1 text-sm opacity-90">{store.storeHours}</p> : null}
            </div>
        </aside>
    );
}

export default function BoutiqueAppointment({
    stores,
    productId,
    productName,
    piece,
    catalog = [],
}: BoutiqueAppointmentProps): ReactElement {
    const { t, i18n } = useTranslation('watch');
    const [done, setDone] = useState(false);
    const [step, setStep] = useState<WizardStep>('location');
    const [maxReached, setMaxReached] = useState(0);
    const [storeId, setStoreId] = useState('');
    const [reason, setReason] = useState('');
    const [workType, setWorkType] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const store = stores.find((entry) => entry.id === storeId) ?? null;
    const locked = useMemo(() => enrichPiece(piece, productId, productName), [piece, productId, productName]);
    const effectiveCatalog = useMemo(() => (locked ? [] : catalog), [locked, catalog]);
    const [pickedId, setPickedId] = useState(locked?.id ?? '');
    const selected = locked ?? effectiveCatalog.find((entry) => entry.id === pickedId) ?? null;
    const minDate = useMemo(() => localIsoToday(), []);
    const slots = useMemo(() => getAppointmentSlots(store?.id, date), [store?.id, date]);
    const selectedService = SERVICES.find((entry) => entry.id === reason);
    const stepIndex = STEPS.indexOf(step);

    const goTo = (next: WizardStep) => {
        const index = STEPS.indexOf(next);
        if (index <= maxReached) setStep(next);
    };

    const advanceTo = (next: WizardStep) => {
        const index = STEPS.indexOf(next);
        setMaxReached((current) => Math.max(current, index));
        setStep(next);
    };

    const goBack = () => {
        if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
    };

    const pickBoutique = (id: string) => {
        if (id !== storeId) {
            setDate('');
            setTime('');
        }
        setStoreId(id);
        advanceTo('service');
    };

    const pickService = (id: (typeof SERVICES)[number]['id']) => {
        const service = SERVICES.find((entry) => entry.id === id);
        if (!service) return;
        setReason(service.id);
        setWorkType(service.workType);
        advanceTo('when');
    };

    const pickTime = (slot: string) => {
        setTime(slot);
        advanceTo('review');
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!store) return;
        const form = new FormData(event.currentTarget);
        const formProductId = String(form.get('productId') ?? '').trim();
        const formProductName = String(form.get('productName') ?? '').trim();
        const formProductReference = String(form.get('productReference') ?? '').trim();
        const payload = {
            storeId: store.id,
            storeName: store.name,
            productId: selected?.id || formProductId || null,
            productName: selected?.name || formProductName || null,
            productReference: selected?.reference || formProductReference || null,
            reason,
            workType,
            name: String(form.get('name') ?? '').trim(),
            email: String(form.get('email') ?? '').trim(),
            phone: String(form.get('phone') ?? '').trim(),
            date,
            time,
            notes: String(form.get('notes') ?? '').trim(),
        };
        if (!payload.name || !payload.email || !payload.date || !payload.time) return;
        const key = `luxury-appointment:${payload.productId || 'browse'}:${store.id}`;
        sessionStorage.setItem(key, JSON.stringify(payload));
        setDone(true);
    };

    const confirmationStatusRef = useRef<HTMLParagraphElement>(null);
    // Submitting unmounts the Review form (and its submit button), which would otherwise drop focus
    // to <body>. Move focus to the confirmation message so keyboard and screen-reader users land in
    // the new view (the message is also an aria-live region).
    useEffect(() => {
        if (done) confirmationStatusRef.current?.focus();
    }, [done]);

    const heading = (
        <h1 className="min-w-0 font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            {t('boutiquesPage.appointmentTitle')}
        </h1>
    );

    const chrome = (
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            {heading}
            <WizardStepper step={step} maxReached={maxReached} onGoTo={goTo} />
        </header>
    );

    const pieceLead = locked && step !== 'review' ? <PieceCard piece={locked} /> : null;

    if (done && store) {
        return (
            <div
                id="appointment"
                className="flex h-full min-h-0 flex-1 flex-col scroll-mt-[calc(var(--header-height,72px)+1.5rem)]"
                data-testid="boutique-appointment">
                <div className={boutiqueStageGrid}>
                    <div className={boutiqueStageLeft}>
                        <StoreStill store={store} />
                    </div>
                    <div className={`${boutiqueStageRight} justify-center`}>
                        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                            {heading}
                        </header>
                        <p
                            ref={confirmationStatusRef}
                            tabIndex={-1}
                            role="status"
                            data-testid="appointment-success"
                            className="mt-8 font-serif text-3xl outline-none">
                            {t('boutiquesPage.success', { salon: store.name })}
                            {selected ? (
                                <span className="mt-4 block font-sans text-base text-muted-foreground">
                                    {t('boutiquesPage.successProduct', { product: selected.name })}
                                </span>
                            ) : null}
                        </p>
                        <section
                            aria-labelledby="appointment-summary-heading"
                            className="mt-8"
                            data-testid="appointment-summary">
                            <h2 id="appointment-summary-heading" className="sr-only">
                                {t('boutiquesPage.stepReview')}
                            </h2>
                            <dl>
                                <ReviewDetail
                                    term={t('boutiquesPage.stepNavLocation')}
                                    title={store.name ?? store.id ?? ''}
                                    detail={addressLine(store)}
                                />
                                <ReviewDetail
                                    term={t('boutiquesPage.stepNavService')}
                                    title={
                                        selectedService
                                            ? t(selectedService.titleKey)
                                            : t('boutiquesPage.stepNavService')
                                    }
                                    detail={
                                        selectedService
                                            ? t('boutiquesPage.durationLine', { minutes: selectedService.minutes })
                                            : undefined
                                    }
                                />
                                <ReviewDetail
                                    term={t('boutiquesPage.stepNavWhen')}
                                    title={
                                        date ? formatReviewDate(date, i18n.language) : t('boutiquesPage.stepNavWhen')
                                    }
                                    detail={time || undefined}
                                />
                            </dl>
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    const stageRight = (
        <>
            {chrome}
            {pieceLead ? <div className="mt-8">{pieceLead}</div> : null}
            {step === 'service' ? (
                <fieldset className="mt-6 flex min-w-0 flex-col p-0">
                    <legend className="float-none mb-0 p-0 font-serif text-2xl">{t('boutiquesPage.stepReason')}</legend>
                    <div className="mt-5 grid grid-cols-1 gap-4 @3xl:grid-cols-2">
                        {SERVICES.map((entry) => (
                            <ServiceCard
                                key={entry.id}
                                selected={reason === entry.id}
                                title={t(entry.titleKey)}
                                details={t(entry.hintKey)}
                                minutes={entry.minutes}
                                image={entry.id === 'view' && locked?.image ? locked.image : entry.image}
                                onSelect={() => pickService(entry.id)}
                            />
                        ))}
                    </div>
                </fieldset>
            ) : null}

            {step === 'when' && store ? (
                <fieldset className="mt-6 flex min-w-0 flex-col gap-5 p-0">
                    <legend className="float-none mb-0 p-0 font-serif text-2xl">{t('boutiquesPage.stepWhen')}</legend>
                    <div className="grid gap-8 lg:grid-cols-[minmax(26rem,36rem)_minmax(10rem,14rem)] lg:items-start">
                        <MonthCalendar
                            locale={i18n.language}
                            minDate={minDate}
                            selected={date}
                            storeId={store.id ?? undefined}
                            onSelect={(iso) => {
                                setDate(iso);
                                setTime('');
                            }}
                        />
                        <div className="lg:border-l lg:border-border lg:pl-6">
                            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                {t('boutiquesPage.availableTimes')}
                            </p>
                            {!date ? (
                                <p className="mt-4 text-sm text-muted-foreground">{t('boutiquesPage.pickDateFirst')}</p>
                            ) : slots.length === 0 ? (
                                <p className="mt-4 text-sm text-muted-foreground">
                                    {t('boutiquesPage.noFilterMatches')}
                                </p>
                            ) : (
                                <ul className="mt-4 flex flex-col gap-2">
                                    {slots.map((slot) => (
                                        <li key={slot}>
                                            <Button
                                                type="button"
                                                variant={time === slot ? 'default' : 'outline'}
                                                className="h-auto w-full py-3"
                                                onClick={() => pickTime(slot)}
                                                aria-pressed={time === slot}>
                                                {slot}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </fieldset>
            ) : null}

            {step === 'review' && store ? (
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-8">
                    <div className="grid gap-8 @3xl:grid-cols-2 @3xl:items-start">
                        <div>
                            <h2 className="sr-only">{t('boutiquesPage.stepReview')}</h2>
                            <SummaryRow
                                title={store.name ?? store.id ?? ''}
                                detail={addressLine(store)}
                                onEdit={() => goTo('location')}
                            />
                            <SummaryRow
                                title={
                                    selectedService ? t(selectedService.titleKey) : t('boutiquesPage.stepNavService')
                                }
                                detail={
                                    selectedService
                                        ? t('boutiquesPage.durationLine', { minutes: selectedService.minutes })
                                        : undefined
                                }
                                onEdit={() => goTo('service')}
                            />
                            <SummaryRow
                                title={date ? formatReviewDate(date, i18n.language) : t('boutiquesPage.stepNavWhen')}
                                detail={time || undefined}
                                onEdit={() => goTo('when')}
                            />
                        </div>
                        {locked || effectiveCatalog.length > 0 ? (
                            <fieldset className="flex min-w-0 flex-col gap-3 p-0">
                                <legend className="float-none mb-0 p-0 font-serif text-xl">
                                    {t('boutiquesPage.appointmentProduct')}
                                </legend>
                                {locked ? (
                                    <PieceCard piece={locked} />
                                ) : (
                                    <>
                                        <SelectField>
                                            <NativeSelect
                                                id="appointment-product-picker"
                                                name="productPicker"
                                                value={pickedId}
                                                onChange={(event) => setPickedId(event.target.value)}
                                                aria-label={t('boutiquesPage.appointmentProductBrowse')}
                                                className="w-full">
                                                <NativeSelectOption value="">
                                                    {t('boutiquesPage.appointmentNone')}
                                                </NativeSelectOption>
                                                {effectiveCatalog.map((entry) => (
                                                    <NativeSelectOption key={entry.id} value={entry.id}>
                                                        {entry.name}
                                                        {entry.reference ? ` · ${entry.reference}` : ''}
                                                    </NativeSelectOption>
                                                ))}
                                            </NativeSelect>
                                        </SelectField>
                                        {selected ? <PieceCard piece={selected} /> : null}
                                    </>
                                )}
                            </fieldset>
                        ) : null}
                    </div>
                    <fieldset className="flex min-w-0 flex-col gap-3 p-0">
                        <legend className="float-none mb-0 p-0 font-serif text-xl">
                            {t('boutiquesPage.contactDetails')}
                        </legend>
                        <Field id="appointment-name" label={t('boutiquesPage.name')}>
                            <Input id="appointment-name" name="name" required autoComplete="name" />
                        </Field>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field id="appointment-email" label={t('boutiquesPage.email')}>
                                <Input id="appointment-email" name="email" type="email" required autoComplete="email" />
                            </Field>
                            <Field id="appointment-phone" label={t('boutiquesPage.phone')}>
                                <Input id="appointment-phone" name="phone" type="tel" autoComplete="tel" />
                            </Field>
                        </div>
                        <Field id="appointment-notes" label={t('boutiquesPage.notes')}>
                            <Textarea
                                id="appointment-notes"
                                name="notes"
                                rows={2}
                                placeholder={
                                    selected
                                        ? t('boutiquesPage.notesPlaceholder', { product: selected.name })
                                        : undefined
                                }
                            />
                        </Field>
                    </fieldset>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button type="button" variant="outline" onClick={goBack}>
                            {t('boutiquesPage.back')}
                        </Button>
                        <div className="flex flex-col items-end gap-1">
                            {!date || !time ? (
                                // Editing the date on the "when" step clears the time; a shopper can
                                // then jump back here via the stepper without re-picking one. Disable
                                // Submit and say why instead of silently no-oping on click.
                                <p
                                    id="appointment-confirm-hint"
                                    role="status"
                                    className="text-xs text-muted-foreground">
                                    {t('boutiquesPage.confirmNeedsTime')}
                                </p>
                            ) : null}
                            <Button
                                type="submit"
                                disabled={!date || !time}
                                aria-describedby={!date || !time ? 'appointment-confirm-hint' : undefined}>
                                {t('boutiquesPage.submit')}
                            </Button>
                        </div>
                    </div>
                </form>
            ) : null}

            {step !== 'review' && step !== 'location' ? (
                <div className="mt-8">
                    <Button type="button" variant="outline" onClick={goBack}>
                        {t('boutiquesPage.back')}
                    </Button>
                </div>
            ) : null}
        </>
    );

    return (
        <div
            id="appointment"
            data-testid="boutique-appointment"
            data-step={step}
            className="flex h-full min-h-0 flex-1 flex-col scroll-mt-[calc(var(--header-height,72px)+1.5rem)]">
            {step === 'location' ? (
                <BoutiqueDirectory
                    stores={stores}
                    selectedId={storeId}
                    onSelect={pickBoutique}
                    lead={pieceLead}
                    chrome={chrome}
                />
            ) : store ? (
                <div className={boutiqueStageGrid}>
                    <div className={boutiqueStageLeft}>
                        <StoreStill store={store} />
                    </div>
                    <div className={boutiqueStageRight}>{stageRight}</div>
                </div>
            ) : null}
        </div>
    );
}
