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
import CategoryBanner from '../index';

const PLP_ROUTE_ID = 'routes/_app.c.$';

const meta: Meta<typeof CategoryBanner> = {
    title: 'Category/Category Banner',
    component: CategoryBanner,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof CategoryBanner>;

export const HeritageIntro: Story = {
    parameters: {
        routeLoaderData: {
            [PLP_ROUTE_ID]: {
                category: {
                    id: 'heritage',
                    name: 'Heritage',
                    pageDescription:
                        'Dress watches from our Geneva manufacture — considered proportions, finishing you can feel.',
                    parentCategoryTree: [{ id: 'root', name: 'Root' }],
                },
                searchResultCritical: { total: 12 },
            },
        },
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        // Wait for the heading to ensure the component has rendered
        const heading = await canvas.findByRole('heading', { level: 1, name: /Heritage/i }, { timeout: 5000 });
        await expect(heading).toBeVisible();

        // Now verify the banner container is present with the luxury slot marker
        const banner = canvasElement.querySelector('[data-slot="luxury-category-banner"]');
        await expect(banner).toBeInTheDocument();

        // Verify the pageDescription is rendered (contains "Geneva manufacture")
        const description = await canvas.findByText(/Geneva manufacture/i, {}, { timeout: 5000 });
        await expect(description).toBeVisible();
    },
};
