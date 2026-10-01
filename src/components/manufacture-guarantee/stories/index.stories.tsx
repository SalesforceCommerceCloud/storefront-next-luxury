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
import ManufactureGuarantee from '../index';

const meta: Meta<typeof ManufactureGuarantee> = {
    title: 'Products/Manufacture Guarantee',
    component: ManufactureGuarantee,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ManufactureGuarantee>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('luxury-manufacture-guarantee')).toBeVisible();
        await expect(canvas.getByRole('img', { name: /international guarantee card/i })).toBeVisible();
        await expect(canvas.getByText(/two-year international guarantee/i)).toBeVisible();
        await userEvent.click(canvas.getByRole('button', { name: /presentation box/i }));
        await expect(canvas.getByText(/presentation box, with a pouch/i)).toBeVisible();
    },
};
