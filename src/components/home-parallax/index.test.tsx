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
import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import HomeParallax, { type HomeParallaxSlide } from './index';

const slides: HomeParallaxSlide[] = [
    { id: 'slide-1', src: '/images/hero-01.webp' },
    { id: 'slide-2', src: '/images/hero-02.webp' },
    { id: 'slide-3', src: '/images/hero-03.webp' },
];

function Harness({ active }: { active: number }) {
    return (
        <div data-slot="luxury-home-hero">
            <HomeParallax slides={slides} />
            <div data-slot="hero-carousel">
                {slides.map((slide, index) => (
                    <div key={slide.id} data-slot="carousel-item" aria-hidden={index !== active} />
                ))}
            </div>
        </div>
    );
}

describe('HomeParallax', () => {
    test('stacks one layer per slide and marks the first active', () => {
        const { container } = render(<Harness active={0} />);
        const layer = container.querySelector('[data-slot="luxury-home-parallax"]');
        expect(layer).toBeInTheDocument();
        expect(layer).toHaveAttribute('aria-hidden', 'true');
        const images = layer?.querySelectorAll('img') ?? [];
        expect(images).toHaveLength(3);
        expect(images[0]).toHaveAttribute('data-active', 'true');
        expect(images[1]).toHaveAttribute('data-active', 'false');
        expect(images[2]).toHaveAttribute('data-active', 'false');
    });

    test('follows the carousel item that is not aria-hidden', async () => {
        const { container, rerender } = render(<Harness active={0} />);
        rerender(<Harness active={2} />);
        await waitFor(() => {
            const images = container.querySelectorAll('[data-slot="luxury-home-parallax"] img');
            expect(images[2]).toHaveAttribute('data-active', 'true');
            expect(images[0]).toHaveAttribute('data-active', 'false');
        });
    });
});
