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
import type { ReactElement, ReactNode } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Link } from '@/components/link';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Typography } from '@/components/typography';
import { SeoMeta } from '@/components/seo-meta';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import limestoneImage from '/images/pages/limestone.webp';

export type StaticDocumentData = {
    pageUrl: string;
    ogImageUrl: string;
};

// eslint-disable-next-line react-refresh/only-export-components -- loader factory co-located with the shared document layout
export function createStaticDocumentLoader(ogImage: string) {
    return ({ request }: LoaderFunctionArgs): StaticDocumentData => {
        const requestUrl = new URL(request.url);
        return {
            pageUrl: buildCanonicalUrl(requestUrl.origin, requestUrl.pathname, requestUrl.search),
            ogImageUrl: new URL(ogImage, requestUrl.origin).href,
        };
    };
}

/**
 * Shared loader for luxury static documents that use the default limestone hero as their OG image.
 * Pages with a bespoke OG image (e.g. Care) call {@link createStaticDocumentLoader} directly instead.
 */
// eslint-disable-next-line react-refresh/only-export-components -- prebuilt loader co-located with the shared document layout
export const limestoneDocumentLoader = createStaticDocumentLoader(limestoneImage);

export function StaticDocument({
    title,
    description,
    breadcrumb,
    intro,
    pageUrl,
    ogImageUrl,
    testId,
    children,
}: {
    title: string;
    /** SEO meta description. Defaults to `intro` when omitted (the two are usually identical). */
    description?: string;
    breadcrumb: string;
    intro?: string;
    pageUrl: string;
    ogImageUrl: string;
    testId: string;
    children: ReactNode;
}): ReactElement {
    const { t } = useTranslation('aboutUs');

    return (
        <div className="pb-16" data-testid={testId}>
            <SeoMeta
                rawTitle
                title={title}
                description={description ?? intro}
                openGraph={{ type: 'article', url: pageUrl, image: ogImageUrl }}
            />
            <div className="section-container pb-6 pt-4 md:pt-8">
                <Breadcrumb className="mb-2.5">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/">{t('breadcrumb.home', { defaultValue: 'Home' })}</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{breadcrumb}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <Typography variant="h2" as="h1">
                    {title}
                </Typography>
                {intro ? (
                    <Typography variant="lead" className="mt-4 max-w-3xl text-xl text-muted-foreground">
                        {intro}
                    </Typography>
                ) : null}
            </div>
            <div className="section-container space-y-10 md:space-y-14">{children}</div>
        </div>
    );
}
