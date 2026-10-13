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
import type { Meta, StoryObj } from '@storybook/react-vite';
import ProductTile from '../index';
import { ConfigProvider } from '@salesforce/storefront-next-runtime/config';
import { mockConfig, mockLocale, mockSiteObject } from '@/test-utils/config';
import { SiteProvider } from '@salesforce/storefront-next-runtime/site-context';
import DynamicImageProvider from '@/providers/dynamic-image';
import { ProductTileProvider } from '@/components/product-tile/context';
import { expect, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import type { ShopperSearch } from '@/scapi';

const diameterHit = {
    productId: 'ln-heritage-001',
    productName: 'Classic Automatic',
    price: 6200,
    currency: 'USD',
    image: {
        alt: 'Classic Automatic',
        link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-heritage-001.webp',
    },
    c_collection: 'heritage',
    c_caseDiameter: 40,
    representedProduct: { id: 'ln-heritage-001' },
} as unknown as ShopperSearch.schemas['ProductSearchHit'];

const limitedHit = {
    ...diameterHit,
    productId: 'ln-limited-001',
    productName: 'Founders Edition',
    c_isLimitedEdition: true,
    c_collection: 'limited_edition',
} as unknown as ShopperSearch.schemas['ProductSearchHit'];

const meta: Meta<typeof ProductTile> = {
    title: 'Products/Product Tile/Product Tile',
    component: ProductTile,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
    decorators: [
        (Story) => (
            <ConfigProvider config={mockConfig}>
                <SiteProvider
                    site={mockSiteObject}
                    locale={mockLocale}
                    language={mockSiteObject.defaultLocale}
                    currency={mockSiteObject.defaultCurrency}>
                    <DynamicImageProvider value={{ widths: ['50vw', '50vw', '15vw'] }}>
                        <ProductTileProvider>
                            <div className="w-64">
                                <Story />
                            </div>
                        </ProductTileProvider>
                    </DynamicImageProvider>
                </SiteProvider>
            </ConfigProvider>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof ProductTile>;

export const WithDiameter: Story = {
    args: { product: diameterHit },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        // The tile renders the name twice — the visible link + an sr-only price-announcement
        // live region — so match all and assert the first is visible (avoids a "multiple elements" error).
        await expect(within(canvasElement).getAllByText(/Classic Automatic/)[0]).toBeVisible();
        await expect(within(canvasElement).getByText('40mm')).toBeVisible();
    },
};

export const Limited: Story = {
    args: { product: limitedHit },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        // Name appears twice (visible link + sr-only price live region) — match all, assert first visible.
        await expect(within(canvasElement).getAllByText(/Founders Edition/)[0]).toBeVisible();
    },
};
