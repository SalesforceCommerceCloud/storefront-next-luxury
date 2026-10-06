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
import { describe, expect, test, vi } from 'vitest';
import { loader } from './_app.collections.$collection';
import { createTestContext } from '@/lib/test-utils';
import config from '@/config/server';

vi.mock('@/lib/url.server', () => ({
    buildUrlFromContext: (path: string) => path,
}));

describe('CollectionRedirect', () => {
    test('redirects a collection slug to the category PLP', () => {
        expect(
            loader({
                request: new Request('http://localhost/collections/heritage'),
                url: new URL('http://localhost/collections/heritage'),
                params: { collection: 'heritage' },
                context: createTestContext(),
                pattern: '/collections/:collection',
            })
        ).toMatchObject({ status: 302, headers: expect.anything() });
    });

    test('uses a search refinement when a static collection has no authoritative slug path', () => {
        const response = loader({
            request: new Request('http://localhost/collections/heritage'),
            url: new URL('http://localhost/collections/heritage'),
            params: { collection: 'heritage' },
            context: createTestContext({
                appConfig: {
                    url: {
                        ...config.app.url,
                        seoRoutes: {
                            [config.app.commerce.sites[0].id]: {
                                product: { prefix: 'p' },
                                category: { prefix: 'catalog', mode: 'slug-path' },
                            },
                        },
                    },
                },
            }),
            pattern: '/collections/:collection',
        });

        expect(response.headers.get('location')).toBe('/search?refine=cgid%3Dheritage');
    });
});
