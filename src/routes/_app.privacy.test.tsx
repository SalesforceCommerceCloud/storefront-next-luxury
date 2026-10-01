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
import PrivacyPage, { loader } from './_app.privacy';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: () => null,
}));

describe('PrivacyPage', () => {
    test('renders privacy policy copy', () => {
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <PrivacyPage
                        loaderData={{
                            pageUrl: 'http://localhost/privacy',
                            ogImageUrl: 'http://localhost/limestone.webp',
                        }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.getByTestId('privacy-page')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
        expect(screen.getByText(/boutique appointments/i)).toBeInTheDocument();
        expect(document.querySelector('[data-layout="prose"]')).toBeInTheDocument();
        expect(document.querySelector('[data-layout="callout"]')).toBeInTheDocument();
        expect(document.querySelectorAll('[data-layout="tile"]')).toHaveLength(2);
    });

    test('loader returns a canonical page URL', () => {
        const data = loader({
            request: new Request('http://localhost/global/en-US/privacy'),
            url: new URL('http://localhost/global/en-US/privacy'),
            params: {},
            context: {} as never,
            pattern: '/privacy',
        });
        expect(data.pageUrl).toContain('privacy');
    });
});
