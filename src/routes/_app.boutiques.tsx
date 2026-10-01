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
import type { ShopperStores } from '@/scapi';
import { SeoMeta } from '@/components/seo-meta';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import BoutiqueLocator from '@/components/boutique-locator';
import { fetchBoutiques } from '@/lib/stores.server';
import { fetchCategories } from '@/lib/api/categories.server';
import { fetchProductById } from '@/lib/api/products.server';
import { toAppointmentPiece, type AppointmentPiece } from '@/lib/appointment';
import { boutiqueImagePath } from '../lib/boutiques';
import { resolveStoreImageUrl } from '../lib/store-image';

export type BoutiquesPageData = {
    pageUrl: string;
    stores: ShopperStores.schemas['Store'][];
    productId?: string;
    productName?: string;
    piece?: AppointmentPiece;
    catalog: AppointmentPiece[];
};

export async function loader({ request, context }: LoaderFunctionArgs): Promise<BoutiquesPageData> {
    const requestUrl = new URL(request.url);
    const requestedId = requestUrl.searchParams.get('product')?.trim() || undefined;

    // Only resolve a piece when one arrived from a PDP (`?product=`). The appointment flow no longer
    // offers a browse-all picker, so there is no catalog search here — an unconditional `cgid=root`
    // search over the whole catalog could time out and take the entire page down with it.
    // `categories` is fetched solely as a version prefix template for boutique facade images (see below);
    // it must never take the page down, so its failure is swallowed to an empty list.
    const [stores, product, categories] = await Promise.all([
        fetchBoutiques(context),
        requestedId ? fetchProductById(context, requestedId).catch(() => null) : Promise.resolve(null),
        fetchCategories(context, 'root', 1).catch(() => []),
    ]);

    const piece = product ? toAppointmentPiece(product) : undefined;

    // Boutique facades are provisioned in the storefront catalog static (same repo as category images),
    // and SCAPI returns the store's `image` as a catalog-relative path. Resolve it to a DIS URL by
    // borrowing the version prefix from any category image — dropping the version segment so DIS serves
    // the current one. No-op (store keeps its original image) when nothing is resolvable, so the tiles
    // degrade to text exactly as before until the boutique `<image>` values are imported.
    const config = getConfig(context);
    const templateUrl = categories
        .map((category) => category.image)
        .find((url): url is string => typeof url === 'string' && url.length > 0);
    const resolvedStores = stores.map((store) => {
        const resolved = resolveStoreImageUrl(boutiqueImagePath(store), templateUrl, config);
        return resolved ? { ...store, image: resolved } : store;
    });

    return {
        pageUrl: buildCanonicalUrl(requestUrl.origin, requestUrl.pathname, requestUrl.search),
        stores: resolvedStores,
        productId: piece?.id ?? requestedId,
        productName: piece?.name,
        piece,
        catalog: [],
    };
}

export default function BoutiquesPage({ loaderData }: { loaderData: BoutiquesPageData }): ReactElement {
    const { t } = useTranslation('watch');

    return (
        <div className="flex h-full min-h-0 w-full flex-1 flex-col">
            <SeoMeta
                rawTitle
                title={t('boutiquesPage.title')}
                description={t('boutiquesPage.body')}
                openGraph={{ type: 'website', url: loaderData.pageUrl }}
            />
            <BoutiqueLocator
                stores={loaderData.stores}
                productId={loaderData.productId}
                productName={loaderData.productName}
                piece={loaderData.piece}
                catalog={loaderData.catalog}
            />
        </div>
    );
}
