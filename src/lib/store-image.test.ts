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
import type { AppConfig } from '@/types/config';
import { resolveStoreImageUrl } from './store-image';

const config = { images: { host: 'https://edge-qa03-us.dis.cc.salesforce.com' } } as unknown as AppConfig;

// A DIS-transformed category image (realm in path) and the raw instance-host equivalent — both name the
// same luxury-storefront catalog static repo, so either is a valid version prefix template.
const DIS_TEMPLATE =
    'https://edge-qa03-us.dis.cc.salesforce.com/dw/image/v2/ZYMC_008/on/demandware.static/-/Sites-luxury-storefront/default/dwe1a89f91/images/categories/heritage.webp?sfrm=webp&q=70';
const RAW_TEMPLATE =
    'https://zymc-008.unified.demandware.net/on/demandware.static/-/Sites-luxury-storefront/default/dwe1a89f91/images/categories/heritage.webp';
const EXPECTED =
    'https://edge-qa03-us.dis.cc.salesforce.com/dw/image/v2/ZYMC_008/on/demandware.static/-/Sites-luxury-storefront/default/images/salons/geneva.webp?sfrm=webp&q=70';

describe('resolveStoreImageUrl', () => {
    it('builds a version-less DIS URL from a DIS-form category template', () => {
        expect(resolveStoreImageUrl('images/salons/geneva.webp', DIS_TEMPLATE, config)).toBe(EXPECTED);
    });

    it('normalizes a raw instance-host template to the DIS host', () => {
        expect(resolveStoreImageUrl('images/salons/geneva.webp', RAW_TEMPLATE, config)).toBe(EXPECTED);
    });

    it('drops the version even when the template is already version-less', () => {
        const versionless =
            'https://edge-qa03-us.dis.cc.salesforce.com/dw/image/v2/ZYMC_008/on/demandware.static/-/Sites-luxury-storefront/default/images/categories/heritage.webp?sfrm=webp&q=70';
        expect(resolveStoreImageUrl('images/salons/geneva.webp', versionless, config)).toBe(EXPECTED);
    });

    it('strips a leading slash from the relative path', () => {
        expect(resolveStoreImageUrl('/images/salons/geneva.webp', DIS_TEMPLATE, config)).toBe(EXPECTED);
    });

    it('returns an already-absolute image unchanged', () => {
        const absolute = 'https://cdn.example.com/salons/geneva.webp';
        expect(resolveStoreImageUrl(absolute, DIS_TEMPLATE, config)).toBe(absolute);
    });

    it('returns undefined when the store has no image', () => {
        expect(resolveStoreImageUrl(undefined, DIS_TEMPLATE, config)).toBeUndefined();
        expect(resolveStoreImageUrl('', DIS_TEMPLATE, config)).toBeUndefined();
    });

    it('returns undefined when there is no template to borrow the prefix from', () => {
        expect(resolveStoreImageUrl('images/salons/geneva.webp', undefined, config)).toBeUndefined();
    });

    it('returns undefined when the template has no resolvable DIS prefix', () => {
        expect(resolveStoreImageUrl('images/salons/geneva.webp', 'not a url', config)).toBeUndefined();
    });
});
