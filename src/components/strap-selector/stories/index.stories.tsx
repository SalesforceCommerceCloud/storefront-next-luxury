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
import { expect, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import StrapSelector from '../index';
import type { ShopperProducts } from '@/scapi';

const mockStraps: ShopperProducts.schemas['Product'][] = [
    {
        id: 'ln-strap-001',
        name: 'Black Alligator Strap',
        price: 450,
        currency: 'USD',
        imageGroups: [
            {
                images: [{ link: '/images/straps/alligator-black.webp', alt: 'Black Alligator Strap' }],
            },
        ],
    },
    {
        id: 'ln-strap-002',
        name: 'Brown Leather Strap',
        price: 350,
        currency: 'USD',
        imageGroups: [
            {
                images: [{ link: '/images/straps/leather-brown.webp', alt: 'Brown Leather Strap' }],
            },
        ],
    },
    {
        id: 'ln-strap-003',
        name: 'Navy Canvas Strap',
        price: 250,
        currency: 'USD',
        imageGroups: [
            {
                images: [{ link: '/images/straps/canvas-navy.webp', alt: 'Navy Canvas Strap' }],
            },
        ],
    },
] as ShopperProducts.schemas['Product'][];

const meta: Meta<typeof StrapSelector> = {
    title: 'Products/Strap Selector',
    component: StrapSelector,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof StrapSelector>;

export const Default: Story = {
    args: { straps: mockStraps },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        await expect(within(canvasElement).getByTestId('strap-selector')).toBeVisible();
    },
};
