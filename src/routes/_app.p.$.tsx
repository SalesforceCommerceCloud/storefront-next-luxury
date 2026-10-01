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
import { useEffect, useRef, Suspense, Fragment } from 'react';
import { Await, useRouteLoaderData } from 'react-router';
import type { loader as rootLoader } from '@/root';
import { shouldRevalidate as shouldRevalidateProduct } from '@/lib/revalidation/routes/product';
import type { Route } from './+types/_app.p.$';
import { type ShopperProducts } from '@/scapi';
import { fetchProductById, fetchProductsByIds } from '@/lib/api/products.server';
import { NormalizedApiError } from '@/lib/api/normalized-api-error';
import { resolveProductRoute } from '@/lib/seo/url-resolution.server';
import { getSeoSlugExpansion } from '@/lib/seo/scapi-slugs';
import { attemptRouteSeoFallback } from '@/lib/seo/route-fallback.server';
import { getCanonicalProductRedirect, redirectToCanonicalPath } from '@/lib/seo/canonical-redirect.server';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import { siteContext } from '@salesforce/storefront-next-runtime/site-context';
import ProductView from '@/components/product-view';
import ChildProducts from '@/components/product-view/child-products';
import CategoryBreadcrumbs from '@/components/category-breadcrumbs';
import { isProductSet, isProductBundle } from '@/lib/product/product-utils';
import ProductRecommendations from '@/components/product-recommendations';
import { ProductRecommendationSkeleton } from '@/components/product/skeletons';
import { fetchCollectionCandidatePool, deriveYouMightAlsoLike } from '../lib/pdp-recommendations.server';
import type { Recommendation } from '@/hooks/recommenders/use-recommenders';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '@/hooks/use-analytics';
import { Region } from '@/components/region';
import { ProductProvider } from '@/providers/product-context';
import { PageType } from '@/lib/decorators/page-type';
import { RegionDefinition } from '@/lib/decorators/region-definition';
import { fetchPageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { JsonLd } from '@/components/json-ld';
import { SeoMeta } from '@/components/seo-meta';
import { generateProductSchema } from '@/utils/product-schema';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { getLogger } from '@/lib/logger.server';
import { UITarget } from '@/targets/ui-target';
import ProductViewProvider from '@/providers/product-view';
// @sfdc-extension-block-start SFDC_EXT_BOPIS
import { selectedStoreContext } from '@/extensions/store-locator/middlewares/selected-store.server';
import PickupProvider from '@/extensions/bopis/context/pickup-context';
// @sfdc-extension-block-end SFDC_EXT_BOPIS
// @sfdc-extension-block-start SFDC_EXT_BNPL
import {
    getBuyNowPayLaterMessage,
    getBuyNowPayLaterLearnMore,
    type BuyNowPayLaterMessageData,
    type BuyNowPayLaterLearnMoreData,
} from '@/extensions/bnpl/lib/api/bnpl.server';
import { BnplProvider } from '@/extensions/bnpl/context/bnpl-context';
// @sfdc-extension-block-end SFDC_EXT_BNPL
// @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS
import {
    getReviewsSummary,
    getReviews,
    getWriteReviewForm,
    type ReviewsSummaryData,
    type ReviewsData,
    type WriteReviewFormData,
} from '@/extensions/ratings-reviews/lib/api/reviews.server';
import { ProductReviewsProvider } from '@/extensions/ratings-reviews/providers/product-reviews-context';
import { WriteReviewFormProvider } from '@/extensions/ratings-reviews/context/write-review-form-context';
// @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS
// @sfdc-extension-block-start SFDC_EXT_PRODUCT_CONTENT
import { pdpSectionApi, type SectionContent } from '@/extensions/product-content/lib/api/product-content.server';
import { resolvePdpSections } from '@/extensions/product-content/lib/pdp-sections';
import { ProductContentDataProvider } from '@/extensions/product-content/context/product-content-data-context';
// @sfdc-extension-block-end SFDC_EXT_PRODUCT_CONTENT
// @sfdc-extension-block-start SFDC_EXT_SHIPPING_DELIVERY
import { ShippingDeliveryProvider } from '@/extensions/shipping-delivery/context/shipping-delivery-context';
// @sfdc-extension-block-end SFDC_EXT_SHIPPING_DELIVERY
import { fetchSearchProducts } from '@/lib/api/search.server';
import { getTranslation } from '@salesforce/storefront-next-runtime/i18n';

@PageType({
    name: 'Product Detail Page',
    description: 'Product detail page with product information, images, and recommendations',
    supportedAspectTypes: ['pdp'],
})
@RegionDefinition([
    {
        id: 'promoContent',
        name: 'Promo Content Region',
        description: 'Promotional content region above main product content',
        maxComponents: 1,
    },
    {
        id: 'engagementContent',
        name: 'Engagement Content Region',
        description: 'Engagement content region for recommendations and related products below main content',
        maxComponents: 1,
    },
])
export class ProductPageMetadata {}

export type ProductPageData = {
    product: ShopperProducts.schemas['Product'];
    page: ReturnType<typeof fetchPageWithComponentData>;
    pageKey: string;
    pageUrl: string;
    productSchema: Promise<ReturnType<typeof generateProductSchema> | null>;
    alsoBuyRecommendations: Promise<Recommendation>;
    straps: ShopperProducts.schemas['Product'][];
    // @sfdc-extension-block-start SFDC_EXT_BNPL
    bnplMessage: Promise<BuyNowPayLaterMessageData>;
    bnplLearnMore: Promise<BuyNowPayLaterLearnMoreData>;
    // @sfdc-extension-block-end SFDC_EXT_BNPL
    // @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS
    reviewsSummary: ReviewsSummaryData;
    reviewsList: Promise<ReviewsData>;
    writeReviewForm: Promise<WriteReviewFormData>;
    // @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS
    // @sfdc-extension-block-start SFDC_EXT_PRODUCT_CONTENT
    pdpCollapsibles: Promise<Array<SectionContent | null>>;
    // @sfdc-extension-block-end SFDC_EXT_PRODUCT_CONTENT
};

/**
 * Server-side loader function that fetches product data.
 * This function runs on the server during SSR and can access cookies for store information.
 *
 * The product is awaited as critical data: a 404 from SCAPI is re-thrown as
 * `Response(message, { status: 404 })` so React Router renders the 404 page with
 * the proper HTTP status (essential for SEO).
 *
 * @returns Object containing the resolved product, page data, and schema promises
 */
export async function loader(args: Route.LoaderArgs): Promise<ProductPageData> {
    const { request, context } = args;
    const logger = getLogger(context);
    const requestUrl = new URL(request.url);
    redirectToCanonicalPath(requestUrl);
    const siteCtx = context.get(siteContext);
    if (!siteCtx) {
        logger.error('Product: site context is not available');
        throw new Response('Site context is not available', { status: 500 });
    }
    const config = getConfig(context);
    const routeResolution = resolveProductRoute({
        url: requestUrl,
        params: args.params,
        urlPrefix: config.url?.prefix,
        siteId: siteCtx.site.id,
        seoRoutes: config.url?.seoRoutes,
    });
    if (!routeResolution) {
        const fallback = await attemptRouteSeoFallback(context, request);
        if (fallback) return fallback as never;
        throw new Response('Product not found', { status: 404 });
    }
    const { productId } = routeResolution;
    const { searchParams } = requestUrl;
    const variantPid = searchParams.get('pid');
    logger.debug('Product: loader starting', {
        productId,
        variantPid: variantPid || undefined,
    });

    // @sfdc-extension-block-start SFDC_EXT_BOPIS
    const selectedStoreInfo = context.get(selectedStoreContext);
    // @sfdc-extension-block-end SFDC_EXT_BOPIS

    // Get currency from context for product pricing
    const { currency } = siteCtx;

    // Resolve the product critically. A 404 here must propagate as Response(404)
    // so the route error boundary renders the 404 page with the correct HTTP status.
    const productLookupId = variantPid || productId;

    // @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS
    // Start reviews summary fetch in parallel with the product fetch — it only
    // needs the product ID and drives above-the-fold star display + SEO.
    const reviewsSummaryPromise = getReviewsSummary(productLookupId);
    // @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS
    let product: ShopperProducts.schemas['Product'] | null;
    try {
        product = await fetchProductById(context, productLookupId, {
            expand: [
                'availability', // <-- TTL = 60s (!)
                'bundled_products',
                'images',
                'options',
                'page_meta_tags',
                'prices', // <-- TTL = 900s
                'primary_category',
                'promotions', // <-- TTL = 900s
                'set_products',
                ...getSeoSlugExpansion(config.url?.seoRoutes),
                'variations',
            ],
            allImages: true,
            perPricebook: true,
            ...(currency ? { currency } : {}),
            // @sfdc-extension-block-start SFDC_EXT_BOPIS
            // Include inventoryIds parameter when store is selected
            ...(selectedStoreInfo?.inventoryId ? { inventoryIds: [selectedStoreInfo.inventoryId] } : {}),
            // @sfdc-extension-block-end SFDC_EXT_BOPIS
        });
    } catch (e) {
        if (e instanceof NormalizedApiError && e.status === 404 && !variantPid) {
            const fallback = await attemptRouteSeoFallback(context, request);
            if (fallback) return fallback as never;
        }
        if (e instanceof NormalizedApiError && e.status) {
            throw new Response(e.message, { status: e.status });
        }
        throw new Response('Internal Server Error', { status: 500 });
    }

    if (!product) {
        throw new Response('Product not found', { status: 404 });
    }

    const canonicalRedirect = getCanonicalProductRedirect({
        requestUrl,
        context,
        productId,
        product,
    });
    if (canonicalRedirect) {
        throw canonicalRedirect;
    }

    // Strap swatch tiles and per-variant hero frames come from SCAPI/DIS: the dataset ships native
    // `view-type="swatch"` groups on the bandType axis and dial+strap-tagged `large` groups, which the
    // configurator (findImageGroupBy) and useProductImages read directly — no app-bundled watch imagery.

    // Luxury vertical: fetch compatible straps for this watch. productSearch hits do not carry
    // custom attributes, so resolve the strap IDs from the `straps` category search, then fetch the
    // full products (getProducts returns `c_*` attributes) and filter by `c_compatibleMasters`.
    //
    // Straps are OPTIONAL accessories, never critical to the PDP: wrap the two accessory requests so
    // a failure degrades to an empty list (with contextual logging) instead of rejecting the whole
    // loader. `c_compatibleMasters` stores MASTER ids, so match against the master — a `?pid=` request
    // loads a variant whose own id would never match, which would otherwise drop the strap selector.
    const masterId = product.master?.masterId ?? product.id ?? '';
    let straps: ShopperProducts.schemas['Product'][] = [];
    try {
        const strapSearch = await fetchSearchProducts(context, { refine: ['cgid=straps'], limit: 50 });
        const strapIds = (strapSearch.hits ?? []).map((hit) => hit.productId).filter((id): id is string => Boolean(id));
        const strapProducts = strapIds.length > 0 ? await fetchProductsByIds(context, strapIds) : [];
        straps = strapProducts.filter((strap) => {
            const compatible = (strap as { c_compatibleMasters?: string[] }).c_compatibleMasters;
            return Array.isArray(compatible) && compatible.includes(masterId);
        });
    } catch (error) {
        logger.error('Product: failed to resolve compatible straps; continuing without them', {
            productId: masterId,
            error,
        });
    }

    const pageUrl = buildCanonicalUrl(requestUrl.origin, requestUrl.pathname, requestUrl.search);

    // Generate product schema in loader (server-side) for SEO.
    // Wrapped in a Promise so it can be rendered through Suspense without blocking
    // the loader response. The inner try/catch logs synchronous schema-generation failures
    // (this is local computation, not a SCAPI call — `fetchProductById` already logs SCAPI
    // errors at the API layer) so we keep visibility on rare malformed-input bugs.
    // Render-time failures degrade silently via the route-level <Await errorElement={null}>.
    const productSchemaPromise: Promise<ReturnType<typeof generateProductSchema> | null> = Promise.resolve().then(
        () => {
            try {
                // Reuse the canonical page URL so structured data points at the same preferred URL
                // as the canonical <link> and og:url (buildCanonicalUrl already avoids internal hosts).
                return generateProductSchema(product, pageUrl);
            } catch (error) {
                logger.error('Error generating product schema in loader', { error });
                return null;
            }
        }
    );

    // Category context for Page Designer PDP content, sourced from the primary_category
    // expansion (falls back to the flat primaryCategoryId when the expansion is absent).
    const primaryCategoryId = product.primaryCategory?.id ?? product.primaryCategoryId;
    const page = fetchPageWithComponentData(args, {
        aspectType: 'pdp',
        productId: productLookupId,
        ...(primaryCategoryId ? { categoryId: primaryCategoryId } : {}),
    });

    // @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS
    // Await the summary started earlier (ran in parallel with fetchProductById).
    const reviewsSummary = await reviewsSummaryPromise;
    const reviewsList = getReviews(productLookupId);
    const writeReviewForm = getWriteReviewForm(productLookupId);
    // @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS

    // @sfdc-extension-block-start SFDC_EXT_PRODUCT_CONTENT
    // Get server translator for PDP section resolve functions
    const { i18next } = getTranslation(context);
    const tProduct = (key: string, options?: { count?: number }): string => {
        // The luxury resolve functions pass namespace-prefixed keys (e.g., 'watch:spec.movement')
        // directly, so skip re-prefixing when a colon is already present.
        const namespacedKey = key.includes(':') ? key : `product:${key}`;
        return i18next.t(namespacedKey, options) as string;
    };
    // @sfdc-extension-block-end SFDC_EXT_PRODUCT_CONTENT

    return {
        product,
        page,
        pageKey: productId,
        pageUrl,
        productSchema: productSchemaPromise,
        // Catalog-derived "You might also like" — other watches from this timepiece's collection.
        // Replaces the live Einstein recommender (empty on this instance) with an always-on,
        // deterministic rail, mirroring the furniture vertical's category-based recommendations.
        alsoBuyRecommendations: fetchCollectionCandidatePool(context, product).then((hits) =>
            deriveYouMightAlsoLike(hits, product)
        ),
        straps,
        // @sfdc-extension-block-start SFDC_EXT_BNPL
        bnplMessage: getBuyNowPayLaterMessage(productLookupId),
        bnplLearnMore: getBuyNowPayLaterLearnMore(productLookupId),
        // @sfdc-extension-block-end SFDC_EXT_BNPL
        // @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS
        reviewsSummary,
        reviewsList,
        writeReviewForm,
        // @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS
        // @sfdc-extension-block-start SFDC_EXT_PRODUCT_CONTENT
        pdpCollapsibles: Promise.all(
            resolvePdpSections(product).map((section) => {
                const promise =
                    'resolve' in section
                        ? section.resolve(product, tProduct)
                        : pdpSectionApi[section.apiMethod as keyof typeof pdpSectionApi](productLookupId);
                return promise.catch((error) => {
                    // Non-critical: a failed section is omitted so it can't reject the whole array.
                    // Log with context so a broken merchant `resolve`/API doesn't vanish silently.
                    logger.error('Error resolving PDP section in loader', { error, labelKey: section.labelKey });
                    return null;
                });
            })
        ),
        // @sfdc-extension-block-end SFDC_EXT_PRODUCT_CONTENT
    };
}

// Gates both the navigation axis (skip client-only param changes like color/size) and the action axis (skip the
// expensive loader re-run after cart/wishlist/account mutations that touch nothing the loader reads). The policy and
// its denylist live in the shared module so the rationale is documented and unit-tested in one place.
export const shouldRevalidate = shouldRevalidateProduct;

function ProductContent({
    product,
    url,
    straps,
    // @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS
    reviewsSummary,
    reviewsList,
    writeReviewForm,
    // @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS
    // @sfdc-extension-block-start SFDC_EXT_PRODUCT_CONTENT
    pdpCollapsiblesPromise,
    // @sfdc-extension-block-end SFDC_EXT_PRODUCT_CONTENT
}: {
    product: ShopperProducts.schemas['Product'];
    url: string;
    straps: ShopperProducts.schemas['Product'][];
    // @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS
    reviewsSummary: ReviewsSummaryData;
    reviewsList: Promise<ReviewsData>;
    writeReviewForm: Promise<WriteReviewFormData>;
    // @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS
    // @sfdc-extension-block-start SFDC_EXT_PRODUCT_CONTENT
    pdpCollapsiblesPromise: Promise<Array<SectionContent | null>>;
    // @sfdc-extension-block-end SFDC_EXT_PRODUCT_CONTENT
}) {
    const analytics = useAnalytics();
    const lastTrackedProductIdRef = useRef<string | null>(null);

    const primaryImage =
        product.imageGroups?.find((g) => g.viewType === 'large')?.images?.[0]?.link ??
        product.imageGroups?.[0]?.images?.[0]?.link;

    // Track product view on mount and whenever productData changes
    useEffect(() => {
        // Only track if we haven't already tracked this product
        if (product.id !== lastTrackedProductIdRef.current) {
            void analytics.trackViewProduct({
                product,
            });
            lastTrackedProductIdRef.current = product.id;
        }
    }, [analytics, product]);

    const isProductASet = isProductSet(product);
    const isProductABundle = isProductBundle(product);

    return (
        <ProductProvider product={product}>
            {/* @sfdc-extension-block-start SFDC_EXT_PRODUCT_CONTENT */}
            <ProductContentDataProvider product={product} pdpCollapsiblesPromise={pdpCollapsiblesPromise}>
                {/* @sfdc-extension-block-end SFDC_EXT_PRODUCT_CONTENT */}
                {/* @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS */}
                {/* Provider wraps ProductView so the in-page rating summary shares state
                        with the customer reviews accordion (expand/jump-to coordination). */}
                <ProductReviewsProvider summary={reviewsSummary} reviewsListPromise={reviewsList}>
                    <WriteReviewFormProvider writeReviewFormPromise={writeReviewForm}>
                        {/* @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS */}
                        <SeoMeta
                            title={product.name}
                            description={product.pageDescription || product.shortDescription}
                            openGraph={{
                                type: 'product',
                                url,
                                image: primaryImage,
                            }}
                        />
                        <ProductViewProvider
                            product={product}
                            mode="add"
                            // @sfdc-extension-block-start SFDC_EXT_BOPIS
                            clearDeferredPickupSelection
                            // @sfdc-extension-block-end SFDC_EXT_BOPIS
                        >
                            <div className="space-y-8">
                                {isProductASet || isProductABundle ? (
                                    <>
                                        <ProductView product={product} straps={straps} />
                                        <ChildProducts parentProduct={product} />
                                    </>
                                ) : (
                                    <ProductView product={product} straps={straps} />
                                )}

                                {/* @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS */}
                                <div className="section-container">
                                    <UITarget targetId="sfcc.pdp.reviews.section" />
                                    {/* @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS */}
                                    <UITarget targetId="sfcc.pdp.reviews.qna" />
                                </div>
                            </div>
                        </ProductViewProvider>
                        {/* @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS */}
                    </WriteReviewFormProvider>
                </ProductReviewsProvider>
                {/* @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS */}
                {/* @sfdc-extension-block-start SFDC_EXT_PRODUCT_CONTENT */}
            </ProductContentDataProvider>
            {/* @sfdc-extension-block-end SFDC_EXT_PRODUCT_CONTENT */}
        </ProductProvider>
    );
}

/**
 * Product detail shell that composes the page layout with granular Suspense boundaries.
 * Regions render independently (they manage their own async via Suspense/Await),
 * while the core product content renders synchronously from the resolved loader data.
 */
function ProductDetailView({ loaderData }: { loaderData: ProductPageData }) {
    const { t } = useTranslation('product');
    const content = (
        <div className="min-h-screen bg-background">
            <Region page={loaderData.page} regionId="promoContent" />

            {loaderData.product.primaryCategory ? (
                <div className="section-container py-2 [&_nav]:mb-0">
                    <CategoryBreadcrumbs category={loaderData.product.primaryCategory} />
                </div>
            ) : null}

            {/* Gallery + buy box sit flush under the fixed header. */}
            <ProductContent
                product={loaderData.product}
                url={loaderData.pageUrl}
                straps={loaderData.straps}
                // @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS
                reviewsSummary={loaderData.reviewsSummary}
                reviewsList={loaderData.reviewsList}
                writeReviewForm={loaderData.writeReviewForm}
                // @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS
                // @sfdc-extension-block-start SFDC_EXT_PRODUCT_CONTENT
                pdpCollapsiblesPromise={loaderData.pdpCollapsibles}
                // @sfdc-extension-block-end SFDC_EXT_PRODUCT_CONTENT
            />

            <div className="section-container pb-16">
                <div className="mt-16 space-y-16" data-testid="luxury-also-buy">
                    <ProductRecommendations
                        data={loaderData.alsoBuyRecommendations}
                        recommenderTitle={t('recommendations.youMightAlsoLike')}
                        fallback={<ProductRecommendationSkeleton title={t('recommendations.youMightAlsoLike')} />}
                        className="max-w-none px-0"
                    />
                </div>
                <Region className="mt-16" page={loaderData.page} regionId="engagementContent" />
            </div>
        </div>
    );

    let finalContent = content;
    // @sfdc-extension-block-start SFDC_EXT_BOPIS
    finalContent = <PickupProvider>{finalContent}</PickupProvider>;
    // @sfdc-extension-block-end SFDC_EXT_BOPIS
    // @sfdc-extension-block-start SFDC_EXT_BNPL
    finalContent = (
        <BnplProvider messagePromise={loaderData.bnplMessage} learnMorePromise={loaderData.bnplLearnMore}>
            {finalContent}
        </BnplProvider>
    );
    // @sfdc-extension-block-end SFDC_EXT_BNPL
    // @sfdc-extension-block-start SFDC_EXT_SHIPPING_DELIVERY
    finalContent = (
        <ShippingDeliveryProvider productId={loaderData.product.id}>{finalContent}</ShippingDeliveryProvider>
    );
    // @sfdc-extension-block-end SFDC_EXT_SHIPPING_DELIVERY

    return finalContent;
}

/**
 * Product page component that displays a product with its details and category breadcrumbs.
 * The page key ensures React only remounts when navigating to a different product, not variants.
 * @returns JSX element representing the product page with Suspense boundary
 */
export default function ProductPage({ loaderData }: { loaderData: ProductPageData }) {
    // Use pageKey from loaderData to force remount only when productId changes
    // This prevents showing skeleton when switching variants (pid parameter)
    const pageKey = loaderData.pageKey;

    const rootData = useRouteLoaderData<typeof rootLoader>('root');
    const nonce = rootData?.nonce ?? undefined;

    return (
        <Fragment key={pageKey}>
            <ProductDetailView loaderData={loaderData} />

            {/* Product JSON-LD Schema for SEO - render after page content so it appears at end of body flow.
                JSON-LD is non-critical: errorElement renders nothing so a schema-generation failure
                silently degrades to no <script> tag. */}
            <Suspense fallback={null}>
                <Await resolve={loaderData.productSchema} errorElement={null}>
                    {(productSchema) =>
                        productSchema ? <JsonLd data={productSchema} id="product-schema" nonce={nonce} /> : null
                    }
                </Await>
            </Suspense>
        </Fragment>
    );
}
