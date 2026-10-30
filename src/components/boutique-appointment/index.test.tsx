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
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import React, { useCallback, useState } from 'react';
import type { ShopperStores } from '@/scapi';
import type { AppointmentPiece } from '@/lib/appointment';
import BoutiqueAppointment from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

// useFetcher requires a data router context which is absent in unit tests.
// `mockUseFetcher` is a vi.fn() so individual tests can override the return value.
// The default (set in beforeEach) simulates an idle fetcher that has never loaded —
// tests drive availability via the `availability` prop (the prop-fallback path).
const mockUseFetcher = vi.hoisted(() => vi.fn());

vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router')>();
    return {
        ...actual,
        useFetcher: mockUseFetcher,
    };
});

const mockStores: ShopperStores.schemas['Store'][] = [
    {
        id: 'ln-boutique-geneva',
        name: 'Geneva Boutique',
        address1: '12 Quai des Bergues',
        city: 'Geneva',
        stateCode: 'GE',
        postalCode: '1201',
        countryCode: 'CH',
        phone: '+41 22 000 00 00',
        latitude: 46.207,
        longitude: 6.148,
        inventoryId: 'inventory-ln-boutique-geneva',
        storeHours: 'Tue–Sat 10:00–18:00',
        image: '/images/salons/geneva.webp',
    },
    {
        id: 'ln-boutique-london',
        name: 'London Boutique',
        address1: '18 Mount Street',
        city: 'London',
        stateCode: 'ENG',
        postalCode: 'W1K 2RH',
        countryCode: 'GB',
        phone: '+44 20 0000 0000',
        latitude: 51.5104,
        longitude: -0.1508,
        inventoryId: 'inventory-ln-boutique-london',
        storeHours: 'Mon–Sat 10:00–18:00',
        image: '/images/salons/london.webp',
    },
    {
        id: 'ln-boutique-paris',
        name: 'Paris Boutique',
        address1: '8 Rue de la Paix',
        city: 'Paris',
        stateCode: 'IDF',
        postalCode: '75002',
        countryCode: 'FR',
        phone: '+33 1 00 00 00 00',
        latitude: 48.8686,
        longitude: 2.331,
        inventoryId: 'inventory-ln-boutique-paris',
        storeHours: 'Tue–Sat 10:00–19:00',
        image: '/images/salons/paris.webp',
    },
];

// Always-future availability: 14 days from now at fixed local hours so the slots
// always clear the 120-minute advance-notice filter regardless of when the tests run.
// slotDateKey and slotTimeLabel use local time, so constructing with explicit hour
// components keeps assertions timezone-safe.
const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
const slotDay = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate());
const mockAvailability = [
    {
        startTime: new Date(slotDay.getFullYear(), slotDay.getMonth(), slotDay.getDate(), 10, 0, 0, 0).toISOString(),
        endTime: new Date(slotDay.getFullYear(), slotDay.getMonth(), slotDay.getDate(), 10, 30, 0, 0).toISOString(),
    },
    {
        startTime: new Date(slotDay.getFullYear(), slotDay.getMonth(), slotDay.getDate(), 12, 0, 0, 0).toISOString(),
        endTime: new Date(slotDay.getFullYear(), slotDay.getMonth(), slotDay.getDate(), 12, 30, 0, 0).toISOString(),
    },
    {
        startTime: new Date(slotDay.getFullYear(), slotDay.getMonth(), slotDay.getDate(), 14, 0, 0, 0).toISOString(),
        endTime: new Date(slotDay.getFullYear(), slotDay.getMonth(), slotDay.getDate(), 14, 30, 0, 0).toISOString(),
    },
    {
        startTime: new Date(slotDay.getFullYear(), slotDay.getMonth(), slotDay.getDate(), 16, 0, 0, 0).toISOString(),
        endTime: new Date(slotDay.getFullYear(), slotDay.getMonth(), slotDay.getDate(), 16, 30, 0, 0).toISOString(),
    },
];
const slotDayIso = `${slotDay.getFullYear()}-${String(slotDay.getMonth() + 1).padStart(2, '0')}-${String(slotDay.getDate()).padStart(2, '0')}`;

const mockCatalog: AppointmentPiece[] = [
    {
        id: 'ln-heritage-001',
        name: 'The Classic Automatic',
        reference: 'LN-HER-001-SS-LB-BK',
        image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-heritage-001.webp',
        collection: 'Heritage',
    },
    {
        id: 'ln-sport-003',
        name: 'The Sport Diver',
        reference: 'LN-SPO-003-SS-BR-BL',
        image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-sport-003.webp',
        collection: 'Sport',
    },
];

/**
 * Controlled wrapper that simulates the page's useFetcher bookingResult state in tests.
 * When `initialBookingResult` is provided, calling `onBook` immediately sets `bookingResult`
 * to that value (synchronously in state, triggering the component's useEffect).
 */
function ControlledAppointment({
    onBookSpy,
    initialBookingResult,
    ...props
}: React.ComponentProps<typeof BoutiqueAppointment> & {
    onBookSpy?: (formData: FormData) => void;
    initialBookingResult?: { success: boolean; serviceAppointmentId?: string; error?: string };
}) {
    const [bookingResult, setBookingResult] = useState<
        { success: boolean; serviceAppointmentId?: string; error?: string } | undefined
    >(undefined);
    const onBook = useCallback(
        (fd: FormData) => {
            onBookSpy?.(fd);
            if (initialBookingResult !== undefined) setBookingResult(initialBookingResult);
        },
        [onBookSpy, initialBookingResult]
    );
    return <BoutiqueAppointment {...props} onBook={onBook} bookingResult={bookingResult} />;
}

function renderAppointment(productId?: string, availability = mockAvailability) {
    const piece = productId ? mockCatalog.find((p) => p.id === productId) : null;
    return render(
        <AllProvidersWrapper>
            <ControlledAppointment
                stores={mockStores}
                catalog={mockCatalog}
                availability={availability}
                initialBookingResult={{ success: true, serviceAppointmentId: 'SA-test' }}
                {...(productId ? { productId, piece: piece ?? null } : {})}
            />
        </AllProvidersWrapper>
    );
}

async function pickGeneva(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /geneva boutique/i }));
}

async function pickFirstSlot(user: ReturnType<typeof userEvent.setup>) {
    // Slots are always 14 days out (slotDayIso). Navigate forward until the enabled day appears.
    for (let i = 0; i < 3 && screen.queryAllByTestId('appointment-day').length === 0; i++) {
        await user.click(screen.getByRole('button', { name: /next month/i }));
    }
    const availableDays = screen.getAllByTestId('appointment-day');
    const dayButton = availableDays.find((btn) => btn.getAttribute('data-date') === slotDayIso);
    await user.click(dayButton ?? availableDays[0]);
    await user.click(screen.getByRole('button', { name: '10:00' }));
}

async function advanceToReview(user: ReturnType<typeof userEvent.setup>) {
    await pickGeneva(user);
    await user.click(screen.getByRole('button', { name: /see a timepiece/i }));
    await pickFirstSlot(user);
}

describe('BoutiqueAppointment', () => {
    beforeEach(() => {
        // Default: idle fetcher that has never run — availability is driven by the `availability` prop.
        mockUseFetcher.mockReturnValue({
            load: vi.fn(),
            state: 'idle' as const,
            data: undefined,
        });
    });

    test('starts on location with the map and boutique list', () => {
        renderAppointment('ln-heritage-001');
        const directory = screen.getByTestId('boutique-directory');
        expect(screen.getByTestId('boutique-map')).toBeInTheDocument();
        const heading = within(directory).getByRole('heading', { name: /book an appointment/i });
        const stepper = within(directory).getByTestId('appointment-stepper');
        expect(heading).toBeInTheDocument();
        expect(stepper).toBeInTheDocument();
        expect(heading.parentElement).toBe(stepper.closest('header'));
        const card = screen.getByTestId('appointment-product');
        expect(within(card).getByText(/the classic automatic/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^continue$/i })).not.toBeInTheDocument();
    });

    test('choosing a boutique opens service cards with images and duration', async () => {
        const user = userEvent.setup();
        renderAppointment();
        await pickGeneva(user);
        expect(screen.getByTestId('appointment-store-still')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /book an appointment/i })).toBeInTheDocument();
        expect(screen.getByTestId('appointment-stepper')).toBeInTheDocument();
        expect(screen.queryByTestId('boutique-directory')).not.toBeInTheDocument();
        expect(screen.getByRole('group', { name: /why are you visiting/i })).toBeInTheDocument();
        expect(screen.getAllByTestId('appointment-service')).toHaveLength(6);
        expect(screen.getByText(/try a piece on the wrist/i)).toBeVisible();
        expect(screen.getByRole('button', { name: /strap and bracelet/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /watch servicing/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /collect a serviced piece/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /personal shopping/i })).toBeInTheDocument();
        expect(screen.getAllByText(/duration · 30 min/i).length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText(/duration · 15 min/i).length).toBeGreaterThanOrEqual(2);
        expect(screen.queryByRole('button', { name: /show details/i })).not.toBeInTheDocument();
    });

    test('lets a visitor pick a timepiece on review when none arrived on the URL', async () => {
        const user = userEvent.setup();
        renderAppointment();
        expect(screen.queryByTestId('appointment-product')).not.toBeInTheDocument();
        await advanceToReview(user);
        expect(screen.queryByTestId('appointment-product')).not.toBeInTheDocument();
        await user.selectOptions(screen.getByLabelText(/choose a timepiece/i), 'ln-heritage-001');
        const card = screen.getByTestId('appointment-product');
        expect(within(card).getByText(/the classic automatic/i)).toBeInTheDocument();
        expect(within(card).getByRole('img', { name: /the classic automatic/i })).toBeInTheDocument();
    });

    test('stores the named piece with the appointment request', async () => {
        const user = userEvent.setup();
        const onBook = vi.fn();
        render(
            <AllProvidersWrapper>
                <ControlledAppointment
                    stores={mockStores}
                    catalog={mockCatalog}
                    availability={mockAvailability}
                    productId="ln-heritage-001"
                    piece={mockCatalog.find((p) => p.id === 'ln-heritage-001') ?? null}
                    onBookSpy={onBook}
                    initialBookingResult={{ success: true, serviceAppointmentId: 'SA-test' }}
                />
            </AllProvidersWrapper>
        );
        await advanceToReview(user);
        await user.type(screen.getByLabelText(/^name$/i), 'Ada Lovelace');
        await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
        await user.click(screen.getByRole('button', { name: /request appointment/i }));
        expect(screen.getByTestId('appointment-success')).toHaveTextContent(/the classic automatic/i);
        // Verify the piece and slot details are forwarded to the booking callback via FormData.
        expect(onBook).toHaveBeenCalledWith(expect.any(FormData));
        const formData = onBook.mock.calls[0][0] as FormData;
        expect(formData.get('schedStartTime')).toBe(mockAvailability[0].startTime);
        expect(formData.get('schedEndTime')).toBe(mockAvailability[0].endTime);
        expect(formData.get('email')).toBe('ada@example.com');
        expect(String(formData.get('subject'))).toContain('The Classic Automatic');
    });

    test('choose a time shows a month calendar and a list of times', async () => {
        const user = userEvent.setup();
        renderAppointment();
        await pickGeneva(user);
        await user.click(screen.getByRole('button', { name: /see a timepiece/i }));
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
        expect(screen.getByText(/choose a date to see times/i)).toBeInTheDocument();
        if (screen.queryAllByTestId('appointment-day').length === 0) {
            await user.click(screen.getByRole('button', { name: /next month/i }));
        }
        const days = screen.getAllByTestId('appointment-day');
        const dayButton = days.find((btn) => btn.getAttribute('data-date') === slotDayIso);
        await user.click(dayButton ?? days[0]);
        expect(screen.getByRole('button', { name: '10:00' })).toBeInTheDocument();
        expect(screen.queryByText(/choose a date to see times/i)).not.toBeInTheDocument();
    });

    test('stepper goes back to a completed step', async () => {
        const user = userEvent.setup();
        renderAppointment();
        await pickGeneva(user);
        expect(screen.getByRole('group', { name: /why are you visiting/i })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /^location$/i }));
        expect(screen.getByTestId('boutique-directory')).toBeInTheDocument();
    });

    test('review edit returns to the chosen step', async () => {
        const user = userEvent.setup();
        renderAppointment();
        await advanceToReview(user);
        await user.click(screen.getByRole('button', { name: /edit geneva boutique/i }));
        expect(screen.getByTestId('boutique-directory')).toBeInTheDocument();
    });

    test('disables Submit with a reason when the time was cleared before Review', async () => {
        const user = userEvent.setup();
        renderAppointment('ln-heritage-001');
        await advanceToReview(user);
        // A full selection lets the request go through.
        expect(screen.getByRole('button', { name: /request appointment/i })).toBeEnabled();

        // Edit the date on the "when" step — picking a day clears the time — then jump straight
        // back to Review via the stepper without choosing a new time.
        await user.click(screen.getByRole('button', { name: /^time$/i }));
        await user.click(screen.getAllByTestId('appointment-day')[0]);
        await user.click(screen.getByRole('button', { name: /^review$/i }));

        // No longer a silent no-op: Submit is disabled and says why.
        expect(screen.getByRole('button', { name: /request appointment/i })).toBeDisabled();
        expect(screen.getByText(/select a date and time to confirm/i)).toBeInTheDocument();
    });

    test('confirmation echoes the booked details read-only and hides the step controls', async () => {
        const user = userEvent.setup();
        renderAppointment('ln-heritage-001');
        await advanceToReview(user);
        await user.type(screen.getByLabelText(/^name$/i), 'Ada Lovelace');
        await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
        await user.click(screen.getByRole('button', { name: /request appointment/i }));

        // The confirmation screen is shown.
        expect(screen.getByTestId('appointment-success')).toBeInTheDocument();

        // The booked boutique, service, and time are echoed back from the Review step.
        const summary = screen.getByTestId('appointment-summary');
        expect(within(summary).getByText(/geneva boutique/i)).toBeInTheDocument();
        expect(within(summary).getByText(/12 Quai des Bergues/i)).toBeInTheDocument();
        expect(within(summary).getByText(/see a timepiece/i)).toBeInTheDocument();
        expect(within(summary).getByText(/duration · 30 min/i)).toBeInTheDocument();
        // The date row shows the formatted date (a full year), not the fallback i18n key.
        expect(within(summary).getByText(/\b20\d{2}\b/)).toBeInTheDocument();
        expect(within(summary).getByText('10:00')).toBeInTheDocument();

        // The 1-4 step controls are gone and the details are read-only (no Edit).
        expect(screen.queryByTestId('appointment-stepper')).not.toBeInTheDocument();
        expect(within(summary).queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    test('real availability slots render as calendar days and time buttons', async () => {
        const user = userEvent.setup();
        // Near-future weekday: pick a date 5 days from now (likely to be a weekday).
        const now = new Date();
        const target = new Date(now);
        target.setDate(target.getDate() + 5);
        const startTime1 = new Date(target);
        startTime1.setHours(10, 0, 0, 0);
        const endTime1 = new Date(startTime1);
        endTime1.setHours(10, 30, 0, 0);
        const startTime2 = new Date(target);
        startTime2.setHours(14, 0, 0, 0);
        const endTime2 = new Date(startTime2);
        endTime2.setHours(14, 30, 0, 0);

        render(
            <AllProvidersWrapper>
                <BoutiqueAppointment
                    stores={mockStores}
                    catalog={mockCatalog}
                    availability={[
                        { startTime: startTime1.toISOString(), endTime: endTime1.toISOString() },
                        { startTime: startTime2.toISOString(), endTime: endTime2.toISOString() },
                    ]}
                />
            </AllProvidersWrapper>
        );

        await pickGeneva(user);
        await user.click(screen.getByRole('button', { name: /see a timepiece/i }));

        // The target date may be in the next calendar month; navigate if no days are visible yet.
        if (screen.queryAllByTestId('appointment-day').length === 0) {
            await user.click(screen.getByRole('button', { name: /next month/i }));
        }

        // The target date should be clickable (has slots).
        const targetDateKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
        const availableDays = screen.getAllByTestId('appointment-day');
        const dayButton = availableDays.find((btn) => btn.getAttribute('data-date') === targetDateKey);
        expect(dayButton).toBeDefined();
        expect(dayButton).toBeEnabled();

        if (dayButton) await user.click(dayButton);

        // The derived time labels should appear as buttons.
        expect(screen.getByRole('button', { name: '10:00' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '14:00' })).toBeInTheDocument();
    });

    test('onBook callback is called with ISO slot bounds and email on submit', async () => {
        const user = userEvent.setup();
        const onBook = vi.fn();

        const now = new Date();
        const target = new Date(now);
        target.setDate(target.getDate() + 5);
        const startTime = new Date(target);
        startTime.setHours(10, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(10, 30, 0, 0);

        render(
            <AllProvidersWrapper>
                <ControlledAppointment
                    stores={mockStores}
                    catalog={mockCatalog}
                    availability={[{ startTime: startTime.toISOString(), endTime: endTime.toISOString() }]}
                    onBookSpy={onBook}
                    initialBookingResult={{ success: true, serviceAppointmentId: 'SA-test' }}
                />
            </AllProvidersWrapper>
        );

        await pickGeneva(user);
        await user.click(screen.getByRole('button', { name: /see a timepiece/i }));

        // The target date may be in the next calendar month; navigate if no days are visible yet.
        if (screen.queryAllByTestId('appointment-day').length === 0) {
            await user.click(screen.getByRole('button', { name: /next month/i }));
        }

        const targetDateKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
        const availableDays = screen.getAllByTestId('appointment-day');
        const dayButton = availableDays.find((btn) => btn.getAttribute('data-date') === targetDateKey);
        if (dayButton) await user.click(dayButton);
        await user.click(screen.getByRole('button', { name: '10:00' }));

        await user.type(screen.getByLabelText(/^name$/i), 'Ada Lovelace');
        await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
        await user.click(screen.getByRole('button', { name: /request appointment/i }));

        // onBook is called with FormData; verify the booking-critical fields.
        expect(onBook).toHaveBeenCalledWith(expect.any(FormData));
        const formData = onBook.mock.calls[0][0] as FormData;
        expect(formData.get('schedStartTime')).toBe(startTime.toISOString());
        expect(formData.get('schedEndTime')).toBe(endTime.toISOString());
        expect(formData.get('email')).toBe('ada@example.com');
        // Service name is 'See a timepiece' for the 'view' service id
        expect(String(formData.get('subject'))).toContain('See a timepiece');

        expect(screen.getByTestId('appointment-success')).toBeInTheDocument();
    });

    test('shows unavailable message when availability fetch returns success:false', async () => {
        // Simulate the server responding with feature-flag off (or any error path that sets
        // success:false). The component renders the "boutiquesPage.appointmentUnavailable" notice
        // and the boutique phone number instead of the calendar.
        mockUseFetcher.mockReturnValue({
            load: vi.fn(),
            state: 'idle' as const,
            data: { success: false, error: 'Appointment booking is not enabled' },
        });

        const user = userEvent.setup();
        renderAppointment();

        // Navigate to the 'when' step: pick a boutique then pick a service.
        await pickGeneva(user);
        await user.click(screen.getByRole('button', { name: /see a timepiece/i }));

        // The unavailable notice should appear.
        expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();

        // The boutique phone number should appear so the shopper can call directly.
        // The phone renders in both the side-panel (StoreStill) and the notice; assert at least one.
        expect(screen.getAllByText('+41 22 000 00 00').length).toBeGreaterThan(0);

        // The calendar (day-picker buttons) must NOT be rendered.
        expect(screen.queryAllByTestId('appointment-day')).toHaveLength(0);
    });

    test('onBook error renders the booking error message', async () => {
        const user = userEvent.setup();

        const now = new Date();
        const target = new Date(now);
        target.setDate(target.getDate() + 5);
        const startTime = new Date(target);
        startTime.setHours(10, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(10, 30, 0, 0);

        render(
            <AllProvidersWrapper>
                <ControlledAppointment
                    stores={mockStores}
                    catalog={mockCatalog}
                    availability={[{ startTime: startTime.toISOString(), endTime: endTime.toISOString() }]}
                    initialBookingResult={{ success: false, error: 'Appointment slot no longer available' }}
                />
            </AllProvidersWrapper>
        );

        await pickGeneva(user);
        await user.click(screen.getByRole('button', { name: /see a timepiece/i }));

        // The target date may be in the next calendar month; navigate if no days are visible yet.
        if (screen.queryAllByTestId('appointment-day').length === 0) {
            await user.click(screen.getByRole('button', { name: /next month/i }));
        }

        const targetDateKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
        const availableDays = screen.getAllByTestId('appointment-day');
        const dayButton = availableDays.find((btn) => btn.getAttribute('data-date') === targetDateKey);
        if (dayButton) await user.click(dayButton);
        await user.click(screen.getByRole('button', { name: '10:00' }));

        await user.type(screen.getByLabelText(/^name$/i), 'Ada Lovelace');
        await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
        await user.click(screen.getByRole('button', { name: /request appointment/i }));

        const errorMessage = screen.getByTestId('appointment-booking-error');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('Appointment slot no longer available');

        expect(screen.queryByTestId('appointment-success')).not.toBeInTheDocument();
    });
});
