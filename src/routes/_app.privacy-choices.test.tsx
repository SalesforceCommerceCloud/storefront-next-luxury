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
import PrivacyChoicesPage, { loader } from './_app.privacy-choices';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: () => null,
}));

describe('PrivacyChoicesPage', () => {
    test('renders privacy choices copy', () => {
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <PrivacyChoicesPage
                        loaderData={{
                            pageUrl: 'http://localhost/privacy-choices',
                            ogImageUrl: 'http://localhost/limestone.webp',
                        }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.getByTestId('privacy-choices-page')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /your privacy choices/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /do not track/i })).toBeInTheDocument();
        expect(document.querySelectorAll('[data-layout="tile"]')).toHaveLength(3);
    });

    test('loader returns a canonical page URL', () => {
        const data = loader({
            request: new Request('http://localhost/global/en-US/privacy-choices'),
            url: new URL('http://localhost/global/en-US/privacy-choices'),
            params: {},
            context: {} as never,
            pattern: '/privacy-choices',
        });
        expect(data.pageUrl).toContain('privacy-choices');
    });
});
