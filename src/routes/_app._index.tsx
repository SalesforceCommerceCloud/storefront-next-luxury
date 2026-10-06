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
import { Suspense } from 'react';
import { Await, redirect, useAsyncError } from 'react-router';
import type { Route } from './+types/_app._index';
import type { ShopperProducts, ShopperSearch } from '@/scapi';
import { fetchCarouselProducts } from '@/components/product-carousel/loaders';
import { fetchCategories } from '@/lib/api/categories.server';
import { siteContext, resolvePrefix, type SiteContext } from '@salesforce/storefront-next-runtime/site-context';
import { Region } from '@/components/region';
import ContentCard from '@/components/content-card';
import { Link } from '@/components/link';
import { Button } from '@/components/ui/button';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import { boutiqueAppointmentHref } from '@/lib/boutique-href';
import WatchFinderCta from '@/components/watch-finder-cta';
import PopularCategory from '@/components/home/popular-category';
import { Grid } from '@/components/grid';
import { PageType } from '@/lib/decorators/page-type';
import { RegionDefinition } from '@/lib/decorators/region-definition';

import { fetchPageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { getLogger } from '@/lib/logger.server';

import hero01 from '/images/hero-01.webp';
import hero02 from '/images/hero-02.webp';
import hero03 from '/images/hero-03.webp';
import HeroCarousel, { type HeroSlide } from '@/components/hero-carousel';
import HomeParallax from '@/components/home-parallax';
import { ProductCarouselSkeleton } from '@/components/product-carousel';
import { ProductCarouselWithData } from '@/components/product-carousel/carousel';
import { SeoMeta } from '@/components/seo-meta';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { useTranslation } from 'react-i18next';
import type { NormalizedApiError } from '@/lib/api/normalized-api-error';
import { useSeoUrlContext } from '@/hooks/use-seo-url-context';
import { createCategoryUrlFromLegacyPath } from '@/route-paths';

export { shouldRevalidate } from '@/lib/revalidation/routes/home';

@PageType({
    name: 'Home Page',
    description: 'Main landing page with hero carousel, featured products, and help sections',
    supportedAspectTypes: [],
})
@RegionDefinition([
    {
        id: 'headerbanner',
        name: 'Header Banner Region',
        description: 'Region for promotional banners and hero content',
        maxComponents: 3,
    },
    {
        id: 'main',
        name: 'Main Content Region',
        description: 'Region for main content',
        maxComponents: 10,
    },
])
export class HomePageMetadata {}

function FeaturedProductsError() {
    const error = useAsyncError() as NormalizedApiError;
    const { t } = useTranslation('home');
    return (
        <div role="alert" className="py-8 text-center text-muted-foreground">
            <p>{t('featuredProducts.loadFailed')}</p>
            {import.meta.env.DEV && (
                <div className="mt-2 text-xs font-mono text-muted-foreground/70">
                    {error.status && <span>{error.status}</span>}
                    {error.message && <p>{error.message}</p>}
                </div>
            )}
        </div>
    );
}

function CollectionGrid({
    categories,
    headingLevel = 'h2',
}: {
    categories: ShopperProducts.schemas['Category'][];
    headingLevel?: 'h1' | 'h2';
}) {
    const { t } = useTranslation('home');
    const Heading = headingLevel;

    // Collection tiles. Exclude shop-by-price explicitly by id — it's a price-browse entry point
    // (surfaced in the top nav + the /collections page), not a home-page collection.
    // Excluding by id keeps this correct whether or not shop-by-price is menu-visible (c_showInMenu).
    // The c_showInMenu filter still drops other menu-suppressed categories (e.g. straps).
    const tiles = categories.filter(
        (category) =>
            category.id !== 'shop-by-price' && String((category as { c_showInMenu?: unknown }).c_showInMenu) !== 'false'
    );
    // Preview up to 6 collections here; the full set lives on /collections behind "View all".
    const previewTiles = tiles.slice(0, 6);

    return (
        <section className="section-container py-12 md:py-16" data-slot="luxury-collection-tiles">
            <div className="mb-8 flex items-center justify-between">
                <Heading className="font-serif text-3xl md:text-4xl font-normal">{t('collections.title')}</Heading>
                <Link
                    to="/collections"
                    className="ml-4 shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                    {t('collections.viewAll')}
                </Link>
            </div>
            <Grid className="grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {previewTiles.map((category) => (
                    <PopularCategory key={category.id} category={category} mediaAspectRatio="fill" />
                ))}
            </Grid>
        </section>
    );
}

export type HomePageData = {
    page: Awaited<ReturnType<typeof fetchPageWithComponentData>>;
    searchResult: Promise<ShopperSearch.schemas['ProductSearchResult']>;
    categories: Promise<ShopperProducts.schemas['Category'][]>;
    pageUrl: string;
    ogImageUrl: string;
};

/**
 * Server-side loader function that fetches home page data.
 * This function runs on the server during SSR and prepares data for the home page.
 * @returns Promise that resolves to an object containing search result promise
 */
export async function loader(args: Route.LoaderArgs): Promise<HomePageData> {
    const logger = getLogger(args.context);
    logger.debug('HomePage: loader starting');

    const config = getConfig(args.context);
    const requestUrl = new URL(args.request.url);

    // Redirect bare "/" to the default site/locale prefixed homepage
    if (requestUrl.pathname === '/' && config.url?.prefix && config.url.prefix !== '/') {
        const siteRef = config.siteAliasMap?.[config.defaultSiteId] ?? config.defaultSiteId;
        const defaultSite = config.commerce.sites.find((s) => s.id === config.defaultSiteId);
        const defaultLocale = defaultSite?.defaultLocale ?? config.i18n.fallbackLng;
        const localeRef = config.localeAliasMap?.[defaultLocale] ?? defaultLocale;
        const prefixedPath = resolvePrefix({
            prefix: config.url.prefix,
            params: { siteId: siteRef, localeId: localeRef },
        });
        throw redirect(`${prefixedPath}/`);
    }

    const currency = (args.context.get(siteContext) as SiteContext).currency;
    const pageUrl = buildCanonicalUrl(requestUrl.origin, requestUrl.pathname, requestUrl.search);
    const page = fetchPageWithComponentData(args, { pageId: 'homepage' });
    const searchResult = fetchCarouselProducts(args.context, {
        categoryId: 'root',
        limit: config.pages.home.featuredProductsCount,
        currency: currency ?? undefined,
    });
    const categories = fetchCategories(args.context, 'root', 1);

    // These promises are returned to React Router on success. If the critical page request fails
    // first, observe their eventual outcome so a later API failure cannot become unhandled.
    void Promise.allSettled([searchResult, categories]);

    return {
        page: await page,
        searchResult,
        categories,
        pageUrl,
        ogImageUrl: new URL(hero01, requestUrl.origin).href,
    };
}

/**
 * Home page component that displays the home page content with granular Suspense boundaries.
 * Components within the page handle their own Suspense boundaries for progressive loading.
 * @returns JSX element representing the home page layout
 */
export default function HomePage({ loaderData }: { loaderData: HomePageData }) {
    const { t } = useTranslation('home');
    const seoUrlContext = useSeoUrlContext();
    const categoryUrl = (path: string) => createCategoryUrlFromLegacyPath(path, seoUrlContext);

    const heroSlides: HeroSlide[] = [
        {
            id: 'slide-1',
            title: t('hero.slide1.title'),
            subtitle: t('hero.slide1.subtitle'),
            imageUrl: hero01,
            imageAlt: t('hero.slide1.imageAlt'),
            ctaText: t('hero.slide1.ctaText'),
            ctaAriaLabel: t('hero.slide1.ctaAriaLabel'),
            ctaLink: '/collections',
            overlayPosition: 'Middle Left',
            overlayAlignment: 'left',
        },
        {
            id: 'slide-2',
            title: t('hero.slide2.title'),
            subtitle: t('hero.slide2.subtitle'),
            imageUrl: hero02,
            imageAlt: t('hero.slide2.imageAlt'),
            ctaText: t('hero.slide2.ctaText'),
            ctaAriaLabel: t('hero.slide2.ctaAriaLabel'),
            ctaLink: categoryUrl('/category/dive'),
            overlayPosition: 'Middle Left',
            overlayAlignment: 'left',
        },
        {
            id: 'slide-3',
            title: t('hero.slide3.title'),
            subtitle: t('hero.slide3.subtitle'),
            imageUrl: hero03,
            imageAlt: t('hero.slide3.imageAlt'),
            ctaText: t('hero.slide3.ctaText'),
            ctaAriaLabel: t('hero.slide3.ctaAriaLabel'),
            ctaLink: categoryUrl('/category/complications'),
            overlayPosition: 'Middle Left',
            overlayAlignment: 'left',
        },
    ];

    return (
        <>
            <div data-slot="luxury-home-hero" className="relative bg-background pb-16">
                <h1 className="sr-only">{t('meta.title', { defaultValue: 'NextGen PWA Kit Store' })}</h1>
                <SeoMeta
                    rawTitle
                    title={t('meta.title', { defaultValue: 'NextGen PWA Kit Store' })}
                    description={t('meta.description', {
                        defaultValue: 'Welcome to our web store for high performers!',
                    })}
                    openGraph={{
                        type: 'website',
                        url: loaderData.pageUrl,
                        image: loaderData.ogImageUrl,
                    }}
                />
                {/* Header Banner Region - critical content suspends at the page boundary */}
                <div>
                    <Region
                        page={loaderData.page}
                        regionId="headerbanner"
                        critical={true}
                        errorElement={
                            <>
                                <div data-slot="luxury-home-scene">
                                    <HomeParallax
                                        slides={heroSlides.map((slide) => ({ id: slide.id, src: slide.imageUrl }))}
                                    />
                                    <HeroCarousel
                                        slides={heroSlides}
                                        autoPlay={true}
                                        autoPlayInterval={6000}
                                        showNavigation={true}
                                        showDots={true}
                                    />

                                    {/* Featured Products */}
                                    <div className="relative z-[1] bg-background">
                                        <Suspense
                                            fallback={<ProductCarouselSkeleton title={t('featuredProducts.title')} />}>
                                            <Await
                                                resolve={loaderData.searchResult}
                                                errorElement={<FeaturedProductsError />}>
                                                {(searchResult) => (
                                                    <div data-slot="luxury-featured-rail">
                                                        <ProductCarouselWithData
                                                            data={searchResult}
                                                            title={t('featuredProducts.title')}
                                                            shopAllUrl="/collections"
                                                            shopAllText={t('featuredProducts.shopAll')}
                                                        />
                                                    </div>
                                                )}
                                            </Await>
                                        </Suspense>
                                    </div>
                                </div>
                            </>
                        }
                    />
                </div>

                {/* Main Region - Region component handles its own Suspense internally */}
                {/* Note: This region doesn't provide fallback skeletons right now as it's located below the fold */}
                <div className="relative z-[1] bg-background">
                    <Region
                        page={loaderData.page}
                        regionId="main"
                        errorElement={
                            <>
                                <Suspense fallback={null}>
                                    <Await resolve={loaderData.categories}>
                                        {(categories) => <CollectionGrid categories={categories} />}
                                    </Await>
                                </Suspense>

                                <div className="section-container py-16" data-slot="luxury-home-editorial">
                                    <ContentCard
                                        className="w-full"
                                        title={t('editorial.title')}
                                        description={t('editorial.body')}
                                        imageUrl="/images/salons/geneva.webp"
                                        imageAlt={t('editorial.imageAlt')}
                                        buttonText={t('editorial.cta')}
                                        buttonAriaLabel={t('editorial.cta')}
                                        buttonLink="/about-us"
                                        showBackground={false}
                                        showBorder={false}
                                        loading="lazy"
                                    />
                                </div>

                                <section
                                    data-slot="luxury-finder-band"
                                    className="relative overflow-hidden bg-primary text-primary-foreground">
                                    <img
                                        src="/images/finder-band.webp"
                                        alt=""
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-primary/75" />
                                    <div className="section-container relative py-16 md:py-20 text-center">
                                        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-primary-foreground/70">
                                            {t('finderBand.title')}
                                        </p>
                                        <h2 className="mt-4 font-serif text-3xl md:text-4xl font-normal">
                                            {t('finderBand.subtitle')}
                                        </h2>
                                        <WatchFinderCta
                                            variant="secondary"
                                            className="mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                                            {t('finderBand.cta')}
                                        </WatchFinderCta>
                                    </div>
                                </section>

                                <div className="section-container py-16">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <ContentCard
                                            title={t('pair.boutiques.title')}
                                            description={t('pair.boutiques.description')}
                                            imageUrl="/images/salons/salon-interior.webp"
                                            imageAlt={t('pair.boutiques.imageAlt')}
                                            buttonText={t('pair.boutiques.cta')}
                                            buttonAriaLabel={t('pair.boutiques.cta')}
                                            buttonLink="/boutiques"
                                            showBackground={false}
                                            showBorder={false}
                                            loading="lazy"
                                        />
                                        <ContentCard
                                            title={t('pair.care.title')}
                                            description={t('pair.care.description')}
                                            imageUrl="/images/salons/paris.webp"
                                            imageAlt={t('pair.care.imageAlt')}
                                            buttonText={t('pair.care.cta')}
                                            buttonAriaLabel={t('pair.care.cta')}
                                            buttonLink="/care"
                                            showBackground={false}
                                            showBorder={false}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="mt-16 text-center">
                                        <h2 className="font-serif text-3xl">{t('appointment.title')}</h2>
                                        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                                            {t('appointment.body')}
                                        </p>
                                        <Button asChild className="mt-8">
                                            <Link to={boutiqueAppointmentHref()}>{t('appointment.cta')}</Link>
                                        </Button>
                                    </div>
                                </div>
                            </>
                        }
                    />
                </div>
            </div>
        </>
    );
}
