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
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import type { ShopperStores } from '@/scapi';
import type { AppointmentPiece } from '@/lib/appointment';
import BoutiqueAppointment from '../index';

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

const mockPiece: AppointmentPiece = {
    id: 'ln-heritage-001',
    name: 'The Classic Automatic',
    reference: 'REF-001',
    image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-heritage-001.webp',
    collection: 'Heritage',
};

const meta: Meta<typeof BoutiqueAppointment> = {
    title: 'Layout/Store Locator/Boutique Appointment',
    component: BoutiqueAppointment,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof BoutiqueAppointment>;

export const FromPdp: Story = {
    args: {
        stores: mockStores,
        piece: mockPiece,
        productId: mockPiece.id,
        productName: mockPiece.name,
        catalog: [],
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('appointment-product')).toBeVisible();
        await expect(canvas.getByText(/the classic automatic/i)).toBeVisible();
        await expect(canvas.getByTestId('boutique-directory')).toBeVisible();
        await expect(
            within(canvas.getByTestId('boutique-directory')).getByRole('heading', { name: /book an appointment/i })
        ).toBeVisible();
        await expect(canvas.queryByLabelText(/choose a timepiece/i)).toBeNull();
    },
};

export const Browse: Story = {
    args: {
        stores: mockStores,
        catalog: [
            { id: 'ln-heritage-001', name: 'The Classic Automatic', reference: 'REF-001' },
            { id: 'ln-sport-003', name: 'The Sport Diver', reference: 'REF-003' },
        ],
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.queryByTestId('appointment-product')).toBeNull();
        await expect(canvas.getByTestId('boutique-directory')).toBeVisible();
        await expect(
            within(canvas.getByTestId('boutique-directory')).getByRole('heading', { name: /book an appointment/i })
        ).toBeVisible();
    },
};

// Drives the full wizard to the confirmation screen to cover the post-submit state:
// the booked boutique / service / date-time are echoed back read-only and the 1-4 step
// controls are gone. `snapshot: false` keeps this out of the snapshot suite — composeStories
// renders the initial (location) step, so a snapshot here would add no value; the booking
// flow is instead exercised by the interaction + a11y runs.
export const Confirmed: Story = {
    parameters: { snapshot: false },
    args: {
        stores: mockStores,
        piece: mockPiece,
        productId: mockPiece.id,
        productName: mockPiece.name,
        catalog: [],
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        // 1. Location -> 2. Service -> 3. Time -> 4. Review -> submit.
        await userEvent.click(await canvas.findByRole('button', { name: /geneva boutique/i }));
        await userEvent.click(await canvas.findByRole('button', { name: /see a timepiece/i }));
        if (canvas.queryAllByTestId('appointment-day').length === 0) {
            await userEvent.click(canvas.getByRole('button', { name: /next month/i }));
        }
        await userEvent.click((await canvas.findAllByTestId('appointment-day'))[0]);
        await userEvent.click(await canvas.findByRole('button', { name: '10:00' }));
        await userEvent.type(canvas.getByLabelText(/^name$/i), 'Ada Lovelace');
        await userEvent.type(canvas.getByLabelText(/^email$/i), 'ada@example.com');
        await userEvent.click(canvas.getByRole('button', { name: /request appointment/i }));

        // Confirmation echoes the booked details read-only, with no step controls.
        await expect(await canvas.findByTestId('appointment-success')).toBeVisible();
        const summary = await canvas.findByTestId('appointment-summary');
        await expect(within(summary).getByText(/geneva boutique/i)).toBeVisible();
        await expect(within(summary).getByText(/12 Quai des Bergues/i)).toBeVisible();
        await expect(within(summary).getByText(/see a timepiece/i)).toBeVisible();
        await expect(within(summary).getByText(/duration · 30 min/i)).toBeVisible();
        await expect(within(summary).getByText('10:00')).toBeVisible();
        await expect(canvas.queryByTestId('appointment-stepper')).toBeNull();
        await expect(within(summary).queryByRole('button', { name: /edit/i })).toBeNull();
    },
};
