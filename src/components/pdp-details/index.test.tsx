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
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { MemoryRouter } from 'react-router';
import PdpDetails from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import { createMockLuxuryWatch } from '../../test-support/mock-watch';

const mockProduct = createMockLuxuryWatch({ name: 'Classic Automatic' });

const mockProductTwoShots = createMockLuxuryWatch({
    id: 'ln-heritage-005',
    name: 'Small Seconds Steel',
    c_caseDiameter: 38,
    imageGroups: [
        {
            viewType: 'large',
            images: [
                {
                    link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-heritage-005.webp',
                    alt: 'Small Seconds Steel',
                },
                {
                    link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-heritage-005-wrist.webp',
                    alt: 'Wrist shot',
                },
                {
                    link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-heritage-005-angle.webp',
                    alt: 'Angle view',
                },
            ],
        },
    ],
});

describe('Luxury PDP details', () => {
    test('renders extra shots, about copy, and manufacture guarantee for a watch', () => {
        const images = (mockProduct.imageGroups?.[0]?.images ?? []).slice(1).map((image) => ({
            src: image.link ?? '',
            alt: image.alt ?? '',
        }));

        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <PdpDetails product={mockProduct} images={images} />
                </AllProvidersWrapper>
            </MemoryRouter>
        );

        expect(screen.getByTestId('luxury-pdp-details')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: mockProduct.name })).toBeInTheDocument();
        expect(screen.getByText(/Geneva manufacture/i)).toBeInTheDocument();
        expect(screen.queryByText(/market street/i)).not.toBeInTheDocument();
        expect(screen.getByTestId('luxury-pdp-gallery')).toBeInTheDocument();
        expect(screen.getByTestId('luxury-pdp-gallery').className).toMatch(/lg:grid-cols-4/);
        expect(screen.getByTestId('luxury-manufacture-guarantee')).toBeInTheDocument();
        expect(images.length).toBeGreaterThan(0);
        expect(within(screen.getByTestId('luxury-pdp-gallery')).getAllByRole('img')).toHaveLength(images.length);
    });

    test('uses two columns when a watch has two extra shots', () => {
        const images = (mockProductTwoShots.imageGroups?.[0]?.images ?? []).slice(1).map((image) => ({
            src: image.link ?? '',
            alt: image.alt ?? '',
        }));

        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <PdpDetails product={mockProductTwoShots} images={images} />
                </AllProvidersWrapper>
            </MemoryRouter>
        );

        expect(screen.getByTestId('luxury-pdp-gallery').className).toMatch(/sm:grid-cols-2/);
        expect(screen.getByTestId('luxury-pdp-gallery').className).not.toMatch(/lg:grid-cols-4/);
    });

    test('Watch tab shows the full spec sheet; Movement tab narrows to the Movement group only', () => {
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <PdpDetails product={mockProduct} images={[]} />
                </AllProvidersWrapper>
            </MemoryRouter>
        );

        const specs = screen.getByTestId('luxury-pdp-specs');
        const groupHeadings = (): (string | null)[] =>
            Array.from(specs.querySelectorAll('[data-slot="collapsible-heading"]')).map((el) => el.textContent);

        // Watch tab (default) renders the full spec sheet — at least Movement and Case.
        expect(groupHeadings()).toContain('Movement');
        expect(groupHeadings()).toContain('Case');

        // Switching to the Movement tab narrows the sheet to the Movement group only — the panel is
        // no longer identical to the Watch tab (the reviewer's blocking bug).
        fireEvent.click(screen.getByRole('button', { name: 'Movement' }));
        expect(groupHeadings()).toEqual(['Movement']);
    });

    test('spec-sheet group headings are static text, not focusable disclosure controls', () => {
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <PdpDetails product={mockProduct} images={[]} />
                </AllProvidersWrapper>
            </MemoryRouter>
        );

        const specs = screen.getByTestId('luxury-pdp-specs');
        // The always-open groups render as plain headers (no <summary>/<details> disclosure) so AT
        // doesn't announce an inert toggle.
        expect(specs.querySelector('summary')).not.toBeInTheDocument();
        expect(specs.querySelectorAll('[data-slot="collapsible-heading"]').length).toBeGreaterThan(0);
    });

    test('renders the Shipping & warranty tab content when selected', () => {
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <PdpDetails product={mockProduct} images={[]} />
                </AllProvidersWrapper>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /shipping & warranty/i }));
        expect(screen.getByText(/complimentary insured shipping/i)).toBeInTheDocument();
        expect(screen.getByText(/two-year international warranty/i)).toBeInTheDocument();
    });
});
