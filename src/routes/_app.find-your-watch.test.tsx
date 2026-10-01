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
import FindYourWatchPage, { loader } from './_app.find-your-watch';

vi.mock('@/components/watch-finder-tool', () => ({
    default: () => <div data-testid="watch-finder">Watch Finder</div>,
}));

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: () => null,
}));

vi.mock('@/lib/api/search.server', () => ({
    fetchSearchProducts: vi.fn(() => Promise.resolve({ hits: [] })),
}));

describe('FindYourWatchPage', () => {
    test('renders the watch finder', () => {
        render(<FindYourWatchPage loaderData={{ pageUrl: 'http://localhost/find-your-watch', hits: [] }} />);
        expect(screen.getByTestId('watch-finder')).toBeInTheDocument();
    });

    test('loader returns a canonical page URL', async () => {
        const data = await loader({
            request: new Request('http://localhost/global/en-US/find-your-watch'),
            url: new URL('http://localhost/global/en-US/find-your-watch'),
            params: {},
            context: {} as never,
            pattern: '/find-your-watch',
        });
        expect(data.pageUrl).toContain('find-your-watch');
    });
});
