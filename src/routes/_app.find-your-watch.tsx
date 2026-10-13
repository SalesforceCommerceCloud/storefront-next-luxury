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
import type { ReactElement } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SeoMeta } from '@/components/seo-meta';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import WatchFinderTool from '@/components/watch-finder-tool';
import { fetchSearchProducts } from '@/lib/api/search.server';
import type { ShopperSearch } from '@/scapi';

export type FindYourWatchPageData = {
    pageUrl: string;
    hits: ShopperSearch.schemas['ProductSearchHit'][];
};

export async function loader({ request, context }: LoaderFunctionArgs): Promise<FindYourWatchPageData> {
    const requestUrl = new URL(request.url);
    const result = await fetchSearchProducts(context, { refine: ['cgid=root'], limit: 200 });
    return {
        pageUrl: buildCanonicalUrl(requestUrl.origin, requestUrl.pathname, requestUrl.search),
        hits: result.hits ?? [],
    };
}

export default function FindYourWatchPage({ loaderData }: { loaderData: FindYourWatchPageData }): ReactElement {
    const { t } = useTranslation('watch');

    return (
        <div className="w-full">
            <SeoMeta
                rawTitle
                title={t('finder.title')}
                description={t('finder.subtitle')}
                openGraph={{ type: 'website', url: loaderData.pageUrl }}
            />
            <WatchFinderTool hits={loaderData.hits} />
        </div>
    );
}
