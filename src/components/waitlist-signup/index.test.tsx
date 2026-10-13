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
import { beforeEach, describe, expect, test } from 'vitest';
import WaitlistSignup from './index';

describe('WaitlistSignup', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    test('stores the email and shows success', async () => {
        const user = userEvent.setup();
        render(<WaitlistSignup productId="ln-limited-001" />);
        await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
        await user.click(screen.getByRole('button', { name: /join waitlist/i }));
        expect(screen.getByTestId('waitlist-success')).toBeInTheDocument();
        expect(sessionStorage.getItem('luxury-waitlist:ln-limited-001')).toContain('ada@example.com');
    });
});
