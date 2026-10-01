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
import type { Route } from './+types/_app.about-us';
import { Link } from '@/components/link';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import ContentCard from '@/components/content-card';
import Contact from '@/components/contact';
import { Typography } from '@/components/typography';
import { SeoMeta } from '@/components/seo-meta';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { PageType } from '@/lib/decorators/page-type';
import { RegionDefinition } from '@/lib/decorators/region-definition';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { getLogger } from '@/lib/logger.server';
import atelierImage from '/images/pages/atelier.webp';
import finishingImage from '/images/pages/finishing.webp';
import servicingImage from '/images/pages/servicing.webp';
import salonImage from '/images/salons/salon-interior.webp';
import { Region } from '@/components/region';
import { fetchPageWithComponentData, type PageWithComponentData } from '@/lib/page-designer/page-loader.server';

@PageType({
    name: 'About Us Page',
    description: 'Manufacture story, ateliers, and a contact form.',
    supportedAspectTypes: [],
})
@RegionDefinition([
    {
        id: 'headline',
        name: 'Headline Region',
        description: 'Main content area displayed above the contact form',
        maxComponents: 10,
    },
    {
        id: 'additionalinformation',
        name: 'Additional Information Region',
        description: 'Secondary content area displayed below the contact form',
        maxComponents: 10,
    },
])
export class AboutUsPageMetadata {}

export type AboutUsPageData = {
    page: PageWithComponentData | null;
    pageUrl: string;
    ogImageUrl: string;
};

export async function loader(args: Route.LoaderArgs): Promise<AboutUsPageData> {
    const logger = getLogger(args.context);
    logger.debug('AboutUs: loader starting');

    const requestUrl = new URL(args.request.url);
    return {
        page: await fetchPageWithComponentData(args, {
            pageId: 'aboutus',
        }),
        pageUrl: buildCanonicalUrl(requestUrl.origin, requestUrl.pathname, requestUrl.search),
        ogImageUrl: new URL(atelierImage, requestUrl.origin).href,
    };
}

function PreContactStaticContent({ t }: { t: TFunction<'aboutUs'> }) {
    return (
        <>
            <ContentCard
                title={t('section.ourGoal.title')}
                description={t('section.ourGoal.content')}
                className="full-width"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ContentCard
                    title={t('section.ourVision.title')}
                    description={t('section.ourVision.content')}
                    imageUrl={atelierImage}
                    imageAlt={t('section.ourVision.imageAlt', {
                        defaultValue: 'Empty Geneva ateliers in north light, wooden benches and brass lamps.',
                    })}
                />
                <ContentCard
                    title={t('section.ourValue.title')}
                    description={t('section.ourValue.content')}
                    imageUrl={finishingImage}
                    imageAlt={t('section.ourValue.imageAlt', {
                        defaultValue: 'A round steel case on a finishing bench with suede pads.',
                    })}
                />
            </div>
        </>
    );
}

function PostContactStaticContent({ t }: { t: TFunction<'aboutUs'> }) {
    return (
        <>
            <ContentCard
                title={t('section.ourMission.title')}
                description={t('section.ourMission.content')}
                imageUrl={servicingImage}
                imageAlt={t('section.ourMission.imageAlt', {
                    defaultValue: 'A servicing tray with a loupe, pegwood, and a generic round movement.',
                })}
                buttonText={t('section.ourMission.cta', { defaultValue: 'Care & servicing' })}
                buttonLink={'/care' as '/'}
                className="full-width md:flex-row"
                cardFooterClassName="justify-center flex-auto"
                cardDescriptionClassName="flex-none"
                buttonClassName="w-fit"
            />
            <ContentCard
                title={t('section.ourTeam.title')}
                description={t('section.ourTeam.content')}
                imageUrl={salonImage}
                imageAlt={t('section.ourTeam.imageAlt', {
                    defaultValue: 'Quiet boutique interior with a limestone wall and a single vitrine.',
                })}
                buttonText={t('section.ourTeam.cta', { defaultValue: 'Find a boutique' })}
                buttonLink={'/boutiques' as '/'}
                className="full-width md:flex-row"
                cardFooterClassName="justify-center flex-auto"
                cardDescriptionClassName="flex-none"
                buttonClassName="w-fit"
            />
        </>
    );
}

function AboutUsRegionContent({
    page,
    regionId,
    fallback,
}: {
    page: PageWithComponentData | null;
    regionId: 'headline' | 'additionalinformation';
    fallback: ReactElement;
}) {
    if (!page) {
        return fallback;
    }

    return <Region page={page} regionId={regionId} errorElement={fallback} />;
}

function PreContactRegionContent({ page, t }: { page: PageWithComponentData | null; t: TFunction<'aboutUs'> }) {
    return <AboutUsRegionContent page={page} regionId="headline" fallback={<PreContactStaticContent t={t} />} />;
}

function PostContactRegionContent({ page, t }: { page: PageWithComponentData | null; t: TFunction<'aboutUs'> }) {
    return (
        <AboutUsRegionContent
            page={page}
            regionId="additionalinformation"
            fallback={<PostContactStaticContent t={t} />}
        />
    );
}

export default function AboutUs({ loaderData }: { loaderData: AboutUsPageData }): ReactElement {
    const { t } = useTranslation('aboutUs');

    return (
        <div className="pb-8" data-testid="manufacture-page">
            <SeoMeta
                title={t('title', { defaultValue: 'The manufacture' })}
                description={t('subtitle', {
                    defaultValue: 'A Geneva manufacture since 1964.',
                })}
                openGraph={{ type: 'article', url: loaderData.pageUrl, image: loaderData.ogImageUrl }}
            />
            <div className="section-container pb-6">
                <Breadcrumb className="mb-2.5">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/">{t('breadcrumb.home', { defaultValue: 'Home' })}</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                {t('breadcrumb.aboutUs', { defaultValue: 'The manufacture' })}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <Typography variant="h2" as="h1">
                    {t('title', { defaultValue: 'The manufacture' })}
                </Typography>
            </div>

            <div className="section-container py-6 space-y-6">
                <PreContactRegionContent page={loaderData.page} t={t} />
            </div>

            <div className="py-12 bg-secondary">
                <div className="section-container">
                    <Contact />
                </div>
            </div>

            <div className="section-container py-6 space-y-6">
                <PostContactRegionContent page={loaderData.page} t={t} />
            </div>
        </div>
    );
}
