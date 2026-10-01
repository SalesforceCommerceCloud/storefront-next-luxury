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
import type { ShopperProducts } from '@/scapi';
import {
    collectionDisplayName,
    getCollection,
    getMovementCaliber,
    getReferenceNumber,
    isPriceOnRequest,
    isStrapProduct,
    requiresBoutiqueAppointment,
} from './luxury-product';

describe('luxury product accessors', () => {
    it('extracts movement caliber from custom attributes', () => {
        const product = { c_movementCaliber: 'LN-3001' } as unknown as ShopperProducts.schemas['Product'];
        expect(getMovementCaliber(product)).toBe('LN-3001');
    });

    it('extracts reference number from custom attributes', () => {
        const product = { c_referenceNumber: 'LN-HER-001' } as unknown as ShopperProducts.schemas['Product'];
        expect(getReferenceNumber(product)).toBe('LN-HER-001');
    });

    it('marks c_priceOnRequest products correctly', () => {
        const hauteProduct = { c_priceOnRequest: true } as unknown as ShopperProducts.schemas['Product'];
        const normalProduct = { price: 2500 } as unknown as ShopperProducts.schemas['Product'];
        expect(isPriceOnRequest(hauteProduct)).toBe(true);
        expect(isPriceOnRequest(normalProduct)).toBe(false);
    });

    it('requires a boutique appointment at or above $3,000, not below', () => {
        const highEndWatch = { price: 3500, currency: 'USD' } as unknown as ShopperProducts.schemas['Product'];
        const midRangeWatch = { price: 2500, currency: 'USD' } as unknown as ShopperProducts.schemas['Product'];
        const affordableWatch = { price: 1500, currency: 'USD' } as unknown as ShopperProducts.schemas['Product'];
        const priceOnRequest = { c_priceOnRequest: true } as unknown as ShopperProducts.schemas['Product'];
        const strap = {
            price: 150,
            currency: 'USD',
            c_productType: 'strap',
        } as unknown as ShopperProducts.schemas['Product'];

        expect(requiresBoutiqueAppointment(highEndWatch)).toBe(true);
        expect(requiresBoutiqueAppointment(midRangeWatch)).toBe(false);
        expect(requiresBoutiqueAppointment(affordableWatch)).toBe(false);
        expect(requiresBoutiqueAppointment(priceOnRequest)).toBe(true);
        expect(requiresBoutiqueAppointment(strap)).toBe(false);
    });

    it('labels collections without maison names', () => {
        expect(collectionDisplayName('heritage')).toBe('Heritage Collection');
        expect(collectionDisplayName('sport')).toBe('Sport Collection');
        expect(collectionDisplayName('dive')).toBe('Dive Collection');
    });
});

describe('search-hit custom attributes (representedProduct)', () => {
    // Live SCAPI search hits nest their `c_*` attributes under `representedProduct`; the accessors
    // must read them there or straps slip into finder results and policy fields read undefined.
    it('reads collection / caliber / POR from representedProduct on a search hit', () => {
        const hit = {
            productId: 'ln-heritage-001',
            price: 2500,
            representedProduct: {
                id: 'ln-heritage-001',
                c_collection: 'heritage',
                c_movementCaliber: 'LN-3001',
                c_priceOnRequest: true,
            },
        } as unknown as ShopperProducts.schemas['Product'];
        expect(getCollection(hit)).toBe('heritage');
        expect(getMovementCaliber(hit)).toBe('LN-3001');
        expect(isPriceOnRequest(hit)).toBe(true);
    });

    it('detects a strap search hit whose c_isStrap lives on representedProduct', () => {
        const strapHit = {
            productId: 'ln-strap-nato-navy',
            representedProduct: { id: 'ln-strap-nato-navy', c_isStrap: true },
        } as unknown as ShopperProducts.schemas['Product'];
        expect(isStrapProduct(strapHit)).toBe(true);
        expect(requiresBoutiqueAppointment(strapHit)).toBe(false);
    });
});

describe('requiresBoutiqueAppointment explicit flag', () => {
    // The explicit merchant flag is currency-independent and must win over the USD price fallback
    // (localized GBP prices can't be compared to a fixed USD ceiling).
    it('honors c_boutiqueOnly over the price threshold', () => {
        const cheapButBoutique = {
            price: 1500,
            currency: 'GBP',
            c_boutiqueOnly: true,
        } as unknown as ShopperProducts.schemas['Product'];
        const expensiveButCartable = {
            price: 5000,
            currency: 'GBP',
            c_boutiqueOnly: false,
        } as unknown as ShopperProducts.schemas['Product'];
        expect(requiresBoutiqueAppointment(cheapButBoutique)).toBe(true);
        expect(requiresBoutiqueAppointment(expensiveButCartable)).toBe(false);
    });
});
