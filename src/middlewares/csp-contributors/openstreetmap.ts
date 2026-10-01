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

import type { CspContributor, CspContribution } from '@salesforce/storefront-next-runtime/security';

/**
 * Boutique-map CSP contributor: the map renders OpenStreetMap raster tiles, so this storefront's CSP
 * must allow `tile.openstreetmap.org`.
 *
 * Always active with no runtime selector — the deployed artifact for this brand is fixed at build
 * time and `process.env.VERTICAL` is unset at runtime, so activation is expressed by shipping this
 * module (which overrides the no-op default) rather than by an environment check.
 */
export function createOpenStreetMapCspContributor(): CspContributor {
    return {
        id: 'openstreetmap-embed',
        isActive: () => true,
        contribute: (): CspContribution => ({
            'img-src': ['https://tile.openstreetmap.org'],
        }),
    };
}
