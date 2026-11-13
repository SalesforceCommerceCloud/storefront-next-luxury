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
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFetcher } from 'react-router';
import { useBoutiqueList } from './use-boutique-list';

vi.mock('react-router', async (importOriginal) => ({
    ...(await importOriginal<typeof import('react-router')>()),
    useFetcher: vi.fn(),
}));

const territory = {
    id: 'boutique-geneva',
    sfId: 'service-territory-id',
    externalId: 'boutique-geneva',
    name: 'Geneva Boutique',
    timezone: 'Europe/Zurich',
};
const store = { id: 'boutique-geneva', name: 'Geneva Boutique', inventoryId: 'inventory-geneva' };

function mockLists(success: boolean, stores = [store]) {
    for (const data of [
        { success, territories: [territory] },
        { success: true, stores, availability: { 'boutique-geneva': { inStock: true } } },
    ]) {
        vi.mocked(useFetcher).mockReturnValueOnce({
            state: 'idle',
            data,
            load: vi.fn(),
        } as unknown as ReturnType<typeof useFetcher>);
    }
}

beforeEach(() => vi.clearAllMocks());

describe('boutique pickup inventory mapping', () => {
    it('enriches Core territories with the actual B2C inventory list', () => {
        mockLists(true);
        const { result } = renderHook(() => useBoutiqueList());
        expect(result.current.stores).toEqual([{ ...territory, inventoryId: 'inventory-geneva' }]);
    });

    it('preserves inventory IDs when falling back to B2C stores', () => {
        mockLists(false);
        const { result } = renderHook(() => useBoutiqueList());
        expect(result.current.stores[0]).toMatchObject({
            id: 'boutique-geneva',
            externalId: 'boutique-geneva',
            inventoryId: 'inventory-geneva',
        });
    });

    it('does not substitute a territory or store ID for a missing inventory list', () => {
        mockLists(true, []);
        const { result } = renderHook(() => useBoutiqueList());
        expect(result.current.stores[0].inventoryId).toBeUndefined();
    });
});
