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
import type { ShopperProducts } from '@/scapi';
import type { ParseKeys } from 'i18next';
import type { SectionContent } from '@/components/html-fragment/types';

type TranslatorFn = (key: string, options?: Record<string, unknown>) => string;

export type PdpSection =
    | { apiMethod: string; labelKey: ParseKeys<'product'> }
    | {
          resolve: (product: ShopperProducts.schemas['Product'], t: TranslatorFn) => Promise<SectionContent | null>;
          labelKey: ParseKeys<'product'>;
      };

/**
 * Luxury renders every product detail — specifications, certification, model availability, and
 * shipping & warranty — in dedicated sections (the buy-box certification pill and the below-fold
 * Specifications section in `pdp-details`), not as buy-box collapsibles. So no sections are
 * contributed here: the `sfcc.pdp.collapsibles` seam stays present but renders nothing (the
 * canonical target returns null when the resolved section list is empty).
 */
export function resolvePdpSections(_product: ShopperProducts.schemas['Product']): PdpSection[] {
    return [];
}
