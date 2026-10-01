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
import { expect, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import { ConfigProvider } from '@salesforce/storefront-next-runtime/config';
import { SiteProvider } from '@salesforce/storefront-next-runtime/site-context';
import { mockConfig, mockLocale, mockSiteObject } from '@/test-utils/config';
import BoutiqueBooking from '../index';

const mockSite = mockSiteObject;

const meta: Meta<typeof BoutiqueBooking> = {
    title: 'Layout/Store Locator/Boutique Booking',
    component: BoutiqueBooking,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'centered' },
    decorators: [
        // The global preview stack (`withRouter(StoryShell)`) already supplies the router + providers;
        // wrap only in the luxury site/config context here. A nested RouterProvider throws
        // "You cannot render a <Router> inside another <Router>" under the mirror storybook run.
        (Story): ReactElement => (
            <ConfigProvider config={mockConfig}>
                <SiteProvider
                    site={mockSite}
                    locale={mockLocale}
                    language={mockSiteObject.defaultLocale}
                    currency={mockSiteObject.defaultCurrency}>
                    <div className="max-w-md">
                        <Story />
                    </div>
                </SiteProvider>
            </ConfigProvider>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof BoutiqueBooking>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('boutique-booking')).toBeVisible();
        await expect(canvas.getByRole('link', { name: /book an appointment/i })).toBeVisible();
        await expect(canvas.getByRole('link', { name: /find a boutique/i })).toBeVisible();
    },
};

export const AppointmentRequired: Story = {
    args: {
        productId: 'ln-heritage-001',
        intent: 'appointment',
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('link', { name: /book an appointment/i })).toBeVisible();
    },
};
