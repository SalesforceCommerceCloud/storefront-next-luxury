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
import { useState, type ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import type { ShopperStores } from '@/scapi';
import BoutiqueDirectory, { boutiqueStageGrid, boutiqueStageLeft, boutiqueStageRight } from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

const stores: ShopperStores.schemas['Store'][] = [
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
        id: 'ln-boutique-newyork',
        name: 'New York Boutique',
        address1: '655 Madison Avenue',
        city: 'New York',
        stateCode: 'NY',
        postalCode: '10065',
        countryCode: 'US',
        phone: '+1 212 000 0000',
        latitude: 40.7648,
        longitude: -73.9707,
        inventoryId: 'inventory-ln-boutique-newyork',
        storeHours: 'Mon–Sat 10:00–18:00',
        image: '/images/salons/newyork.webp',
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
    {
        id: 'ln-boutique-tokyo',
        name: 'Tokyo Boutique',
        address1: '4-6-16 Ginza',
        city: 'Tokyo',
        stateCode: 'TYO',
        postalCode: '104-0061',
        countryCode: 'JP',
        phone: '+81 3 0000 0000',
        latitude: 35.6712,
        longitude: 139.7649,
        inventoryId: 'inventory-ln-boutique-tokyo',
        storeHours: 'Wed–Mon 11:00–19:00',
        image: '/images/salons/tokyo.webp',
    },
];

function DirectoryHarness({ onSelect = vi.fn() }: { onSelect?: (id: string) => void }): ReactElement {
    const [selectedId, setSelectedId] = useState(stores[0]?.id ?? '');
    return (
        <AllProvidersWrapper>
            <BoutiqueDirectory
                stores={stores}
                selectedId={selectedId}
                onSelect={(id) => {
                    setSelectedId(id);
                    onSelect(id);
                }}
            />
        </AllProvidersWrapper>
    );
}

describe('BoutiqueDirectory', () => {
    test('gives the boutique list more width than the map', () => {
        expect(boutiqueStageGrid).toContain('lg:grid-cols-[minmax(18rem,32rem)_minmax(0,1fr)]');
        expect(boutiqueStageGrid).toContain('h-full');
        expect(boutiqueStageLeft).not.toContain('100dvh');
        expect(boutiqueStageRight).toContain('lg:overflow-y-auto');
        expect(boutiqueStageRight).not.toContain('100dvh');
    });

    test('lists each boutique with city and address', () => {
        render(<DirectoryHarness />);
        expect(screen.getByRole('button', { name: /geneva boutique/i })).toBeInTheDocument();
        expect(screen.getByText(/12 quai des bergues/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /tokyo boutique/i })).toBeInTheDocument();
        expect(screen.getAllByTestId('boutique-facade')).toHaveLength(stores.length);
        expect(screen.getByTestId('boutique-map')).toHaveAttribute('data-latitude', '46.207');
        expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/zip or postal code/i)).toBeInTheDocument();
    });

    test('choosing a boutique notifies with the boutique id', async () => {
        const onSelect = vi.fn();
        const user = userEvent.setup();
        render(<DirectoryHarness onSelect={onSelect} />);
        const parisCard = screen.getByRole('button', { name: /paris boutique/i }).closest('li');
        expect(parisCard).toBeTruthy();
        await user.click(within(parisCard as HTMLElement).getByRole('button', { name: /paris boutique/i }));
        expect(onSelect).toHaveBeenCalledWith('ln-boutique-paris');
    });

    test('country filter narrows the list', async () => {
        const user = userEvent.setup();
        render(<DirectoryHarness />);
        await user.selectOptions(screen.getByLabelText(/country/i), 'US');
        expect(screen.getByRole('button', { name: /new york boutique/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /geneva boutique/i })).not.toBeInTheDocument();
        expect(screen.getAllByTestId('boutique-facade')).toHaveLength(1);
        expect(screen.getByTestId('boutique-map')).toHaveAttribute('data-latitude', '40.7648');
    });

    test('postal filter matches a boutique', async () => {
        const user = userEvent.setup();
        render(<DirectoryHarness />);
        await user.type(screen.getByLabelText(/zip or postal code/i), '1201');
        expect(screen.getByRole('button', { name: /geneva boutique/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /london boutique/i })).not.toBeInTheDocument();
    });

    test('selecting a boutique focuses the map', async () => {
        const user = userEvent.setup();
        render(<DirectoryHarness />);
        await user.click(screen.getByRole('button', { name: /london boutique/i }));
        expect(screen.getByTestId('boutique-map')).toHaveAttribute('data-latitude', '51.5104');
        expect(screen.getByRole('button', { name: /london boutique/i })).toHaveAttribute('aria-pressed', 'true');
    });
});
