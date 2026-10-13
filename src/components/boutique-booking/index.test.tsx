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
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, test } from 'vitest';
import BoutiqueBooking from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

function renderBooking(intent: 'browse' | 'appointment' = 'browse') {
    const router = createMemoryRouter(
        [
            {
                path: '/',
                element: (
                    <AllProvidersWrapper>
                        <BoutiqueBooking productId="ln-heritage-001" intent={intent} />
                    </AllProvidersWrapper>
                ),
            },
            { path: '/boutiques', element: <div /> },
        ],
        { initialEntries: ['/'] }
    );
    return render(<RouterProvider router={router} />);
}

describe('BoutiqueBooking', () => {
    test('always offers a full-width book CTA with the product on the query', () => {
        renderBooking('browse');
        expect(screen.getByTestId('boutique-booking')).toBeInTheDocument();
        const book = screen.getByRole('link', { name: /book an appointment/i });
        expect(book).toHaveAttribute('href', expect.stringContaining('/boutiques'));
        expect(book).toHaveAttribute('href', expect.stringContaining('product=ln-heritage-001'));
        expect(book).not.toHaveAttribute('href', expect.stringContaining('appointment=1'));
        expect(book).not.toHaveAttribute('href', expect.stringContaining('#appointment'));
        expect(screen.getByRole('link', { name: /find a boutique/i })).toHaveAttribute(
            'href',
            expect.stringContaining('/boutiques')
        );
    });

    test('appointment intent uses the same boutique picker path', () => {
        renderBooking('appointment');
        const link = screen.getByRole('link', { name: /book an appointment/i });
        expect(link).toHaveAttribute('href', expect.stringContaining('/boutiques'));
        expect(link).toHaveAttribute('href', expect.stringContaining('product=ln-heritage-001'));
        expect(link).not.toHaveAttribute('href', expect.stringContaining('appointment=1'));
        expect(link).not.toHaveAttribute('href', expect.stringContaining('#appointment'));
    });
});
