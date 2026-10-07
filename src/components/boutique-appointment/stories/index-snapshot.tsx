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
import { expect, test, describe, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { composeStories } from '@storybook/react-vite';
// oxlint-disable-next-line import/no-namespace
import * as Stories from './index.stories';
import { render, cleanup } from '@testing-library/react';

const composed = composeStories(Stories);

beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'));
});

afterAll(() => {
    vi.useRealTimers();
});

afterEach(() => {
    cleanup();
});

describe('BoutiqueAppointment stories snapshot', () => {
    for (const [storyName, Story] of Object.entries(composed)) {
        // Skip interaction-only stories (e.g. the full booking flow) from snapshots:
        // composeStories renders the initial step, so their snapshot adds no value.
        if (Story?.parameters?.snapshot === false) continue;

        test(`${storyName} story renders and matches snapshot`, () => {
            const { container } = render(<Story />);
            expect(container.firstChild).toMatchSnapshot();
        });
    }
});
