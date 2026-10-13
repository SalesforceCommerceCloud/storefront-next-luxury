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
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';
import StrapSelector from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import type { ShopperProducts } from '@/scapi';

vi.mock('@/components/link', () => ({
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

const mockStraps: ShopperProducts.schemas['Product'][] = [
    {
        id: 'ln-strap-001',
        name: 'Black Alligator Strap',
        price: 450,
        currency: 'USD',
        imageGroups: [
            {
                images: [{ link: '/images/straps/alligator-black.webp', alt: 'Black Alligator Strap' }],
            },
        ],
    },
    {
        id: 'ln-strap-002',
        name: 'Brown Leather Strap',
        price: 350,
        currency: 'USD',
        imageGroups: [
            {
                images: [{ link: '/images/straps/leather-brown.webp', alt: 'Brown Leather Strap' }],
            },
        ],
    },
] as ShopperProducts.schemas['Product'][];

describe('StrapSelector', () => {
    test('lists compatible straps with photos', () => {
        render(
            <AllProvidersWrapper>
                <StrapSelector straps={mockStraps} />
            </AllProvidersWrapper>
        );
        expect(screen.getByTestId('strap-selector')).toBeInTheDocument();
        expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
        expect(screen.getByRole('img', { name: /alligator/i })).toBeInTheDocument();
    });

    test('returns null when no straps match', () => {
        const { container } = render(
            <AllProvidersWrapper>
                <StrapSelector straps={[]} />
            </AllProvidersWrapper>
        );
        expect(container).toBeEmptyDOMElement();
    });
});
