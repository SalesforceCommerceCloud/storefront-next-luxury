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
import { useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { ShopperStores } from '@/scapi';

type BoutiqueMapProps = {
    stores: ShopperStores.schemas['Store'][];
    selectedId?: string;
    /** Hide the centered boutique-name label (e.g. when a surrounding caption already names it). */
    hideLabel?: boolean;
};

const ZOOM = 15;
const TILE = 256;
const RADIUS = 2;
const TILE_ORIGIN = 'https://tile.openstreetmap.org';

function latLngToWorld(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const n = 2 ** zoom;
    const x = ((lng + 180) / 360) * n;
    const sinLat = Math.sin((lat * Math.PI) / 180);
    const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * n;
    return { x, y };
}

function wrapTileX(x: number, zoom: number): number {
    const n = 2 ** zoom;
    return ((x % n) + n) % n;
}

export default function BoutiqueMap({ stores, selectedId, hideLabel = false }: BoutiqueMapProps): ReactElement | null {
    const { t } = useTranslation('watch');
    const selected = stores.find((store) => store.id === selectedId) ?? stores[0];
    const lat = selected?.latitude ?? 46.2044;
    const lng = selected?.longitude ?? 6.1432;
    // Fallback only: the boutique facade image, shown behind the map and revealed just if the OSM
    // tiles fail to load. The PRIMARY map is the live OpenStreetMap tile mosaic below, built from the
    // boutique's coordinates and re-centered whenever the selected boutique changes.
    const fallbackImage = selected?.image;

    const layout = useMemo(() => {
        const world = latLngToWorld(lat, lng, ZOOM);
        const originX = Math.floor(world.x) - RADIUS;
        const originY = Math.floor(world.y) - RADIUS;
        const maxTile = 2 ** ZOOM;
        const tiles: { key: string; left: number; top: number; src: string }[] = [];
        for (let row = 0; row < RADIUS * 2 + 1; row += 1) {
            for (let col = 0; col < RADIUS * 2 + 1; col += 1) {
                const ty = originY + row;
                if (ty < 0 || ty >= maxTile) continue;
                const tx = wrapTileX(originX + col, ZOOM);
                tiles.push({
                    key: `${tx}/${ty}`,
                    left: col * TILE,
                    top: row * TILE,
                    src: `${TILE_ORIGIN}/${ZOOM}/${tx}/${ty}.png`,
                });
            }
        }
        return {
            tiles,
            span: (RADIUS * 2 + 1) * TILE,
            pinX: (world.x - originX) * TILE,
            pinY: (world.y - originY) * TILE,
        };
    }, [lat, lng]);

    if (!selected) return null;

    return (
        <div
            className="absolute inset-0 overflow-hidden bg-muted"
            data-testid="boutique-map"
            data-latitude={String(lat)}
            data-longitude={String(lng)}>
            {/* Fallback layer (behind the tiles): the boutique facade, revealed only if the OSM
                tiles fail to load — the mosaic below paints over it on success. */}
            {fallbackImage ? (
                <img
                    src={fallbackImage}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    data-testid="boutique-map-fallback"
                    className="absolute inset-0 size-full object-cover grayscale contrast-[1.08]"
                />
            ) : null}
            {/* Primary: OSM tile mosaic centered on the selected boutique's coordinates. */}
            <div
                className="pointer-events-none absolute"
                style={{
                    width: layout.span,
                    height: layout.span,
                    left: `calc(50% - ${layout.pinX}px)`,
                    top: `calc(50% - ${layout.pinY}px)`,
                }}>
                {layout.tiles.map((tile) => (
                    <img
                        key={tile.key}
                        src={tile.src}
                        alt=""
                        width={TILE}
                        height={TILE}
                        draggable={false}
                        loading="lazy"
                        onError={(e) => {
                            // Hide a tile that fails to load so the facade fallback layer behind shows
                            // through, instead of leaving a broken-image box over the mosaic.
                            e.currentTarget.style.visibility = 'hidden';
                        }}
                        className="absolute max-w-none grayscale contrast-[1.08]"
                        style={{ left: tile.left, top: tile.top }}
                    />
                ))}
            </div>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <svg
                    data-testid="boutique-map-pin"
                    viewBox="0 0 32 42"
                    className="h-11 w-9 drop-shadow-md"
                    aria-hidden="true">
                    <path
                        className="fill-accent"
                        d="M16 0C8.3 0 2 6.3 2 14.1 2 24.8 16 42 16 42s14-17.2 14-27.9C30 6.3 23.7 0 16 0z"
                    />
                    <circle className="fill-primary" cx="16" cy="14" r="5.5" />
                </svg>
                {hideLabel ? null : (
                    <p className="mt-1 max-w-[12rem] bg-background/90 px-2 py-0.5 text-center text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-foreground">
                        {selected.name}
                    </p>
                )}
            </div>
            <p className="pointer-events-none absolute bottom-2 left-2 text-[0.625rem] text-muted-foreground">
                {t('boutiquesPage.mapAttribution', {
                    defaultValue: 'Map © OpenStreetMap',
                })}
            </p>
            <span className="sr-only">{t('boutiquesPage.mapLabel')}</span>
        </div>
    );
}
