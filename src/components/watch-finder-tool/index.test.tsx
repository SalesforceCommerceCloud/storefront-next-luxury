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
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import WatchFinderTool from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import { createMockSearchHits } from '../../test-support/mock-watch';

vi.mock('@/components/link', () => ({
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

const mockHits = createMockSearchHits(3);

function renderFinder() {
    return render(
        <AllProvidersWrapper>
            <WatchFinderTool hits={mockHits} />
        </AllProvidersWrapper>
    );
}

async function beginFinder(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /^begin$/i }));
}

async function completeWizard(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /under \$5,000/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /dressy/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /treating myself/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /^small/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /no preference/i }));
    await user.click(screen.getByRole('button', { name: /see recommendations/i }));
}

describe('WatchFinderTool', () => {
    test('opens with a consultation intro before the first question', () => {
        renderFinder();

        expect(screen.getByRole('heading', { name: /five considered questions/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^begin$/i })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /investment range/i })).not.toBeInTheDocument();
    });

    test('walks one question at a time and shows three recommendations', async () => {
        const user = userEvent.setup();
        renderFinder();

        await beginFinder(user);

        expect(screen.getByRole('heading', { name: /investment range/i })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /your style/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();

        await completeWizard(user);

        expect(screen.getByRole('heading', { name: /your recommendations/i })).toBeInTheDocument();
        const results = screen.getByTestId('watch-finder-results');
        expect(results.querySelectorAll('li')).toHaveLength(3);
        expect(screen.getAllByRole('link', { name: /explore this watch/i })).toHaveLength(3);
        expect(screen.queryByRole('button', { name: /ask the advisor/i })).not.toBeInTheDocument();
    });

    test('skip advances budget without a selection', async () => {
        const user = userEvent.setup();
        renderFinder();
        await beginFinder(user);
        await user.click(screen.getByRole('button', { name: /skip this question/i }));
        expect(screen.getByRole('heading', { name: /your style/i })).toBeInTheDocument();
    });

    test('explain the difference opens movement education without selecting a movement', async () => {
        const user = userEvent.setup();
        renderFinder();
        await beginFinder(user);
        await user.click(screen.getByRole('button', { name: /under \$5,000/i }));
        await user.click(screen.getByRole('button', { name: /^next$/i }));
        await user.click(screen.getByRole('button', { name: /dressy/i }));
        await user.click(screen.getByRole('button', { name: /^next$/i }));
        await user.click(screen.getByRole('button', { name: /treating myself/i }));
        await user.click(screen.getByRole('button', { name: /^next$/i }));
        await user.click(screen.getByRole('button', { name: /^medium/i }));
        await user.click(screen.getByRole('button', { name: /^next$/i }));

        expect(screen.queryByTestId('watch-finder-education')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /explain the difference/i }));
        expect(screen.getByTestId('watch-finder-education')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /see recommendations/i })).toBeDisabled();
    });
});
