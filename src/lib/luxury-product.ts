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

/**
 * Pack ↔ PRD custom-attribute aliases. Merchants may use either name.
 */

type AttrBag = Record<string, unknown>;

function bag(product: unknown): AttrBag {
    const p = (product ?? {}) as AttrBag;
    // Search hits (finder results, PLP tiles) nest their custom `c_*` attributes under
    // `representedProduct`; full products (getProduct/getProducts) carry them at the top level.
    // Merge both shapes so every accessor works for either — otherwise straps miss `c_isStrap`
    // (and slip into finder results) while collection / movement / size / POR read undefined.
    // The product's own top-level values win (e.g. a search hit's own `price`).
    const represented = (p.representedProduct ?? {}) as AttrBag;
    return { ...represented, ...p };
}

export function getMovementType(product: unknown): string | undefined {
    const p = bag(product);
    const value = p.c_movementType ?? p.c_movement;
    return typeof value === 'string' ? value : undefined;
}

export function getMovementCaliber(product: unknown): string | undefined {
    const p = bag(product);
    const value = p.c_movementCaliber ?? p.c_caliber;
    return typeof value === 'string' ? value : undefined;
}

export function getCrystal(product: unknown): string | undefined {
    const p = bag(product);
    const value = p.c_crystal ?? p.c_glassType;
    return typeof value === 'string' ? value : undefined;
}

export function isLimitedEdition(product: unknown): boolean {
    const p = bag(product);
    return Boolean(p.c_isLimitedEdition ?? p.c_limitedEdition);
}

export function getLugWidth(product: unknown): number | undefined {
    const p = bag(product);
    const value = p.c_lugWidth ?? p.c_lugsWidth;
    return typeof value === 'number' ? value : undefined;
}

export function getCaseback(product: unknown): string | undefined {
    const p = bag(product);
    if (typeof p.c_caseback === 'string') return p.c_caseback;
    if (p.c_displayBack === true) return 'exhibition';
    if (p.c_displayBack === false) return 'solid';
    return undefined;
}

export function getCaseDiameter(product: unknown): number | undefined {
    const value = bag(product).c_caseDiameter;
    return typeof value === 'number' ? value : undefined;
}

export function getCollection(product: unknown): string | undefined {
    const value = bag(product).c_collection;
    return typeof value === 'string' ? value : undefined;
}

export function getReferenceNumber(product: unknown): string | undefined {
    const value = bag(product).c_referenceNumber;
    return typeof value === 'string' ? value : undefined;
}

export function isPriceOnRequest(product: unknown): boolean {
    return Boolean(bag(product).c_priceOnRequest);
}

/**
 * Online checkout ceiling for the demo catalog's USD list prices. Only used as a fallback when a
 * product carries no explicit `c_boutiqueOnly` flag — see {@link requiresBoutiqueAppointment}.
 */
export const ONLINE_PURCHASE_MAX_USD = 3000;

export function getListPriceUsd(product: unknown): number | undefined {
    const p = bag(product);
    if (typeof p.price === 'number' && Number.isFinite(p.price)) return p.price;
    if (typeof p.priceMin === 'number' && Number.isFinite(p.priceMin)) return p.priceMin;
    return undefined;
}

/**
 * Whether a watch is reserved for a boutique appointment (no online checkout).
 *
 * Prefers the explicit `c_boutiqueOnly` merchant flag so the policy is currency-independent: list
 * prices are localized (the PDP loader requests GBP for `en-GB`), so comparing them to a fixed USD
 * ceiling would misclassify. `c_priceOnRequest` also forces boutique-only. The USD price threshold
 * remains only as a fallback for the demo catalog (USD) until `c_boutiqueOnly` is populated.
 * Straps stay cartable so the accessory path still checks out online.
 */
export function requiresBoutiqueAppointment(product: unknown): boolean {
    if (isStrapProduct(product)) return false;
    const explicit = bag(product).c_boutiqueOnly;
    if (typeof explicit === 'boolean') return explicit;
    if (isPriceOnRequest(product)) return true;
    const price = getListPriceUsd(product);
    if (price == null) return true;
    return price >= ONLINE_PURCHASE_MAX_USD;
}

export function getCertification(product: unknown): string | undefined {
    const value = bag(product).c_certification;
    return typeof value === 'string' ? value : undefined;
}

export function getCertNumber(product: unknown): string | undefined {
    const value = bag(product).c_certNumber;
    return typeof value === 'string' ? value : undefined;
}

export function getCertLab(product: unknown): string | undefined {
    const value = bag(product).c_certLab;
    return typeof value === 'string' ? value : undefined;
}

/** A single certification detail row (label + value), as provisioned on `c_certificationDetails`. */
export interface CertificationDetailRow {
    label: string;
    value: string;
}

/** A certification's "verify" link (rendered in the section footer), from `c_certificationDetails`. */
export interface CertificationVerifyLink {
    href: string;
    label: string;
}

/**
 * Parsed `c_certificationDetails` — the dataset-provisioned, fully data-driven certification content
 * for the PDP certification section: the badge label, the detail rows (including the certificate
 * number), and an optional verification link. All copy lives in the dataset; the storefront renders it
 * verbatim (only the small mark glyph is derived from {@link getCertification}).
 */
export interface CertificationDetails {
    label: string;
    title?: string;
    rows: CertificationDetailRow[];
    verify?: CertificationVerifyLink;
}

const isCertDetailRow = (value: unknown): value is CertificationDetailRow =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as CertificationDetailRow).label === 'string' &&
    typeof (value as CertificationDetailRow).value === 'string';

/**
 * Read and defensively parse the product's `c_certificationDetails` custom attribute. SCAPI surfaces
 * it as a JSON string (tolerate an already-parsed object). Returns `undefined` when absent or malformed
 * — the caller then renders no certification section.
 */
export function getCertificationDetails(product: unknown): CertificationDetails | undefined {
    const raw = bag(product).c_certificationDetails;
    let parsed: unknown = raw;
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw);
        } catch {
            return undefined;
        }
    }
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const obj = parsed as { label?: unknown; title?: unknown; rows?: unknown; verify?: unknown };
    if (typeof obj.label !== 'string' || !Array.isArray(obj.rows)) return undefined;
    const rows = obj.rows.filter(isCertDetailRow);
    if (rows.length === 0) return undefined;
    const verifyRaw = obj.verify as Partial<CertificationVerifyLink> | undefined;
    const verify =
        verifyRaw && typeof verifyRaw.href === 'string' && typeof verifyRaw.label === 'string'
            ? { href: verifyRaw.href, label: verifyRaw.label }
            : undefined;
    return {
        label: obj.label,
        ...(typeof obj.title === 'string' ? { title: obj.title } : {}),
        rows,
        verify,
    };
}

export function isStrapProduct(product: unknown): boolean {
    return Boolean(bag(product).c_isStrap);
}

export function collectionDisplayName(collectionId: string | undefined): string {
    const labels: Record<string, string> = {
        heritage: 'Heritage Collection',
        sport: 'Sport Collection',
        dive: 'Dive Collection',
        aviation: 'Aviation Collection',
        complications: 'Complications Collection',
        limited_edition: 'Limited Editions',
        'limited-editions': 'Limited Editions',
        ladies: 'Ladies Collection',
        'shop-by-price': 'Shop By Price',
    };
    return collectionId ? (labels[collectionId] ?? collectionId) : '';
}
