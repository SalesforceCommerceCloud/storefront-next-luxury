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

/**
 * Test-only mock helpers for luxury watch data. Provides realistic SCAPI-shaped
 * mocks that exercise luxury-specific behavior (variants, straps, appointments).
 *
 * DO NOT import this from any runtime/ship code — tests only.
 */

import type { ShopperProducts, ShopperSearch } from '@/scapi';
import type { AppointmentPiece } from '@/lib/appointment';

/**
 * Versioned DIS/SCAPI base that mirrors the shape of real luxury product image links. Catalog
 * imagery ships in the dataset (served via SCAPI), never in the app bundle — mocks use this base
 * rather than bundled `/images/...` paths.
 */
const LUXURY_IMAGE_BASE =
    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products';

/**
 * Creates a realistic luxury watch master product with full variation support.
 * Includes orderable variants, variant-tagged hero images, and custom attributes.
 */
export function createMockLuxuryWatch(
    overrides?: Partial<ShopperProducts.schemas['Product']>
): ShopperProducts.schemas['Product'] {
    const baseId = (overrides?.id as string) ?? 'ln-heritage-001';
    const basePrice = (overrides?.price as number) ?? 2500;

    return {
        id: baseId,
        name: 'The Classic Automatic',
        price: basePrice,
        currency: 'USD',
        shortDescription: 'Heritage Collection · 40mm',
        longDescription:
            'A timeless automatic watch from our Geneva manufacture. Features the LN-3001 movement with 38-hour power reserve and Swiss craftsmanship.',
        type: { master: true },
        c_referenceNumber: 'LN-HER-001-SS-LB-BK',
        c_collection: 'heritage',
        c_movementType: 'automatic',
        c_movementCaliber: 'LN-3001',
        c_powerReserve: 38,
        c_caseMaterial: 'stainless_steel',
        c_caseDiameter: 40,
        c_caseThickness: 11.5,
        c_lugWidth: 20,
        c_crystal: 'sapphire',
        c_waterResistance: 50,
        variationAttributes: [
            {
                id: 'caseMaterial',
                name: 'Case Material',
                values: [{ value: 'stainless_steel', name: 'Stainless Steel', orderable: true }],
            },
            {
                id: 'dialColor',
                name: 'Dial',
                values: [
                    { value: 'black', name: 'Black', orderable: true },
                    { value: 'white', name: 'White', orderable: true },
                ],
            },
            {
                id: 'bandType',
                name: 'Strap',
                values: [
                    { value: 'leather_black', name: 'Leather Black', orderable: true },
                    { value: 'leather_brown', name: 'Leather Brown', orderable: true },
                ],
            },
            {
                id: 'caseSize',
                name: 'Size',
                values: [{ value: '40', name: '40mm', orderable: true }],
            },
        ],
        variants: [
            {
                productId: `${baseId}-steel-leather-black-black-40`,
                variationValues: {
                    caseMaterial: 'stainless_steel',
                    dialColor: 'black',
                    bandType: 'leather_black',
                    caseSize: '40',
                },
                orderable: true,
                price: basePrice,
            },
            {
                productId: `${baseId}-steel-leather-black-white-40`,
                variationValues: {
                    caseMaterial: 'stainless_steel',
                    dialColor: 'white',
                    bandType: 'leather_black',
                    caseSize: '40',
                },
                orderable: true,
                price: basePrice,
            },
            {
                productId: `${baseId}-steel-leather-brown-black-40`,
                variationValues: {
                    caseMaterial: 'stainless_steel',
                    dialColor: 'black',
                    bandType: 'leather_brown',
                    caseSize: '40',
                },
                orderable: true,
                price: basePrice,
            },
        ],
        imageGroups: [
            {
                viewType: 'large',
                images: [
                    { link: `${LUXURY_IMAGE_BASE}/${baseId}.webp`, alt: 'The Classic Automatic' },
                    { link: `${LUXURY_IMAGE_BASE}/${baseId}-wrist.webp`, alt: 'On wrist' },
                    { link: `${LUXURY_IMAGE_BASE}/${baseId}-angle.webp`, alt: 'Angle view' },
                    { link: `${LUXURY_IMAGE_BASE}/${baseId}-profile.webp`, alt: 'Profile view' },
                    { link: `${LUXURY_IMAGE_BASE}/${baseId}-detail.webp`, alt: 'Dial detail' },
                ],
            },
            {
                viewType: 'large',
                variationAttributes: [
                    { id: 'dialColor', values: [{ value: 'white' }] },
                    { id: 'bandType', values: [{ value: 'leather_black' }] },
                ],
                images: [
                    {
                        link: `${LUXURY_IMAGE_BASE}/${baseId}-white-leather-black.webp`,
                        alt: 'White dial with black leather',
                    },
                ],
            },
            {
                viewType: 'large',
                variationAttributes: [
                    { id: 'dialColor', values: [{ value: 'black' }] },
                    { id: 'bandType', values: [{ value: 'leather_brown' }] },
                ],
                images: [
                    {
                        link: `${LUXURY_IMAGE_BASE}/${baseId}-black-leather-brown.webp`,
                        alt: 'Black dial with brown leather',
                    },
                ],
            },
        ],
        inventory: {
            id: `inv-${baseId}`,
            ats: 10,
            orderable: true,
        },
        ...overrides,
    } as unknown as ShopperProducts.schemas['Product'];
}

/**
 * Creates a mock strap product compatible with luxury watches.
 */
export function createMockStrap(id = 'ln-strap-nato-navy'): ShopperProducts.schemas['Product'] {
    return {
        id,
        name: 'NATO Strap - Navy',
        price: 150,
        currency: 'USD',
        c_productType: 'strap',
        c_lugWidth: 20,
        imageGroups: [
            {
                viewType: 'large',
                images: [{ link: `/images/straps/${id}.webp`, alt: 'NATO Strap' }],
            },
        ],
        inventory: {
            id: `inv-${id}`,
            ats: 50,
            orderable: true,
        },
    } as unknown as ShopperProducts.schemas['Product'];
}

/**
 * Creates a mock appointment piece from a product.
 */
export function createMockAppointmentPiece(product: ShopperProducts.schemas['Product']): AppointmentPiece {
    return {
        id: product.id ?? 'ln-heritage-001',
        name: product.name ?? 'The Classic Automatic',
        reference: (product.c_referenceNumber as string) ?? 'LN-HER-001-SS-LB-BK',
        image: product.imageGroups?.[0]?.images?.[0]?.link ?? `${LUXURY_IMAGE_BASE}/ln-heritage-001.webp`,
        collection: 'Heritage Collection',
    };
}

/**
 * Creates a mock search hit from a product.
 */
export function createMockSearchHit(
    product: ShopperProducts.schemas['Product']
): ShopperSearch.schemas['ProductSearchHit'] {
    return {
        currency: product.currency,
        hitType: 'master',
        image: {
            alt: product.name ?? '',
            link: product.imageGroups?.[0]?.images?.[0]?.link ?? '',
        },
        price: product.price,
        productId: product.id ?? '',
        productName: product.name ?? '',
        representedProduct: {
            id: product.id,
        },
        c_collection: product.c_collection as string,
        c_referenceNumber: product.c_referenceNumber as string,
    } as unknown as ShopperSearch.schemas['ProductSearchHit'];
}

/**
 * Creates multiple mock watch search hits for recommendation lists.
 */
export function createMockSearchHits(count = 3): ShopperSearch.schemas['ProductSearchHit'][] {
    const watches = [
        { id: 'ln-heritage-001', name: 'The Classic Automatic', price: 2500, collection: 'heritage' },
        { id: 'ln-heritage-002', name: 'Dress Watch Steel', price: 3500, collection: 'heritage' },
        { id: 'ln-sport-003', name: 'Sport Chronograph', price: 2000, collection: 'sport' },
        { id: 'ln-dive-001', name: 'Professional Diver', price: 2800, collection: 'dive' },
        { id: 'ln-aviation-001', name: 'Dual Time Companion', price: 2600, collection: 'aviation' },
    ];

    return watches.slice(0, count).map((watch) =>
        createMockSearchHit({
            id: watch.id,
            name: watch.name,
            price: watch.price,
            currency: 'USD',
            c_collection: watch.collection,
            c_referenceNumber: `REF-${watch.id.toUpperCase()}`,
            imageGroups: [
                {
                    viewType: 'large',
                    images: [{ link: `${LUXURY_IMAGE_BASE}/${watch.id}.webp`, alt: watch.name }],
                },
            ],
        } as unknown as ShopperProducts.schemas['Product'])
    );
}
