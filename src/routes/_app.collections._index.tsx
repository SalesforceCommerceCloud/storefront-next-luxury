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
import type { ShopperProducts } from '@/scapi';
import { SeoMeta } from '@/components/seo-meta';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { fetchCategories } from '@/lib/api/categories.server';
import PopularCategory from '@/components/home/popular-category';
import { Grid } from '@/components/grid';

export type CollectionsPageData = {
    categories: ShopperProducts.schemas['Category'][];
    pageUrl: string;
};

export async function loader(args: LoaderFunctionArgs): Promise<CollectionsPageData> {
    const requestUrl = new URL(args.request.url);
    return {
        categories: await fetchCategories(args.context, 'root', 1),
        pageUrl: buildCanonicalUrl(requestUrl.origin, requestUrl.pathname, requestUrl.search),
    };
}

export default function CollectionsPage({ loaderData }: { loaderData: CollectionsPageData }): ReactElement {
    const { t } = useTranslation('watch');
    const { t: tHome } = useTranslation('home');

    // shop-by-price is a top-nav-only price-browse entry — never a collections tile or link here.
    const displayCategories = loaderData.categories.filter((cat) => cat.id !== 'shop-by-price');

    return (
        <div className="py-8">
            <SeoMeta
                rawTitle
                title={t('collectionsPage.title')}
                openGraph={{ type: 'website', url: loaderData.pageUrl }}
            />
            <section className="section-container py-12 md:py-16" data-slot="luxury-collection-tiles">
                <h1 className="font-serif text-3xl md:text-4xl mb-8 font-normal">{tHome('collections.title')}</h1>
                <Grid className="grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {displayCategories.map((category) => (
                        <PopularCategory key={category.id} category={category} mediaAspectRatio="fill" />
                    ))}
                </Grid>
            </section>
        </div>
    );
}
