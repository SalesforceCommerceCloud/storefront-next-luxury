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
import { describe, expect, it } from 'vitest';
import { optionVisual } from './configurator-visuals';

describe('optionVisual', () => {
    it('never embeds a strap photo — the tile comes from the dataset swatch group (SCAPI)', () => {
        expect(optionVisual('bandType', 'alligator_black').image).toBeUndefined();
        expect(optionVisual('bandType', 'metal_bracelet').image).toBeUndefined();
        expect(optionVisual('bandType', 'nato_navy').image).toBeUndefined();
    });

    it('supplies the brown-leather CSS filter (applied over the dataset photo), no app image', () => {
        expect(optionVisual('bandType', 'leather_brown').filter).toMatch(/sepia/);
        expect(optionVisual('bandType', 'leather_brown').image).toBeUndefined();
    });

    it('falls back to a colour chip for straps that ship no photo (rubber/tropic)', () => {
        expect(optionVisual('bandType', 'rubber').swatch).toBe('#1C1C1C');
        expect(optionVisual('bandType', 'rubber').image).toBeUndefined();
    });

    it('maps dials to color chips', () => {
        expect(optionVisual('dialColor', 'white').swatch).toBe('#F4F1EA');
        expect(optionVisual('dialColor', 'black').swatch).toBe('#1C1C1C');
        expect(optionVisual('dialColor', 'white').image).toBeUndefined();
    });

    it('maps case metals to chips', () => {
        expect(optionVisual('caseMaterial', 'rose_gold').swatch).toBe('#B76E79');
    });
});
