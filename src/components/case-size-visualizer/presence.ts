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

export const WRISTS = [
    { id: 'slim', cm: 15 },
    { id: 'typical', cm: 16.5 },
    { id: 'broad', cm: 18.5 },
] as const;

export type WristId = (typeof WRISTS)[number]['id'];
export type PresenceTone = 'quiet' | 'balanced' | 'substantial' | 'prominent';

/** Dorsal width of a roughly circular wrist, from circumference. */
export function wristWidthMm(circumferenceCm: number): number {
    return (circumferenceCm * 10) / Math.PI;
}

export function caseCoveragePercent(caseMm: number, circumferenceCm: number): number {
    return Math.round((caseMm / wristWidthMm(circumferenceCm)) * 100);
}

export function presenceFromCoverage(percent: number): PresenceTone {
    if (percent < 58) return 'quiet';
    if (percent < 72) return 'balanced';
    if (percent < 82) return 'substantial';
    return 'prominent';
}
