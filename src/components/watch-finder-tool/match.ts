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
import type { ShopperSearch } from '@/scapi';
import {
    getCaseDiameter,
    getCollection,
    getMovementType,
    isPriceOnRequest,
    isStrapProduct,
} from '../../lib/luxury-product';

export type FinderAnswers = {
    budget: string;
    style: string;
    occasion: string;
    wrist: string;
    movement: string;
};

export const EMPTY_ANSWERS: FinderAnswers = {
    budget: '',
    style: '',
    occasion: '',
    wrist: '',
    movement: '',
};

export const STYLE_COLLECTIONS: Record<string, string[]> = {
    dressy: ['heritage', 'ladies'],
    sporty: ['sport', 'dive'],
    everyday: ['heritage', 'sport', 'ladies'],
    statement: ['complications', 'limited_edition', 'aviation'],
};

export const OCCASION_COLLECTIONS: Record<string, string[]> = {
    self: ['heritage', 'sport'],
    gift: ['ladies', 'heritage'],
    career: ['heritage', 'aviation'],
    first: ['heritage', 'sport', 'ladies'],
};

export type FinderReasonKey =
    | 'reasonWrist'
    | 'reasonStyle'
    | 'reasonBudget'
    | 'reasonOccasionGift'
    | 'reasonOccasionCareer'
    | 'reasonOccasionFirst'
    | 'reasonOccasionSelf'
    | 'reasonMovement'
    | 'reasonFallback';

export type RankedWatch = {
    hit: ShopperSearch.schemas['ProductSearchHit'];
    reason: FinderReasonKey;
    score: number;
};

type Relax = {
    style?: boolean;
    wrist?: boolean;
    movement?: boolean;
};

export function matchesBudget(price: number | undefined, por: boolean, band: string): boolean {
    if (!band) return true;
    if (por) return band === 'over20k';
    if (price === undefined) return false;
    if (band === 'under5k') return price < 5000;
    if (band === 'from5kTo10k') return price >= 5000 && price < 10000;
    if (band === 'from10kTo20k') return price >= 10000 && price < 20000;
    if (band === 'over20k') return price >= 20000;
    return true;
}

export function matchesWrist(mm: number | undefined, wrist: string): boolean {
    if (!wrist || wrist === 'unknown' || mm === undefined) return true;
    if (wrist === 's') return mm < 40;
    if (wrist === 'm') return mm >= 36 && mm <= 42;
    if (wrist === 'l') return mm >= 40;
    return true;
}

function passesFilters(hit: ShopperSearch.schemas['ProductSearchHit'], answers: FinderAnswers, relax: Relax): boolean {
    const price = typeof hit.price === 'number' ? hit.price : undefined;
    if (!matchesBudget(price, isPriceOnRequest(hit), answers.budget)) return false;

    if (!relax.movement && answers.movement && answers.movement !== 'any') {
        if (getMovementType(hit) !== answers.movement) return false;
    }

    if (!relax.wrist && !matchesWrist(getCaseDiameter(hit), answers.wrist)) return false;

    if (!relax.style && answers.style) {
        const allowed = STYLE_COLLECTIONS[answers.style];
        const collection = getCollection(hit) ?? '';
        if (allowed && !allowed.includes(collection)) return false;
    }

    return true;
}

function scoreHit(hit: ShopperSearch.schemas['ProductSearchHit'], answers: FinderAnswers): number {
    let score = 0;
    const collection = getCollection(hit) ?? '';
    if (answers.style && STYLE_COLLECTIONS[answers.style]?.includes(collection)) score += 12;
    if (answers.occasion && OCCASION_COLLECTIONS[answers.occasion]?.includes(collection)) score += 5;
    if (answers.occasion === 'first' && typeof hit.price === 'number' && hit.price < 10000) score += 4;
    if (answers.movement && answers.movement !== 'any' && getMovementType(hit) === answers.movement) {
        score += 3;
    }
    if (answers.wrist && answers.wrist !== 'unknown' && matchesWrist(getCaseDiameter(hit), answers.wrist)) {
        score += 3;
    }
    return score;
}

function candidateReasons(hit: ShopperSearch.schemas['ProductSearchHit'], answers: FinderAnswers): FinderReasonKey[] {
    const collection = getCollection(hit) ?? '';
    const keys: FinderReasonKey[] = [];
    if (answers.wrist && answers.wrist !== 'unknown' && matchesWrist(getCaseDiameter(hit), answers.wrist)) {
        keys.push('reasonWrist');
    }
    if (answers.style && STYLE_COLLECTIONS[answers.style]?.includes(collection)) keys.push('reasonStyle');
    if (
        answers.budget &&
        matchesBudget(typeof hit.price === 'number' ? hit.price : undefined, isPriceOnRequest(hit), answers.budget)
    ) {
        keys.push('reasonBudget');
    }
    if (answers.occasion === 'gift' && OCCASION_COLLECTIONS.gift.includes(collection)) {
        keys.push('reasonOccasionGift');
    }
    if (answers.occasion === 'career' && OCCASION_COLLECTIONS.career.includes(collection)) {
        keys.push('reasonOccasionCareer');
    }
    if (answers.occasion === 'first' && OCCASION_COLLECTIONS.first.includes(collection)) {
        keys.push('reasonOccasionFirst');
    }
    if (answers.occasion === 'self' && OCCASION_COLLECTIONS.self.includes(collection)) {
        keys.push('reasonOccasionSelf');
    }
    if (answers.movement && answers.movement !== 'any' && getMovementType(hit) === answers.movement) {
        keys.push('reasonMovement');
    }
    keys.push('reasonFallback');
    return keys;
}

export function rankFinderHits(
    hits: ShopperSearch.schemas['ProductSearchHit'][],
    answers: FinderAnswers,
    limit = 3
): RankedWatch[] {
    const catalog = hits.filter((hit) => !isStrapProduct(hit));
    const relaxOrder: Relax[] = [
        {},
        { style: true },
        { style: true, wrist: true },
        { style: true, wrist: true, movement: true },
    ];

    let pool: ShopperSearch.schemas['ProductSearchHit'][] = [];
    for (const relax of relaxOrder) {
        pool = catalog.filter((hit) => passesFilters(hit, answers, relax));
        if (pool.length >= limit) break;
    }

    const sorted = [...pool].sort((a, b) => {
        const delta = scoreHit(b, answers) - scoreHit(a, answers);
        if (delta !== 0) return delta;
        const pa = typeof a.price === 'number' ? a.price : Number.POSITIVE_INFINITY;
        const pb = typeof b.price === 'number' ? b.price : Number.POSITIVE_INFINITY;
        return pa - pb;
    });

    const used = new Set<FinderReasonKey>();
    return sorted.slice(0, limit).map((hit) => {
        const reason =
            candidateReasons(hit, answers).find((key) => key === 'reasonFallback' || !used.has(key)) ??
            'reasonFallback';
        if (reason !== 'reasonFallback') used.add(reason);
        return { hit, reason, score: scoreHit(hit, answers) };
    });
}
