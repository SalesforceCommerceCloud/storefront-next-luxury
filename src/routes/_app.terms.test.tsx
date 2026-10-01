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
import TermsPage, { loader } from './_app.terms';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: () => null,
}));

describe('TermsPage', () => {
    test('renders terms of use copy', () => {
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <TermsPage
                        loaderData={{
                            pageUrl: 'http://localhost/terms',
                            ogImageUrl: 'http://localhost/limestone.webp',
                        }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.getByTestId('terms-page')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /terms of use/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /demonstration store/i })).toBeInTheDocument();
        expect(document.querySelector('[data-layout="callout"]')).toBeInTheDocument();
        expect(document.querySelector('[data-layout="split"]')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /warranty/i })).toBeInTheDocument();
    });

    test('loader returns a canonical page URL', () => {
        const data = loader({
            request: new Request('http://localhost/global/en-US/terms'),
            url: new URL('http://localhost/global/en-US/terms'),
            params: {},
            context: {} as never,
            pattern: '/terms',
        });
        expect(data.pageUrl).toContain('terms');
    });
});
