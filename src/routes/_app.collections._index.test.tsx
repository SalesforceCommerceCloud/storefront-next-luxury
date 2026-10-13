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
import CollectionsPage, { loader } from './_app.collections._index';
import { fetchCategories } from '@/lib/api/categories.server';
import { createTestContext } from '@/lib/test-utils';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

vi.mock('@/lib/api/categories.server', () => ({
    fetchCategories: vi.fn(),
}));

vi.mock('@/components/home/popular-category', () => ({
    default: ({ category }: { category: { id?: string; name?: string } }) => (
        <div data-testid="popular-category">{category.name}</div>
    ),
}));

vi.mock('@/components/grid', () => ({
    Grid: ({ children }: { children: React.ReactNode }) => <div data-testid="collection-grid">{children}</div>,
}));

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: () => null,
}));

describe('CollectionsPage', () => {
    test('renders collection tiles from loader data', () => {
        render(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <CollectionsPage
                        loaderData={{
                            pageUrl: 'http://localhost/collections',
                            categories: [
                                { id: 'heritage', name: 'Heritage' },
                                { id: 'dive', name: 'Dive' },
                            ],
                        }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
        expect(screen.getByText('Heritage')).toBeInTheDocument();
        expect(screen.getByText('Dive')).toBeInTheDocument();
    });

    test('loader fetches root categories', async () => {
        vi.mocked(fetchCategories).mockResolvedValue([{ id: 'heritage', name: 'Heritage' }]);
        const context = createTestContext();
        const data = await loader({
            request: new Request('http://localhost/global/en-US/collections'),
            url: new URL('http://localhost/global/en-US/collections'),
            params: {},
            context,
            pattern: '/collections',
        });
        expect(fetchCategories).toHaveBeenCalledWith(context, 'root', 1);
        expect(data.categories).toHaveLength(1);
    });
});
