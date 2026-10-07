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
import { describe, expect, test } from 'vitest';
import type { ShopperStores } from '@/scapi';
import type { AppointmentPiece } from '@/lib/appointment';
import BoutiqueAppointment from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

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

function renderAppointment(productId?: string) {
    const piece = productId ? mockCatalog.find((p) => p.id === productId) : null;
    return render(
        <AllProvidersWrapper>
            <BoutiqueAppointment
                stores={mockStores}
                productId={productId}
                piece={piece ?? null}
                catalog={mockCatalog}
            />
        </AllProvidersWrapper>
    );
}

async function pickGeneva(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /geneva boutique/i }));
}

async function pickFirstSlot(user: ReturnType<typeof userEvent.setup>) {
    if (screen.queryAllByTestId('appointment-day').length === 0) {
        await user.click(screen.getByRole('button', { name: /next month/i }));
    }
    await user.click(screen.getAllByTestId('appointment-day')[0]);
    await user.click(screen.getByRole('button', { name: '10:00' }));
}

async function advanceToReview(user: ReturnType<typeof userEvent.setup>) {
    await pickGeneva(user);
    await user.click(screen.getByRole('button', { name: /see a timepiece/i }));
    await pickFirstSlot(user);
}

describe('BoutiqueAppointment', () => {
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
        renderAppointment('ln-heritage-001');
        await advanceToReview(user);
        await user.type(screen.getByLabelText(/^name$/i), 'Ada Lovelace');
        await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
        await user.click(screen.getByRole('button', { name: /request appointment/i }));
        expect(screen.getByTestId('appointment-success')).toHaveTextContent(/the classic automatic/i);
        const stored = JSON.parse(
            sessionStorage.getItem('luxury-appointment:ln-heritage-001:ln-boutique-geneva') ?? '{}'
        ) as Record<string, string>;
        expect(stored.productId).toBe('ln-heritage-001');
        expect(stored.productName).toBe('The Classic Automatic');
        expect(stored.productReference).toBe('LN-HER-001-SS-LB-BK');
        expect(stored.reason).toBe('view');
        expect(stored.workType).toBe('private');
        expect(stored.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(stored.time).toBe('10:00');
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
        await user.click(screen.getAllByTestId('appointment-day')[0]);
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
});
