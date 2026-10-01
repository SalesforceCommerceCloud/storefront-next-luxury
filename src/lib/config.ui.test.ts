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
import { uiConfig } from './config.ui';

describe('luxury uiConfig', () => {
    it('keeps the PDP gallery stacked so the hero is a single packshot', () => {
        expect(uiConfig.pages.product.galleryLayout).toBe('stacked');
    });

    it('keeps category pagination defined so the listing route can read mode', () => {
        const pagination = uiConfig.pages.category.pagination;
        expect(pagination).toBeDefined();
        expect(['load-more', 'traditional']).toContain(pagination.mode);
        expect(pagination.batchSize).toBeGreaterThan(0);
    });
});
