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
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import CarePage, { loader } from './_app.care';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: () => null,
}));

describe('CarePage', () => {
    test('renders servicing copy and a boutique CTA', () => {
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <CarePage
                        loaderData={{ pageUrl: 'http://localhost/care', ogImageUrl: 'http://localhost/servicing.webp' }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.getByTestId('care-page')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /care & servicing/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /find a boutique/i })).toBeInTheDocument();
        expect(document.querySelector('[data-layout="split"]')).toBeInTheDocument();
        expect(document.querySelectorAll('[data-layout="tile"]')).toHaveLength(3);
        expect(document.querySelector('[data-layout="stack"]')).toBeInTheDocument();
    });

    test('loader returns a canonical page URL', () => {
        const data = loader({
            request: new Request('http://localhost/global/en-US/care'),
            url: new URL('http://localhost/global/en-US/care'),
            params: {},
            context: {} as never,
            pattern: '/care',
        });
        expect(data.pageUrl).toContain('care');
        expect(data.ogImageUrl).toContain('http://localhost');
    });
});
