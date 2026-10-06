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
import { useEffect, useRef, useState, type ReactElement } from 'react';

export type HomeParallaxSlide = {
    id: string;
    src: string;
};

type HomeParallaxProps = {
    slides: HomeParallaxSlide[];
};

function readActiveIndex(root: Element, slideCount: number): number {
    const items = root.querySelectorAll('[data-slot="hero-carousel"] [data-slot="carousel-item"]');
    if (items.length === 0 || slideCount === 0) {
        return 0;
    }
    const visible = Array.from(items).findIndex((item) => item.getAttribute('aria-hidden') !== 'true');
    if (visible < 0) {
        return 0;
    }
    return visible % slideCount;
}

/**
 * Campaign stills for the luxury home hero. Embla translates the carousel
 * track, so a `position:fixed` image inside a slide is not viewport-fixed —
 * and a page-level fixed layer paints over the footer. This layer sits
 * *outside* the track, inside `[data-slot=luxury-home-scene]`, and follows
 * `[aria-hidden]` on each item. CSS `position:sticky` pins it only while
 * that scene is on screen.
 */
export default function HomeParallax({ slides }: HomeParallaxProps): ReactElement | null {
    const rootRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);

    useEffect(() => {
        const layer = rootRef.current;
        const hero = layer?.closest('[data-slot="luxury-home-hero"]');
        if (!hero) {
            return undefined;
        }

        const sync = () => {
            setActive(readActiveIndex(hero, slides.length));
        };

        sync();
        const observer = new MutationObserver(sync);
        observer.observe(hero, { attributes: true, subtree: true, attributeFilter: ['aria-hidden'] });
        return () => observer.disconnect();
    }, [slides.length]);

    if (slides.length === 0) {
        return null;
    }

    return (
        <div ref={rootRef} data-slot="luxury-home-parallax" aria-hidden="true">
            {slides.map((slide, index) => (
                <img
                    key={slide.id}
                    src={slide.src}
                    alt=""
                    data-active={index === active ? 'true' : 'false'}
                    decoding="async"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'low'}
                />
            ))}
        </div>
    );
}
