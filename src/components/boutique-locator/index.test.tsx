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
import { MemoryRouter } from 'react-router';
import type { ShopperStores } from '@/scapi';
import BoutiqueLocator from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import { createMockLuxuryWatch, createMockAppointmentPiece } from '../../test-support/mock-watch';

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

const mockWatch = createMockLuxuryWatch();
const mockPiece = createMockAppointmentPiece(mockWatch);
const mockCatalog = [mockPiece];

function renderLocator(productName?: string) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>
                <BoutiqueLocator
                    stores={mockStores}
                    productId={productName ? 'ln-heritage-001' : undefined}
                    productName={productName}
                    piece={productName ? mockPiece : undefined}
                    catalog={mockCatalog}
                />
            </AllProvidersWrapper>
        </MemoryRouter>
    );
}

async function pickFirstSlot(user: ReturnType<typeof userEvent.setup>) {
    if (screen.queryAllByTestId('appointment-day').length === 0) {
        await user.click(screen.getByRole('button', { name: /next month/i }));
    }
    await user.click(screen.getAllByTestId('appointment-day')[0]);
    await user.click(screen.getByRole('button', { name: '10:00' }));
}

async function advanceToReview(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /geneva boutique/i }));
    await user.click(screen.getByRole('button', { name: /see a timepiece/i }));
    await pickFirstSlot(user);
}

describe('BoutiqueLocator', () => {
    test('opens as one booking flow with location first', () => {
        renderLocator('The Classic Automatic');
        expect(screen.getByTestId('boutique-locator')).toBeInTheDocument();
        expect(screen.getByTestId('boutique-appointment')).toBeInTheDocument();
        expect(screen.getByTestId('boutique-directory')).toBeInTheDocument();
        expect(screen.getByTestId('boutique-map')).toBeInTheDocument();
        expect(
            within(screen.getByTestId('boutique-directory')).getByRole('heading', { name: /book an appointment/i })
        ).toBeInTheDocument();
        expect(screen.getAllByTestId('boutique-facade')).toHaveLength(mockStores.length);
        expect(screen.queryByRole('button', { name: /^continue$/i })).not.toBeInTheDocument();
    });

    test('choosing a boutique continues to service without continue', async () => {
        const user = userEvent.setup();
        renderLocator('The Classic Automatic');
        await user.click(screen.getByRole('button', { name: /geneva boutique/i }));
        expect(screen.getByTestId('appointment-store-still')).toBeInTheDocument();
        expect(screen.getByText(/the classic automatic/i)).toBeInTheDocument();
        expect(screen.getByRole('group', { name: /why are you visiting/i })).toBeInTheDocument();
        expect(screen.queryByTestId('boutique-directory')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^continue$/i })).not.toBeInTheDocument();
    });

    test('stepper returns to the boutique list', async () => {
        const user = userEvent.setup();
        renderLocator();
        await user.click(screen.getByRole('button', { name: /geneva boutique/i }));
        await user.click(screen.getByRole('button', { name: /^location$/i }));
        expect(screen.getByTestId('boutique-directory')).toBeInTheDocument();
    });

    test('submitting an appointment stores the request', async () => {
        const user = userEvent.setup();
        renderLocator('The Classic Automatic');
        await advanceToReview(user);
        await user.type(screen.getByLabelText(/^name$/i), 'Ada Lovelace');
        await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
        await user.click(screen.getByRole('button', { name: /request appointment/i }));
        expect(screen.getByTestId('appointment-success')).toBeInTheDocument();
        const stored = sessionStorage.getItem('luxury-appointment:ln-heritage-001:ln-boutique-geneva');
        expect(stored).toContain('Ada Lovelace');
        expect(stored).toContain('The Classic Automatic');
        expect(stored).toContain('LN-HER-001-SS-LB-BK');
        expect(stored).toContain('"reason":"view"');
        expect(stored).toContain('"workType":"private"');
    });
});
