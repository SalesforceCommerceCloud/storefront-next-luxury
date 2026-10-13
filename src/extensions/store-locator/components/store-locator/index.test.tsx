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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { ReactElement } from 'react';
import type { ShopperStores } from '@/scapi';
import { ConfigProvider } from '@salesforce/storefront-next-runtime/config';
import { SiteProvider } from '@salesforce/storefront-next-runtime/site-context';
import { mockAltSiteObject, mockConfig } from '@/test-utils/config';
import StoreLocatorProvider, { useStoreLocator } from '@/extensions/store-locator/providers/store-locator';

const stores: ShopperStores.schemas['Store'][] = [
    { id: 'ln-boutique-geneva', name: 'Geneva Boutique', city: 'Geneva', countryCode: 'CH', inventoryId: 'inv-geneva' },
    { id: 'ln-boutique-london', name: 'London Boutique', city: 'London', countryCode: 'GB', inventoryId: 'inv-london' },
    {
        id: 'ln-boutique-newyork',
        name: 'New York Boutique',
        city: 'New York',
        countryCode: 'US',
        inventoryId: 'inv-ny',
    },
];

const availability = {
    'ln-boutique-geneva': { inStock: true },
    'ln-boutique-london': { inStock: false },
    'ln-boutique-newyork': { inStock: true },
};

// The sheet body seeds the branded picker from this hook; drive it directly here.
vi.mock('../../hooks/use-boutique-list', () => ({
    useBoutiqueList: () => ({ stores, availability, isLoading: false, hasError: false }),
}));

import StoreLocator from './index';

// Surfaces the provider's selected store so the test can assert the selection wiring.
function SelectionProbe(): ReactElement {
    const selected = useStoreLocator((s) => s.selectedStoreInfo);
    return <div data-testid="selected-store">{selected?.id ?? 'none'}</div>;
}

const locale =
    mockAltSiteObject.supportedLocales.find((l) => l.id === mockAltSiteObject.defaultLocale) ??
    mockAltSiteObject.supportedLocales[0];

function renderSheetBody() {
    const router = createMemoryRouter(
        [
            {
                path: '/',
                element: (
                    <ConfigProvider config={mockConfig}>
                        <SiteProvider
                            site={mockAltSiteObject}
                            locale={locale}
                            language={mockAltSiteObject.defaultLocale}
                            currency={mockAltSiteObject.defaultCurrency}>
                            <StoreLocatorProvider>
                                <StoreLocator />
                                <SelectionProbe />
                            </StoreLocatorProvider>
                        </SiteProvider>
                    </ConfigProvider>
                ),
            },
            // Persist target hit on select — stub so the fetcher submit resolves.
            { path: '/action/set-selected-store', action: () => ({ success: true }) },
        ],
        { initialEntries: ['/'] }
    );
    return render(<RouterProvider router={router} />);
}

describe('Luxury store-locator sheet body (Collect at Boutique picker)', () => {
    test('seeds all boutiques with per-boutique availability badges', () => {
        renderSheetBody();
        // Every seeded boutique is offered (map also renders names, so assert on the selectable options).
        expect(screen.getByTestId('boutique-option-ln-boutique-geneva')).toBeInTheDocument();
        expect(screen.getByTestId('boutique-option-ln-boutique-london')).toBeInTheDocument();
        expect(screen.getByTestId('boutique-option-ln-boutique-newyork')).toBeInTheDocument();
        // Each option carries a stock badge: two in-stock, one unavailable.
        const badges = screen.getAllByTestId('boutique-availability');
        expect(badges).toHaveLength(3);
        expect(badges.filter((b) => /in stock/i.test(b.textContent ?? ''))).toHaveLength(2);
        expect(badges.filter((b) => /unavailable/i.test(b.textContent ?? ''))).toHaveLength(1);
    });

    test('disables selection of an out-of-stock boutique', () => {
        renderSheetBody();
        expect(screen.getByTestId('boutique-option-ln-boutique-london')).toBeDisabled();
        expect(screen.getByTestId('boutique-option-ln-boutique-geneva')).toBeEnabled();
    });

    test('selecting an in-stock boutique writes it to the store-locator selection', async () => {
        renderSheetBody();
        expect(screen.getByTestId('selected-store')).toHaveTextContent('none');
        await userEvent.click(screen.getByTestId('boutique-option-ln-boutique-newyork'));
        expect(screen.getByTestId('selected-store')).toHaveTextContent('ln-boutique-newyork');
    });
});
