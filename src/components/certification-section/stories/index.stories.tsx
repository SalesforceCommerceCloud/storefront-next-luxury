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
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import CertificationSection from '../index';

// A product carrying the dataset-provisioned `c_certificationDetails` (as SCAPI surfaces it — a JSON
// string), plus the raw `c_certification` code the mark glyph is derived from.
const certifiedProduct = {
    id: 'ln-heritage-001',
    c_certification: 'COSC',
    c_certNumber: 'LN-COSC-79542',
    c_certificationDetails: JSON.stringify({
        label: 'COSC Chronometer Certified',
        title: 'COSC certification details',
        rows: [
            { label: 'Standard', value: 'ISO 3159' },
            { label: 'Accuracy', value: '−4/+6 seconds per day' },
            { label: 'Tested as', value: 'Uncased movement' },
            { label: 'Positions', value: 'Five' },
            { label: 'Duration', value: 'Fifteen consecutive days' },
            { label: 'Certificate No.', value: 'LN-COSC-79542' },
        ],
        verify: { href: 'https://www.cosc.watch', label: 'View the COSC standard' },
    }),
};

const meta: Meta<typeof CertificationSection> = {
    title: 'Products/Certification Section',
    component: CertificationSection,
    tags: ['autodocs', 'interaction'],
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof CertificationSection>;

export const Default: Story = {
    args: { product: certifiedProduct },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        const section = canvas.getByTestId('certification-section');
        await expect(within(section).getByText('COSC Chronometer Certified')).toBeVisible();
        // Expand and confirm dataset-provisioned rows + the footer verify link appear.
        await userEvent.click(within(section).getByText('COSC Chronometer Certified'));
        await expect(within(section).getByText('ISO 3159')).toBeVisible();
        await expect(within(section).getByTestId('certification-verify')).toHaveAttribute(
            'href',
            'https://www.cosc.watch'
        );
    },
};

// No certification details → the section renders nothing (data-gated).
export const NoCertification: Story = {
    args: { product: { id: 'ln-strap-nato-navy' } },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.queryByTestId('certification-section')).toBeNull();
    },
};
