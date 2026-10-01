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
import { type CspResolutionContext, validateContributors } from '@salesforce/storefront-next-runtime/security';
import { createOpenStreetMapCspContributor } from './openstreetmap';

const ctx = { baseDirectives: {} } as CspResolutionContext;

describe('createOpenStreetMapCspContributor (luxury overlay)', () => {
    it('is always active and contributes the OSM tile origin without any runtime vertical selector', () => {
        // No process.env.VERTICAL check: the flattened luxury artifact IS luxury, so the boutique
        // map's tile origin must always be present in the deployed CSP.
        const contributor = createOpenStreetMapCspContributor();
        expect(contributor.id).toBe('openstreetmap-embed');
        expect(contributor.isActive(ctx)).toBe(true);
        expect(contributor.contribute(ctx)).toEqual({
            'img-src': ['https://tile.openstreetmap.org'],
        });
        expect(() => validateContributors([contributor], {})).not.toThrow();
    });
});
