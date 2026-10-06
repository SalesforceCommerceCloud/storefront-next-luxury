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
import { render } from '@testing-library/react';
import ExpressPayments from './express-payments';

describe('ExpressPayments luxury overlay', () => {
    test('vertical layout uses a compact 3-column / 2-row grid without the Card shell', () => {
        const { container } = render(<ExpressPayments layout="vertical" />);

        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toHaveClass('grid-cols-3');
        expect(gridContainer).not.toHaveClass('grid-cols-1');
        expect(gridContainer).not.toHaveClass('lg:grid-cols-5');

        expect(container.querySelector('[data-testid="express-payments"]')).not.toHaveAttribute('data-framed');
        expect(container.querySelector('.bg-card')).toBeNull();
    });

    test('horizontal layout keeps the checkout Card and 5-column desktop grid', () => {
        const { container } = render(<ExpressPayments layout="horizontal" />);

        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toHaveClass('grid-cols-2');
        expect(gridContainer).toHaveClass('lg:grid-cols-5');

        expect(container.querySelector('[data-testid="express-payments"]')).toHaveAttribute('data-framed');
        expect(container.querySelector('.bg-card')).toBeTruthy();
    });
});
