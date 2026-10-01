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
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import { useStoreLocator } from '@/extensions/store-locator/providers/store-locator';

// Mock the lazy-loaded sheet so we can assert it mounts without pulling the full store-locator UI.
vi.mock('@/extensions/store-locator/components/header/store-locator-sheet', () => ({
    default: ({ open }: { open: boolean }) => <div data-testid="mock-store-locator-sheet" data-open={open} />,
}));

import StoreLocatorBadge from './store-locator-badge';

// Opens the store locator programmatically — exactly what selecting "Collect at Boutique" on a cart
// line item does via openStoreLocator().
function OpenLocatorButton() {
    const open = useStoreLocator((s) => s.open);
    return (
        <button type="button" onClick={() => open()}>
            open-locator
        </button>
    );
}

describe('Luxury StoreLocatorBadge', () => {
    test('renders no find-a-store icon in the header by default', () => {
        render(
            <AllProvidersWrapper>
                <StoreLocatorBadge />
            </AllProvidersWrapper>
        );
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.queryByTestId('mock-store-locator-sheet')).not.toBeInTheDocument();
    });

    test('mounts the store-locator sheet when opened programmatically (cart "Collect at Boutique")', async () => {
        render(
            <AllProvidersWrapper>
                <StoreLocatorBadge />
                <OpenLocatorButton />
            </AllProvidersWrapper>
        );
        expect(screen.queryByTestId('mock-store-locator-sheet')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'open-locator' }));

        const sheet = await screen.findByTestId('mock-store-locator-sheet');
        expect(sheet).toBeInTheDocument();
        expect(sheet).toHaveAttribute('data-open', 'true');
    });
});
