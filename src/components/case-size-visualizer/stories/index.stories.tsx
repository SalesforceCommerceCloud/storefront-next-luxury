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
import CaseSizeVisualizer from '../index';

const meta: Meta<typeof CaseSizeVisualizer> = {
    title: 'Products/Case Size Visualizer',
    component: CaseSizeVisualizer,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof CaseSizeVisualizer>;

export const Default: Story = {
    args: { product: { c_caseDiameter: 42 } },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /how it wears/i }));
        await userEvent.click(canvas.getByRole('radio', { name: /broad/i }));
        await expect(canvas.getByRole('radio', { name: /broad/i })).toHaveAttribute('aria-checked', 'true');
        await expect(canvas.getByTestId('case-size-coverage')).toHaveTextContent(/71%/);
    },
};
