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
import HeroCarousel, { type HeroSlide } from '@/components/hero-carousel';

const slides: HeroSlide[] = [
    {
        id: 'quiet-1',
        title: 'Time, Perfected.',
        subtitle: 'A Geneva manufacture since 1964.',
        imageUrl: '/images/hero-01.webp',
        imageAlt: 'Cinematic campaign still of a steel dress watch in a dark studio.',
        ctaText: 'Explore Collections',
        ctaAriaLabel: 'Explore collections',
        ctaLink: '/collections',
        overlayPosition: 'Middle Center',
        overlayAlignment: 'center',
    },
];

const meta: Meta<typeof HeroCarousel> = {
    title: 'Content/Marketing/Hero Carousel',
    component: HeroCarousel,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof HeroCarousel>;

export const QuietLuxury: Story = {
    args: {
        slides,
        autoPlay: false,
        showNavigation: false,
        showDots: false,
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        await expect(within(canvasElement).getByText('Time, Perfected.')).toBeVisible();
    },
};
