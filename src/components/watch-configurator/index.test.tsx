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
import WatchConfigurator from './index';

const steps = [
    {
        id: 'case',
        name: 'Case',
        options: [
            { value: 'steel', name: 'Steel', swatch: '#C5C8CB' },
            { value: 'gold', name: 'Gold', swatch: '#C9A227' },
        ],
    },
    {
        id: 'dial',
        name: 'Dial',
        options: [
            { value: 'black', name: 'Black', swatch: '#1C1C1C' },
            { value: 'blue', name: 'Blue', swatch: '#1E3A5F' },
        ],
    },
];

const strapSteps = [
    {
        id: 'bandType',
        name: 'Strap',
        options: [
            {
                value: 'leather_black',
                name: 'Leather Black',
                image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-strap-alligator-black.webp',
            },
            {
                value: 'nato_navy',
                name: 'NATO Navy',
                image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-luxury-product/default/dw6f8a2b1c/images/products/ln-strap-nato-navy.webp',
            },
        ],
    },
];

describe('WatchConfigurator', () => {
    test('shows every step at once so options can be compared', () => {
        render(<WatchConfigurator steps={steps} />);
        expect(screen.getByTestId('watch-configurator')).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'Case' })).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'Dial' })).toBeInTheDocument();
        expect(screen.queryByText(/complete the previous step/i)).not.toBeInTheDocument();
    });

    test('keeps prior steps visible after a selection', async () => {
        const user = userEvent.setup();
        render(<WatchConfigurator steps={steps} />);
        await user.click(screen.getByRole('radio', { name: 'Gold' }));
        expect(screen.getByRole('radiogroup', { name: 'Case' })).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'Dial' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Gold' })).toHaveAttribute('aria-checked', 'true');
    });

    test('disables combinations that are not valid', () => {
        render(
            <WatchConfigurator
                steps={steps}
                defaultValue={{ case: 'steel' }}
                validCombinations={[
                    { case: 'steel', dial: 'black' },
                    { case: 'gold', dial: 'blue' },
                ]}
            />
        );
        expect(screen.getByRole('radio', { name: 'Black' })).toBeEnabled();
        expect(screen.getByRole('radio', { name: 'Blue' })).toBeDisabled();
    });

    test('skips a step with a single option', () => {
        render(
            <WatchConfigurator
                steps={[
                    { id: 'case', name: 'Case', options: [{ value: 'steel', name: 'Steel' }] },
                    {
                        id: 'dial',
                        name: 'Dial',
                        options: [
                            { value: 'black', name: 'Black', swatch: '#1C1C1C' },
                            { value: 'blue', name: 'Blue', swatch: '#1E3A5F' },
                        ],
                    },
                ]}
            />
        );
        expect(screen.queryByText('Case')).not.toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'Dial' })).toBeInTheDocument();
    });

    test('renders nothing when every step has a single option', () => {
        const { container } = render(
            <WatchConfigurator steps={[{ id: 'case', name: 'Case', options: [{ value: 'steel', name: 'Steel' }] }]} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    test('renders strap photos so the materials can be seen', () => {
        render(<WatchConfigurator steps={strapSteps} />);
        const thumbs = document.querySelectorAll('[data-slot="configurator-option-thumb"] img');
        expect(thumbs.length).toBe(2);
    });
});
