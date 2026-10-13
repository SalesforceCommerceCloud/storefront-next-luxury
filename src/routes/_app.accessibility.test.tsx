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
import AccessibilityPage, { loader } from './_app.accessibility';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: () => null,
}));

vi.mock('@/components/contact', () => ({
    default: () => <div data-testid="contact">Contact Form</div>,
}));

describe('AccessibilityPage', () => {
    test('renders the accessibility statement', () => {
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <AccessibilityPage
                        loaderData={{
                            pageUrl: 'http://localhost/accessibility',
                            ogImageUrl: 'http://localhost/limestone.webp',
                        }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.getByTestId('accessibility-page')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /accessibility statement/i })).toBeInTheDocument();
        expect(screen.getByText(/wcag 2\.2 aa/i)).toBeInTheDocument();
        expect(document.querySelector('[data-layout="callout"]')).toBeInTheDocument();
        expect(document.querySelector('[data-layout="split"]')).toBeInTheDocument();
        expect(screen.getByTestId('contact')).toBeInTheDocument();
    });

    test('loader returns a canonical page URL', () => {
        const data = loader({
            request: new Request('http://localhost/global/en-US/accessibility'),
            url: new URL('http://localhost/global/en-US/accessibility'),
            params: {},
            context: {} as never,
            pattern: '/accessibility',
        });
        expect(data.pageUrl).toContain('accessibility');
    });
});
