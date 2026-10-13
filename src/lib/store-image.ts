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
import type { AppConfig } from '@/types/config';
import { toDisBaseUrl } from '@/lib/images/dynamic-image';

/**
 * Captures a static image URL's prefix up to and including the `/default/` locale segment, optionally
 * consuming (and discarding) the `/dw<version>/` version segment that follows it. Non-greedy so the
 * FIRST `/default/` wins — the segment appears exactly once in an SFCC static path.
 */
const DEFAULT_PREFIX_REGEX = /^(.*?\/default\/)(?:dw[0-9a-f]{6,}\/)?/i;

/**
 * Resolve a boutique's dataset-provisioned facade image to a DIS URL.
 *
 * Boutique facades ship in the SAME storefront catalog static repository as category images
 * (`.../Sites-luxury-storefront/...`), but SCAPI surfaces a store's `image` attribute verbatim as a
 * catalog-relative path (e.g. `images/salons/geneva.webp`) rather than a resolved URL. We reconstruct
 * the DIS URL by borrowing the host / realm / content-path prefix from any category image (the
 * `templateUrl` — normalized to DIS form first) and appending the relative path.
 *
 * The `/dw<version>/` segment is intentionally dropped: a version-less DIS static URL
 * (`.../default/images/...`) resolves to the current version server-side, so the storefront never has
 * to infer, borrow, or track the version — only the stable prefix (which any catalog image carries).
 *
 * @param image - The store's `image` value: a catalog-relative path, or an already-absolute URL.
 * @param templateUrl - Any luxury-storefront catalog image URL (e.g. a category image) to borrow the prefix from.
 * @param config - App config (DIS host + realm), forwarded to {@link toDisBaseUrl}.
 * @returns An absolute DIS URL; the original value when it is already absolute; or `undefined` when
 *          there is no usable input (empty image, missing/unusable template).
 */
export function resolveStoreImageUrl(
    image: string | undefined,
    templateUrl: string | undefined,
    config: AppConfig
): string | undefined {
    if (!image) return undefined;
    // Already an absolute URL (e.g. a future SCAPI that resolves store images itself) — leave as-is.
    if (/^https?:\/\//i.test(image)) return image;
    if (!templateUrl) return undefined;

    const disBase = toDisBaseUrl({ src: templateUrl, config });
    if (!disBase) return undefined;

    const match = DEFAULT_PREFIX_REGEX.exec(disBase);
    if (!match) return undefined;

    return `${match[1]}${image.replace(/^\/+/, '')}?sfrm=webp&q=70`;
}
