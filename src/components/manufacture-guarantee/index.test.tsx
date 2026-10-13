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
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import ManufactureGuarantee from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

describe('ManufactureGuarantee', () => {
    test('opens the international guarantee and expands the atelier seal', async () => {
        const user = userEvent.setup();
        render(
            <AllProvidersWrapper>
                <ManufactureGuarantee />
            </AllProvidersWrapper>
        );

        expect(screen.getByTestId('luxury-manufacture-guarantee')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /international guarantee card/i })).toBeInTheDocument();
        expect(screen.getByText(/two-year international guarantee/i)).toBeVisible();
        expect(screen.queryByText(/sealed mark on the caseback/i)).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /the atelier seal/i }));
        expect(screen.getByText(/sealed mark on the caseback/i)).toBeVisible();

        expect(screen.queryByText(/rolex/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/bucherer/i)).not.toBeInTheDocument();
    });
});
