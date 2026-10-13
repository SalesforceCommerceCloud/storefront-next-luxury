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
import CaseSizeVisualizer from './index';
import { AllProvidersWrapper } from '@/test-utils/context-provider';

describe('CaseSizeVisualizer', () => {
    test('opens in a collapsible and compares presence on a wrist', async () => {
        const user = userEvent.setup();
        render(
            <AllProvidersWrapper>
                <CaseSizeVisualizer product={{ c_caseDiameter: 42 }} />
            </AllProvidersWrapper>
        );
        expect(screen.getByTestId('case-size-visualizer')).toBeInTheDocument();
        expect(screen.queryByRole('radio', { name: /typical/i })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /how it wears/i }));

        expect(screen.getByRole('radio', { name: /typical/i })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByTestId('case-size-coverage')).toHaveTextContent(/80%/);
        await user.click(screen.getByRole('radio', { name: /broad/i }));
        expect(screen.getByRole('radio', { name: /broad/i })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByTestId('case-size-coverage')).toHaveTextContent(/71%/);
        expect(screen.queryByRole('radio', { name: '44mm' })).not.toBeInTheDocument();
    });

    test('renders nothing when the product has no diameter', () => {
        const { container } = render(<CaseSizeVisualizer product={{}} />);
        expect(container).toBeEmptyDOMElement();
    });
});
