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
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { ShopperStores } from '@/scapi';
import BoutiqueMap from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

const store: ShopperStores.schemas['Store'] = {
    id: 'ln-boutique-geneva',
    name: 'Geneva Boutique',
    city: 'Geneva',
    countryCode: 'CH',
    latitude: 46.207,
    longitude: 6.148,
    image: '/images/salons/geneva.webp',
};

function osmTiles(container: HTMLElement): HTMLImageElement[] {
    return Array.from(container.querySelectorAll('img')).filter((img) =>
        img.getAttribute('src')?.includes('tile.openstreetmap.org')
    );
}

describe('BoutiqueMap', () => {
    test('lazy-loads OSM tiles and renders the facade as the fallback layer behind them', () => {
        const { container } = render(
            <AllProvidersWrapper>
                <BoutiqueMap stores={[store]} selectedId={store.id} />
            </AllProvidersWrapper>
        );

        // The facade image sits behind the mosaic as the fallback layer.
        expect(screen.getByTestId('boutique-map-fallback')).toHaveAttribute('src', store.image);

        const tiles = osmTiles(container);
        expect(tiles.length).toBeGreaterThan(0);
        // Tiles defer loading — the map is often mostly hidden (e.g. behind the appointment gradient).
        tiles.forEach((tile) => expect(tile).toHaveAttribute('loading', 'lazy'));
    });

    test('a tile that fails to load hides itself so the facade fallback shows through', () => {
        const { container } = render(
            <AllProvidersWrapper>
                <BoutiqueMap stores={[store]} selectedId={store.id} />
            </AllProvidersWrapper>
        );

        const tile = osmTiles(container)[0];
        expect(tile.style.visibility).not.toBe('hidden');

        fireEvent.error(tile);

        expect(tile.style.visibility).toBe('hidden');
    });
});
