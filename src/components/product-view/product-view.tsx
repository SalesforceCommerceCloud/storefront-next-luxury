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
import { useCallback, useEffect, useMemo, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { ShopperProducts } from '@/scapi';
import { FadeThroughImage } from '@/components/fade-through-image';
import ProductCartActions from '@/components/product-cart-actions';
import ProductPrice from '@/components/product-price';
import ProductViewProvider, { useOptionalProductView } from '@/providers/product-view';
import { useProductImages } from '@/hooks/product/use-product-images';
import { useSelectedVariations } from '@/hooks/product/use-selected-variations';
import { isProductSet, isProductBundle } from '@/lib/product/product-utils';
import { usesInlineAddToCartQuantity } from '@/lib/product/add-to-cart-quantity-mode';
import { findImageGroupBy } from '@/lib/product/image-groups-utils';
import { UITarget } from '@/targets/ui-target';
import { useSite } from '@salesforce/storefront-next-runtime/site-context';
import WatchConfigurator, { type WatchConfiguratorSelection, type WatchConfiguratorStep } from '../watch-configurator';
import CaseSizeVisualizer from '../case-size-visualizer';
import MovementEducation from '../movement-education';
import WaitlistSignup from '../waitlist-signup';
import BoutiqueBooking from '../boutique-booking';
import StrapSelector from '../strap-selector';
import CertificationSection from '../certification-section';
import PdpDetails from '../pdp-details';
import InventoryMessage, { InventoryStatus } from '@/components/inventory-message';
import {
    collectionDisplayName,
    getCaseDiameter,
    getCollection,
    getReferenceNumber,
    isLimitedEdition,
    requiresBoutiqueAppointment,
} from '../../lib/luxury-product';
import { optionVisual } from '../../lib/configurator-visuals';

interface ProductViewProps {
    product: ShopperProducts.schemas['Product'];
    /** Compatible straps for this watch, resolved by the PDP loader from `c_compatibleMasters`. */
    straps?: ShopperProducts.schemas['Product'][];
    mode?: 'add' | 'edit';
}

/** Size is shown as wrist presence, not a fake 40/42/44 SKU picker. */
const HIDDEN_AXES = new Set(['caseSize']);

/**
 * Native SFCC swatch tile for a variation value, read from the product's `viewType=swatch` image-groups
 * (bandType is the declared native swatch axis in the dataset). Returns the absolute SCAPI/DIS image link,
 * or undefined when this axis/value ships no swatch group (e.g. rubber/tropic straps, or dial/case colours).
 */
function swatchImageLink(
    product: ShopperProducts.schemas['Product'],
    attributeId: string,
    value: string
): string | undefined {
    if (!product.imageGroups) return undefined;
    const group = findImageGroupBy(product.imageGroups, {
        viewType: 'swatch',
        selectedVariationAttributes: { [attributeId]: value },
    });
    const matchesAxis = group?.variationAttributes?.some((attr) => attr.id === attributeId);
    return matchesAxis ? group?.images?.[0]?.link : undefined;
}

function stepsFromProduct(product: ShopperProducts.schemas['Product']): WatchConfiguratorStep[] {
    return (product.variationAttributes ?? [])
        .filter((attr) => attr.id && !HIDDEN_AXES.has(attr.id))
        .map((attr) => ({
            id: attr.id ?? '',
            name: attr.name ?? attr.id ?? '',
            options: (attr.values ?? []).map((value) => {
                const id = value.value ?? '';
                // Colour chip / filter from config; the strap photo tile (if any) comes from the dataset.
                const visual = optionVisual(attr.id ?? '', id);
                const image = swatchImageLink(product, attr.id ?? '', id);
                return {
                    value: id,
                    name: value.name ?? value.value ?? '',
                    ...visual,
                    ...(image ? { image } : {}),
                };
            }),
        }));
}

function combinationsFromProduct(product: ShopperProducts.schemas['Product']): WatchConfiguratorSelection[] {
    return (product.variants ?? [])
        .map((variant) => variant.variationValues)
        .filter((values): values is Record<string, string> => Boolean(values));
}

/**
 * Seed configurator from the first orderable variant so dial + strap start
 * selected rather than showing "Choose". Merged with singles so single-value
 * axes (caseMaterial) and the case diameter still resolve correctly.
 */
function firstVariantSelection(product: ShopperProducts.schemas['Product']): WatchConfiguratorSelection {
    const variant = product.variants?.find((v) => v.orderable !== false) ?? product.variants?.[0];
    const values = variant?.variationValues ?? {};
    const result: WatchConfiguratorSelection = {};
    for (const [key, val] of Object.entries(values)) {
        if (typeof val === 'string' && val) result[key] = val;
    }
    return result;
}

/** Single-value axes (and the real case diameter) must still resolve the SKU. */
function singleValueSelection(product: ShopperProducts.schemas['Product']): WatchConfiguratorSelection {
    const seed: WatchConfiguratorSelection = {};
    const diameter = getCaseDiameter(product);
    for (const attr of product.variationAttributes ?? []) {
        if (!attr.id) continue;
        if (attr.id === 'caseSize') {
            const match = attr.values?.find(
                (value) => value.value === String(diameter) || value.name?.startsWith(`${diameter}`)
            );
            const fallback = attr.values?.[0]?.value;
            if (match?.value) seed.caseSize = match.value;
            else if (fallback) seed.caseSize = fallback;
            continue;
        }
        const only = attr.values?.length === 1 ? attr.values[0]?.value : undefined;
        if (only) seed[attr.id] = only;
    }
    return seed;
}

export default function ProductView({ product, straps, mode = 'add' }: ProductViewProps): ReactElement {
    const existing = useOptionalProductView();
    const body = <LuxuryPdp product={product} straps={straps} mode={mode} />;
    if (existing) return body;
    return (
        <ProductViewProvider product={product} mode={mode}>
            {body}
        </ProductViewProvider>
    );
}

function LuxuryPdp({ product, straps, mode = 'add' }: ProductViewProps): ReactElement {
    const [searchParams, setSearchParams] = useSearchParams();
    // URL-driven selection (no selectionsOverride). Two effects fall out of it:
    //  (a) it defaults to the LOADED variant's variationValues, so landing on ?pid=<variant> shows THAT
    //      variant's selection (not the first orderable one); and
    //  (b) with no override, the provider's useCurrentVariant syncs ?pid on change, so selecting an
    //      option reloads the route with the resolved variant (price / availability / gallery follow).
    // The former modal-style override suppressed both (useCurrentVariant skips the ?pid sync under an
    // override, and the override shadowed the loaded variant's own values).
    const selectedAttributes = useSelectedVariations({ product });
    const { galleryImages } = useProductImages({ product, selectedAttributes });
    const { t: tw } = useTranslation('watch');
    const { currency } = useSite();
    const heroImages = galleryImages.slice(0, 1);
    const storyImages = galleryImages.slice(1);
    const steps = useMemo(() => stepsFromProduct(product), [product]);
    const combos = useMemo(() => combinationsFromProduct(product), [product]);
    const firstVariant = useMemo(() => firstVariantSelection(product), [product]);
    const singles = useMemo(() => singleValueSelection(product), [product]);

    // Selecting an option writes the variation axes to the URL (like the canonical swatch links), so
    // useSelectedVariations reflects it immediately (pending-nav aware) and useCurrentVariant resolves
    // the variant + sets ?pid → the loader re-fetches that variant.
    const handleConfigChange = useCallback(
        (next: WatchConfiguratorSelection) => {
            // Write the configurator's selection verbatim — `next` is already the full desired
            // selection with any axis the new choice invalidated dropped by WatchConfigurator.
            // Merging over the stale URL-derived `selectedAttributes` would restore that pruned
            // axis and leave its option both aria-checked and disabled, so delete axes absent
            // from `next` instead (they fall back to a compatible default, or "Choose"). Hidden /
            // single-value axes are never pruned, so they stay present in `next`.
            const params = new URLSearchParams(searchParams);
            for (const attr of product.variationAttributes ?? []) {
                if (!attr.id) continue;
                const value = next[attr.id];
                if (value) params.set(attr.id, value);
                else params.delete(attr.id);
            }
            setSearchParams(params, { replace: true, preventScrollReset: true });
        },
        [product, searchParams, setSearchParams]
    );

    // Direct master URL (no ?pid): seed the URL from the first orderable variant so the configurator
    // shows a complete default and Add to Cart resolves — mirrors arriving on a variant from the PLP.
    const needsSeed = steps.some((step) => !selectedAttributes[step.id]);
    useEffect(() => {
        if (!needsSeed) return;
        const seed = { ...firstVariant, ...singles };
        const params = new URLSearchParams(searchParams);
        let changed = false;
        for (const attr of product.variationAttributes ?? []) {
            if (attr.id && !params.get(attr.id) && seed[attr.id]) {
                params.set(attr.id, seed[attr.id]);
                changed = true;
            }
        }
        if (changed) setSearchParams(params, { replace: true, preventScrollReset: true });
    }, [needsSeed, firstVariant, singles, product, searchParams, setSearchParams]);

    const appointmentOnly = requiresBoutiqueAppointment(product);
    const limitedOos = isLimitedEdition(product) && product.inventory?.orderable === false;
    const isProductASet = isProductSet(product);
    const isProductABundle = isProductBundle(product);
    const collection = collectionDisplayName(getCollection(product));
    const reference = getReferenceNumber(product);

    return (
        <div data-slot="luxury-pdp">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch">
                <div
                    data-slot="luxury-pdp-hero"
                    data-testid="luxury-pdp-hero"
                    className="flex min-h-[70vh] items-center justify-center bg-muted/80 px-[var(--page-gutter)] lg:min-h-[calc(100vh-var(--header-height,72px))]">
                    <FadeThroughImage
                        key={product.id}
                        src={heroImages[0]?.src ?? ''}
                        alt={heroImages[0]?.alt ?? product.name}
                        priority="high"
                        widths={{ base: '100vw', lg: '50vw', '2xl': 680 }}
                        className="aspect-square w-full max-w-2xl"
                    />
                    <UITarget targetId="sfcc.pdp.agent.productHelper" />
                </div>

                <div className="bg-card px-[var(--page-gutter)] py-8 lg:py-10">
                    <div className="flex flex-col gap-6">
                        {collection && (
                            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                {collection}
                            </p>
                        )}
                        <h1 className="font-serif text-4xl md:text-5xl font-normal tracking-tight leading-[1.15]">
                            {product.name}
                        </h1>
                        {reference && (
                            <p className="font-mono text-xs text-muted-foreground">
                                {tw('reference', { ref: reference })}
                            </p>
                        )}
                        <CertificationSection product={product} />
                        <ProductPrice
                            product={product}
                            currency={currency ?? 'USD'}
                            labelForA11y={product.name}
                            currentPriceProps={{ className: 'font-serif text-lg font-normal' }}
                        />
                        <WatchConfigurator
                            steps={steps}
                            value={selectedAttributes}
                            validCombinations={combos}
                            onChange={handleConfigChange}
                        />
                        <InventoryMessage
                            product={product}
                            {...(limitedOos ? { getInventoryStatus: () => InventoryStatus.ALLOCATED } : {})}
                        />
                        {limitedOos && <WaitlistSignup productId={product.id} />}
                        <div className="flex flex-col gap-3">
                            {!appointmentOnly && !limitedOos && mode === 'add' && (
                                <ProductCartActions
                                    product={product}
                                    showInlineCartQuantity={
                                        !isProductASet && !isProductABundle && usesInlineAddToCartQuantity()
                                    }
                                />
                            )}
                            <BoutiqueBooking
                                productId={product.id}
                                intent={appointmentOnly ? 'appointment' : 'browse'}
                            />
                        </div>
                        <CaseSizeVisualizer product={product} />
                        <MovementEducation product={product} />
                        {straps && straps.length > 0 && <StrapSelector straps={straps} />}
                        <UITarget targetId="sfcc.pdp.returnsWarranty" />
                        <UITarget targetId="sfcc.pdp.collapsibles" />
                    </div>
                </div>
            </div>

            <div className="section-container pb-16">
                <PdpDetails product={product} images={storyImages} />
            </div>
        </div>
    );
}
