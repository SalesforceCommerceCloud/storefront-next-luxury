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
import type { ReactElement } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import { ConfigProvider } from '@salesforce/storefront-next-runtime/config';
import { SiteProvider } from '@salesforce/storefront-next-runtime/site-context';
import { mockConfig, mockLocale, mockSiteObject } from '@/test-utils/config';
import WatchFinderTool from '../index';
import type { ShopperSearch } from '@/scapi';

const mockHits: ShopperSearch.schemas['ProductSearchHit'][] = [
    {
        productId: 'ln-heritage-001',
        productName: 'Classic Automatic',
        price: 4500,
        currency: 'USD',
        image: {
            link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-heritage-001.webp',
        },
        c_collection: 'heritage',
        c_caseDiameter: 40,
        c_movement: 'automatic',
    },
    {
        productId: 'ln-sport-001',
        productName: 'Sport Chrono',
        price: 6500,
        currency: 'USD',
        image: {
            link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-sport-001.webp',
        },
        c_collection: 'sport',
        c_caseDiameter: 42,
        c_movement: 'automatic',
    },
    {
        productId: 'ln-dive-001',
        productName: 'Professional Diver',
        price: 7200,
        currency: 'USD',
        image: {
            link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-dive-001.webp',
        },
        c_collection: 'dive',
        c_caseDiameter: 44,
        c_movement: 'automatic',
    },
] as ShopperSearch.schemas['ProductSearchHit'][];

const meta: Meta<typeof WatchFinderTool> = {
    title: 'Products/Watch Finder Tool',
    component: WatchFinderTool,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'fullscreen' },
    decorators: [
        // The global preview stack (`withRouter(StoryShell)`) already supplies the router + providers;
        // wrap only in the luxury site/config context here. A nested RouterProvider throws
        // "You cannot render a <Router> inside another <Router>" under the mirror storybook run.
        (Story): ReactElement => (
            <ConfigProvider config={mockConfig}>
                <SiteProvider
                    site={mockSiteObject}
                    locale={mockLocale}
                    language={mockSiteObject.defaultLocale}
                    currency={mockSiteObject.defaultCurrency}>
                    <Story />
                </SiteProvider>
            </ConfigProvider>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof WatchFinderTool>;

export const Default: Story = {
    args: { hits: mockHits },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('watch-finder')).toBeVisible();
        await expect(canvas.getByRole('heading', { name: /five considered questions/i })).toBeVisible();
        await userEvent.click(canvas.getByRole('button', { name: /^begin$/i }));
        await expect(canvas.getByRole('heading', { name: /investment range/i })).toBeVisible();
        await userEvent.click(canvas.getByRole('button', { name: /under \$5,000/i }));
        await userEvent.click(canvas.getByRole('button', { name: /^next$/i }));
        await expect(canvas.getByRole('heading', { name: /your style/i })).toBeVisible();
    },
};
