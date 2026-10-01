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
import type { LoaderFunctionArgs } from 'react-router';
import type { ShopperProducts, ShopperSearch } from '@/scapi';
import type { Recommendation } from '@/hooks/recommenders/use-recommenders';
import { fetchCarouselProducts } from '@/components/product-carousel/loaders';
import { siteContext, type SiteContext } from '@salesforce/storefront-next-runtime/site-context';

/** Wide enough candidate pool to survive self-exclusion without a second round-trip. */
const CANDIDATE_POOL_SIZE = 24;

/**
 * Product ids that mean "this is the watch on the current PDP": the current variant's sku
 * (`product.id`) plus its master sku and any represented-product ids. Mirrors furniture/footwear.
 */
function currentProductIdentity(product: ShopperProducts.schemas['Product']): Set<string> {
    const ids = new Set<string>();
    if (product.id) ids.add(product.id);
    const masterId = product.master?.masterId;
    if (masterId) ids.add(masterId);
    const repProducts = product.representedProducts;
    if (Array.isArray(repProducts)) {
        for (const rep of repProducts) {
            if (rep?.id) ids.add(rep.id);
        }
    }
    return ids;
}

/** Every product id a search hit can carry back to a concrete product. Mirrors furniture/footwear. */
function isCurrentProduct(hit: ShopperSearch.schemas['ProductSearchHit'], identity: Set<string>): boolean {
    if (identity.has(hit.productId)) return true;
    if (hit.representedProduct?.id && identity.has(hit.representedProduct.id)) return true;
    if ((hit.representedProducts ?? []).some((rep) => rep?.id != null && identity.has(rep.id))) return true;
    if ((hit.variants ?? []).some((variant) => variant?.productId != null && identity.has(variant.productId)))
        return true;
    return (hit.variationGroups ?? []).some((group) => group?.productId != null && identity.has(group.productId));
}

/**
 * Catalog-derived "You might also like" pool for the luxury PDP: other timepieces from the
 * watch's own collection (its `primaryCategory`, e.g. Heritage / Dive / Aviation). This replaces
 * the live Einstein recommender — the same furniture does for its room rails — so the rail is
 * always-on and deterministic rather than depending on an Einstein model that may return nothing.
 * Returns an empty pool when the watch has no category or the search fails, so the rail degrades
 * to nothing (ProductRecommendations fails closed) rather than surfacing an error.
 */
export async function fetchCollectionCandidatePool(
    context: LoaderFunctionArgs['context'],
    product: ShopperProducts.schemas['Product']
): Promise<ShopperSearch.schemas['ProductSearchHit'][]> {
    const categoryId = product.primaryCategory?.id ?? product.primaryCategoryId;
    if (!categoryId) return [];

    const { currency } = context.get(siteContext) as SiteContext;
    const result = await fetchCarouselProducts(context, {
        categoryId,
        limit: CANDIDATE_POOL_SIZE,
        currency: currency ?? undefined,
    }).catch(() => null);

    return result?.hits ?? [];
}

/**
 * "You might also like" rail: other watches from the collection pool, excluding the current
 * timepiece. Pure derivation over an already-resolved pool — see {@link fetchCollectionCandidatePool}.
 */
export function deriveYouMightAlsoLike(
    hits: ShopperSearch.schemas['ProductSearchHit'][],
    product: ShopperProducts.schemas['Product'],
    limit = 12
): Recommendation {
    const identity = currentProductIdentity(product);
    const recs = hits.filter((hit) => !isCurrentProduct(hit, identity)).slice(0, limit);
    return recs.length ? { recs } : {};
}
