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
import { expect, userEvent, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import WatchConfigurator from '../index';

const steps = [
    {
        id: 'case',
        name: 'Case',
        options: [
            { value: 'steel', name: 'Steel', swatch: '#C5C8CB' },
            { value: 'gold', name: 'Gold', swatch: '#C9A227' },
        ],
    },
    {
        id: 'dial',
        name: 'Dial',
        options: [
            { value: 'black', name: 'Black', swatch: '#1C1C1C' },
            { value: 'blue', name: 'Blue', swatch: '#1E3A5F' },
        ],
    },
];

const visualSteps = [
    {
        id: 'bandType',
        name: 'Strap',
        options: [
            {
                value: 'leather_black',
                name: 'Leather Black',
                image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-strap-alligator-black.webp',
            },
            {
                value: 'nato_navy',
                name: 'NATO Navy',
                image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-strap-nato-navy.webp',
            },
            {
                value: 'metal_bracelet',
                name: 'Steel bracelet',
                image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-strap-bracelet-steel.webp',
            },
        ],
    },
    {
        id: 'dialColor',
        name: 'Dial',
        options: [
            { value: 'black', name: 'Black', swatch: '#1C1C1C' },
            { value: 'white', name: 'White', swatch: '#F4F1EA' },
            { value: 'blue', name: 'Blue', swatch: '#1E3A5F' },
        ],
    },
];

const meta: Meta<typeof WatchConfigurator> = {
    title: 'Products/Watch Configurator',
    component: WatchConfigurator,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof WatchConfigurator>;

export const Default: Story = {
    args: { steps },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('watch-configurator')).toBeVisible();
        await expect(canvas.getByRole('radiogroup', { name: 'Case' })).toBeVisible();
        await expect(canvas.getByRole('radiogroup', { name: 'Dial' })).toBeVisible();
    },
};

export const StrapAndDial: Story = {
    args: { steps: visualSteps },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('radiogroup', { name: 'Strap' })).toBeVisible();
        await userEvent.click(canvas.getByRole('radio', { name: 'NATO Navy' }));
        await expect(canvas.getByRole('radio', { name: 'NATO Navy' })).toHaveAttribute('aria-checked', 'true');
    },
};

export const UnavailableCombo: Story = {
    args: {
        steps,
        defaultValue: { case: 'steel' },
        validCombinations: [
            { case: 'steel', dial: 'black' },
            { case: 'gold', dial: 'blue' },
        ],
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('radiogroup', { name: 'Dial' })).toBeVisible();
        await expect(canvas.getByRole('radio', { name: 'Blue' })).toBeDisabled();
    },
};

export const SingleDimensionSkip: Story = {
    args: {
        steps: [
            { id: 'case', name: 'Case', options: [{ value: 'steel', name: 'Steel' }] },
            {
                id: 'dial',
                name: 'Dial',
                options: [
                    { value: 'black', name: 'Black', swatch: '#1C1C1C' },
                    { value: 'blue', name: 'Blue', swatch: '#1E3A5F' },
                ],
            },
        ],
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.queryByText('Case')).toBeNull();
        await expect(canvas.getByRole('radiogroup', { name: 'Dial' })).toBeVisible();
    },
};
