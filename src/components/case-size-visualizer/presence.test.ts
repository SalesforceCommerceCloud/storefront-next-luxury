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
import { describe, expect, test } from 'vitest';
import { caseCoveragePercent, presenceFromCoverage, wristWidthMm } from './presence';

describe('wrist presence math', () => {
    test('a 16.5 cm wrist is about 53 mm across', () => {
        expect(wristWidthMm(16.5)).toBeCloseTo(52.5, 0);
    });

    test('the same 42 mm case covers more of a slimmer wrist', () => {
        expect(caseCoveragePercent(42, 15)).toBeGreaterThan(caseCoveragePercent(42, 16.5));
        expect(caseCoveragePercent(42, 16.5)).toBeGreaterThan(caseCoveragePercent(42, 18.5));
        expect(presenceFromCoverage(caseCoveragePercent(42, 15))).toBe('prominent');
        expect(presenceFromCoverage(caseCoveragePercent(42, 16.5))).toBe('substantial');
        expect(presenceFromCoverage(caseCoveragePercent(42, 18.5))).toBe('balanced');
    });
});
