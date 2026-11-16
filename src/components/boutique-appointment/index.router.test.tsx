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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, test } from 'vitest';
import type { ServiceTerritoryOption } from '@/lib/appointment-scheduler';
import BoutiqueAppointment from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

// Unlike index.test.tsx, this file does not mock useFetcher: the bug it guards against lives in how
// the component reads fetcher state across a real router's delayed responses.

const stores: ServiceTerritoryOption[] = [
    {
        id: 'ln-boutique-geneva',
        sfId: 'SF001',
        name: 'Geneva Boutique',
        timezone: 'Europe/Zurich',
        address1: '12 Quai des Bergues',
        city: 'Geneva',
        stateCode: 'GE',
        postalCode: '1201',
        countryCode: 'CH',
        phone: '+41 22 000 00 00',
        latitude: 46.207,
        longitude: 6.148,
        image: '/images/salons/geneva.webp',
    },
    {
        id: 'ln-boutique-london',
        sfId: 'SF002',
        name: 'London Boutique',
        timezone: 'Europe/London',
        address1: '18 Mount Street',
        city: 'London',
        stateCode: 'ENG',
        postalCode: 'W1K 2RH',
        countryCode: 'GB',
        phone: '+44 20 0000 0000',
        latitude: 51.5104,
        longitude: -0.1508,
        image: '/images/salons/london.webp',
    },
];

type WorkTypesResponse = {
    success: boolean;
    workTypes: { id: string; name: string; durationMinutes: number; workTypeGroupId: string }[];
};

function workTypesFor(storeId: string, serviceName: string): WorkTypesResponse {
    return {
        success: true,
        workTypes: [{ id: `wt-${storeId}`, name: serviceName, durationMinutes: 30, workTypeGroupId: 'wtg-1' }],
    };
}

/** One controllable response per boutique, so a test decides when each request settles and in what order. */
function createDelayedWorkTypesBackend() {
    const resolvers = new Map<string, (response: WorkTypesResponse) => void>();
    const loader = ({ request }: { request: Request }) => {
        const territoryId = new URL(request.url).searchParams.get('territoryId') ?? '';
        return new Promise<WorkTypesResponse>((resolve) => {
            resolvers.set(territoryId, resolve);
        });
    };
    const respond = (territoryId: string, response: WorkTypesResponse) => resolvers.get(territoryId)?.(response);
    return { loader, respond };
}

function renderWithRealRouter(loader: ReturnType<typeof createDelayedWorkTypesBackend>['loader']) {
    const router = createMemoryRouter(
        [
            { path: '/', element: <BoutiqueAppointment stores={stores} catalog={[]} /> },
            { path: '/resource/appointment-work-types', loader },
        ],
        { initialEntries: ['/'] }
    );
    return render(
        <AllProvidersWrapper>
            <RouterProvider router={router} />
        </AllProvidersWrapper>
    );
}

describe('BoutiqueAppointment services with a real router', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    test("a late response for the first boutique never replaces the second boutique's services", async () => {
        const user = userEvent.setup();
        const backend = createDelayedWorkTypesBackend();
        renderWithRealRouter(backend.loader);

        await user.click(await screen.findByRole('button', { name: /geneva boutique/i }));
        await user.click(screen.getByRole('button', { name: /^back$/i }));
        await user.click(screen.getByRole('button', { name: /london boutique/i }));

        backend.respond('ln-boutique-london', workTypesFor('london', 'London Service'));
        expect(await screen.findByRole('button', { name: /london service/i })).toBeInTheDocument();

        backend.respond('ln-boutique-geneva', workTypesFor('geneva', 'Geneva Service'));

        await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: /london service/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /geneva service/i })).not.toBeInTheDocument();
    });

    test("switching to a second boutique shows loading, not the first boutique's loaded services", async () => {
        const user = userEvent.setup();
        const backend = createDelayedWorkTypesBackend();
        renderWithRealRouter(backend.loader);

        await user.click(await screen.findByRole('button', { name: /geneva boutique/i }));
        backend.respond('ln-boutique-geneva', workTypesFor('geneva', 'Geneva Service'));
        expect(await screen.findByRole('button', { name: /geneva service/i })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /^back$/i }));
        await user.click(screen.getByRole('button', { name: /london boutique/i }));

        expect(await screen.findByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /geneva service/i })).not.toBeInTheDocument();

        backend.respond('ln-boutique-london', workTypesFor('london', 'London Service'));
        expect(await screen.findByRole('button', { name: /london service/i })).toBeInTheDocument();
    });
});
