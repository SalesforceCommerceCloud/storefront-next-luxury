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
/** Visual for a configurator option — photo tile, color chip, or neither. */
export type OptionVisual = {
    image?: string;
    swatch?: string;
    /** CSS filter applied to `image` (e.g. brown leather from a black strap photo). */
    filter?: string;
};

const DIAL_SWATCH: Record<string, string> = {
    black: '#1C1C1C',
    white: '#F4F1EA',
    silver: '#D8D8D8',
    blue: '#1E3A5F',
    champagne: '#D4C4A0',
    gray: '#5C5C5C',
    anthracite: '#3A3A3A',
    green: '#2F4F3E',
    burgundy: '#5C1A2A',
    salmon: '#D4A59A',
    skeleton: '#8A8A8A',
};

const CASE_SWATCH: Record<string, string> = {
    stainless_steel: '#C5C8CB',
    rose_gold: '#B76E79',
    yellow_gold: '#C9A227',
    white_gold: '#E8E6E1',
    platinum: '#D9D9D6',
    titanium: '#8B8E91',
    bronze: '#8C6A3D',
    ceramic: '#1C1C1C',
    carbon_fiber: '#2A2A2A',
};

const STRAP_SWATCH: Record<string, string> = {
    rubber: '#1C1C1C',
    rubber_black: '#1C1C1C',
    tropic: '#1C1C1C',
};

const STRAP_FILTER: Record<string, string> = {
    leather_brown: 'sepia(0.85) saturate(1.35) hue-rotate(-18deg) brightness(0.78)',
    alligator_brown: 'sepia(0.9) saturate(1.4) hue-rotate(-12deg) brightness(0.72)',
};

function lookup(map: Record<string, string>, value: string): string | undefined {
    const key = value.trim().toLowerCase().replaceAll(' ', '_');
    return map[key];
}

/**
 * Non-image visual for a variation value: a colour chip, an optional CSS filter, or neither.
 *
 * Strap **photo** swatches come from the dataset (SFCC native `viewType=swatch` image-group on the
 * bandType axis) and are attached in the PDP from `product.imageGroups`, so this helper never returns a
 * strap image. It only supplies the brown-leather CSS filter and the colour-chip fallback for
 * rubber/tropic straps (which ship no photo), plus the dial/case colour chips — matching the design ref.
 */
export function optionVisual(attributeId: string, value: string): OptionVisual {
    const id = attributeId.toLowerCase();

    if (id === 'bandtype' || id === 'strap') {
        const filter = lookup(STRAP_FILTER, value);
        if (filter) return { filter };
        const swatch = lookup(STRAP_SWATCH, value);
        if (swatch) return { swatch };
        return {};
    }

    if (id === 'dialcolor' || id === 'dial') {
        const swatch = lookup(DIAL_SWATCH, value);
        return swatch ? { swatch } : {};
    }

    if (id === 'casematerial' || id === 'case') {
        const swatch = lookup(CASE_SWATCH, value);
        return swatch ? { swatch } : {};
    }

    return {};
}
