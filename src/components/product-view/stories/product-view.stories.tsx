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
import ProductView from '../index';
import { mockStandardProductOrderable } from '@/components/__mocks__/standard-product';
import { ConfigProvider } from '@salesforce/storefront-next-runtime/config';
import { mockConfig, mockLocale, mockSiteObject } from '@/test-utils/config';
import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { action } from 'storybook/actions';
import { SiteProvider } from '@salesforce/storefront-next-runtime/site-context';
import StoreLocatorProvider from '@/extensions/store-locator/providers/store-locator';
import type { ShopperProducts } from '@/scapi';

const mockSite = mockSiteObject;

// Minimal luxury watch mock for story demos
const createLuxuryWatchMock = (
    id: string,
    name: string,
    price: number,
    isWaitlist = false
): ShopperProducts.schemas['Product'] =>
    ({
        id,
        name,
        price,
        currency: 'USD',
        shortDescription: `A luxury timepiece from the ${id.split('-')[1]} collection`,
        imageGroups: [
            {
                viewType: 'large',
                images: [
                    {
                        link: `https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/${id}.webp`,
                        alt: name,
                    },
                ],
            },
            // Native SFCC swatch group for the bandType axis — the configurator reads the strap swatch
            // tile from here (dataset/SCAPI), not from an app-bundled map.
            {
                viewType: 'swatch',
                variationAttributes: [{ id: 'bandType', values: [{ value: 'leather_black' }] }],
                images: [
                    {
                        link: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-strap-alligator-black.webp',
                        alt: 'Leather Black strap',
                    },
                ],
            },
        ],
        variationAttributes: [
            { id: 'dialColor', name: 'Dial', values: [{ value: 'black', name: 'Black' }] },
            { id: 'bandType', name: 'Strap', values: [{ value: 'leather_black', name: 'Leather Black' }] },
        ],
        inventory: isWaitlist ? { orderable: false, ats: 0 } : { orderable: true, ats: 10 },
    }) as unknown as ShopperProducts.schemas['Product'];

function ActionLogger({ children }: { children: ReactNode }): ReactElement {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;

        const logAction = action('interaction');

        const handleClick = (event: Event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const interactiveElement = target.closest('button, a, [role="button"]');
            if (interactiveElement) {
                event.preventDefault();
                event.stopPropagation();
                const label = interactiveElement.textContent?.trim().substring(0, 50) || 'unlabeled';
                const tag = interactiveElement.tagName.toLowerCase();

                if (label.match(/add to cart/i)) {
                    action('add-to-cart')({ label });
                } else if (label.match(/wishlist/i)) {
                    action('wishlist')({ label });
                } else {
                    logAction({ type: 'click', tag, label });
                }
            }
        };

        root.addEventListener('click', handleClick, true);
        return () => {
            root.removeEventListener('click', handleClick, true);
        };
    }, []);

    return <div ref={containerRef}>{children}</div>;
}

type SyntheticArgs = {
    productName: string;
    shortDescription: string;
};

const meta: Meta<typeof ProductView> = {
    title: 'Products/Product View/Product View',
    component: ProductView,
    // NOTE: no `chromatic-core` tag — that tag pulls a story into the source-level Chromatic core
    // build (all verticals combined, un-flattened), where this override would collide with the
    // canonical product-view story (identical `meta.title` → duplicate story id). Like every other
    // vertical override, the luxury PDP gets visual-regression coverage via the mirror snapshot
    // (`product-view-snapshot.tsx`), not the Chromatic core set.
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Main product detail page (PDP) layout. Renders the image gallery, ' +
                    'product info, cart actions, and below-the-fold accordion sections ' +
                    'driven by the `product` SCAPI shape. Use Playground to drive ' +
                    'long-name / long-description coverage; OutOfStock and MissingImages ' +
                    'cover data-shape variants.',
            },
        },
        a11y: {
            config: {
                rules: [
                    // In isolated Storybook context, heading hierarchy is incomplete (h1 -> h3)
                    // Real PDP page provides proper h1/h2 context from page layout
                    { id: 'heading-order', enabled: false },
                ],
            },
        },
    },
    argTypes: {
        product: { table: { disable: true } },
        mode: {
            control: 'inline-radio',
            options: ['add', 'edit'],
            description: 'Add-to-cart vs. edit-cart-line variant. Edit mode hides the wishlist button.',
        },
    },
    decorators: [
        (Story) => {
            // Mock window.fetch to prevent 404s from FAQ / EstimatedDelivery / ReturnsAndWarranty
            // children that fire fetches on mount.
            if (typeof window !== 'undefined') {
                window.fetch = async () =>
                    ({
                        ok: true,
                        json: async () => ({}),
                        text: async () => '',
                    }) as any;
            }
            return (
                <ConfigProvider config={mockConfig}>
                    <SiteProvider
                        site={mockSite}
                        locale={mockLocale}
                        language={mockSiteObject.defaultLocale}
                        currency={mockSiteObject.defaultCurrency}>
                        <StoreLocatorProvider>
                            <ActionLogger>
                                <div className="section-container py-4">
                                    <Story />
                                </div>
                            </ActionLogger>
                        </StoreLocatorProvider>
                    </SiteProvider>
                </ConfigProvider>
            );
        },
    ],
};

export default meta;
type Story = StoryObj<typeof ProductView>;
type StoryWithSynthetic = StoryObj<React.ComponentType<Parameters<typeof ProductView>[0] & Partial<SyntheticArgs>>>;

/**
 * Rich-but-realistic baseline. The Controls panel exposes the component's
 * `mode` prop alongside synthetic `productName` and `shortDescription` text
 * controls so QA can drive long-name and long-description coverage without
 * dedicated stories. View-changing data states (out-of-stock, missing images)
 * remain dedicated stories below.
 */
export const Playground: StoryWithSynthetic = {
    args: {
        mode: 'add',
        productName: mockStandardProductOrderable.product.name,
        shortDescription: mockStandardProductOrderable.product.shortDescription ?? '',
    },
    argTypes: {
        productName: {
            description: 'Synthetic: product display name (use for long-name coverage)',
            control: 'text',
            table: { category: 'Synthetic (data shape)' },
        },
        shortDescription: {
            description: 'Synthetic: short description shown under the title',
            control: 'text',
            table: { category: 'Synthetic (data shape)' },
        },
    },
    render: (args) => {
        const { productName, shortDescription, ...componentProps } = args;
        const product = {
            ...mockStandardProductOrderable.product,
            name: productName ?? mockStandardProductOrderable.product.name,
            shortDescription: shortDescription ?? mockStandardProductOrderable.product.shortDescription,
        };
        return <ProductView {...(componentProps as Parameters<typeof ProductView>[0])} product={product} straps={[]} />;
    },
};

/**
 * Image gallery has no images to render — layout collapses to a placeholder.
 * Worth a dedicated bookmarkable URL because the visual change is structural,
 * not just stylistic.
 */
export const MissingImages: Story = {
    parameters: {
        chromatic: { disableSnapshot: true },
    },
    args: {
        product: {
            ...mockStandardProductOrderable.product,
            imageGroups: [],
        },
        straps: [],
    },
};

/**
 * Out-of-stock — the cart action button and inventory messaging change.
 * Distinct enough visually to warrant a dedicated story rather than a Controls
 * toggle.
 */
export const OutOfStock: Story = {
    parameters: {
        chromatic: { disableSnapshot: true },
    },
    args: {
        product: {
            ...mockStandardProductOrderable.product,
            inventory: {
                id: 'inv-out',
                ats: 0,
                orderable: false,
                backorderable: false,
                preorderable: false,
            },
        },
        straps: [],
    },
};

export const PriceOnRequest: Story = {
    args: {
        product: createLuxuryWatchMock('ln-limited-005', 'Limited Edition Tourbillon', 0),
        straps: [],
    },
};

export const Waitlist: Story = {
    args: {
        product: createLuxuryWatchMock('ln-limited-001', 'Limited Edition Chrono', 5000, true),
        straps: [],
    },
};

export const FourDimensions: Story = {
    args: {
        product: createLuxuryWatchMock('ln-heritage-001', 'Classic Automatic', 2500),
        straps: [],
    },
};
