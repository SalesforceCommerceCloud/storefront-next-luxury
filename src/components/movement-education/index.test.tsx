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
import MovementEducation from './index';

describe('MovementEducation', () => {
    test('opens the dialog with movement copy', async () => {
        const user = userEvent.setup();
        render(<MovementEducation product={{ c_movementType: 'automatic' }} />);
        await user.click(screen.getByTestId('movement-education'));
        expect(await screen.findByText(/rotor winds/i)).toBeInTheDocument();
        expect(screen.getByText(/no battery/i)).toBeInTheDocument();
        await user.click(screen.getByRole('tab', { name: /^manual$/i }));
        expect(await screen.findByText(/you wind it/i)).toBeInTheDocument();
    });
});
