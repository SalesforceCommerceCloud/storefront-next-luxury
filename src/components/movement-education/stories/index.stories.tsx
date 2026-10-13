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
import MovementEducation from '../index';

const meta: Meta<typeof MovementEducation> = {
    title: 'Products/Movement Education',
    component: MovementEducation,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof MovementEducation>;

export const Default: Story = {
    args: { product: { c_movementType: 'automatic' } },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        // Find and click the movement education trigger button
        const trigger = await canvas.findByTestId('movement-education', {}, { timeout: 5000 });
        await expect(trigger).toBeInTheDocument();
        await userEvent.click(trigger);

        // Dialog renders in a portal, so check document.body
        const body = within(canvasElement.ownerDocument.body);

        // Wait for dialog to open and verify it's in the open state
        const dialog = await body.findByRole('dialog', {}, { timeout: 5000 });
        await expect(dialog).toBeInTheDocument();
        await expect(dialog).toHaveAttribute('data-state', 'open');

        // Verify the tab structure is present (common to all movement types)
        const automaticTab = await body.findByRole('tab', { name: /automatic/i }, { timeout: 5000 });
        await expect(automaticTab).toBeInTheDocument();
        await expect(automaticTab).toHaveAttribute('aria-selected', 'true');

        // Verify the panel content is present (the actual panel corresponding to the selected tab)
        const automaticPanel = dialog.querySelector('[role="tabpanel"][id="movement-panel-automatic"]');
        await expect(automaticPanel).toBeInTheDocument();
    },
};
