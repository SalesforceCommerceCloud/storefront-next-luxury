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
import type { ReactElement } from 'react';
import CollapsibleSection from '@/components/collapsible-section';
import { getCertification, getCertificationDetails } from '../../lib/luxury-product';

/**
 * The single-letter mark shown in the badge — derived from the certification code (a glyph, not copy).
 * COSC → C, METAS → M, anything else (manufacture/brand) → A.
 */
function certMark(code: string | undefined): string {
    const normalized = (code ?? '').toUpperCase();
    if (normalized.includes('METAS')) return 'M';
    if (normalized.includes('COSC')) return 'C';
    return 'A';
}

/**
 * PDP certification badge as a custom-styled canonical {@link CollapsibleSection}: the summary is the
 * chronometer badge (mark + label) and expanding it reveals the certification detail rows, with the
 * verification link rendered in the section's footer band.
 *
 * All copy — the label, the rows, and the verify link — is dataset-provisioned via the product's
 * `c_certificationDetails` custom attribute (see {@link getCertificationDetails}); only the mark glyph
 * is derived. Renders nothing when the product carries no certification details.
 */
export default function CertificationSection({ product }: { product: unknown }): ReactElement | null {
    const details = getCertificationDetails(product);
    if (!details) return null;

    const mark = certMark(getCertification(product));

    return (
        <div data-slot="luxury-cert-section" data-testid="certification-section" className="w-full">
            <CollapsibleSection
                summary={
                    <span className="flex items-center gap-2">
                        <span
                            aria-hidden="true"
                            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-[0.625rem] leading-none text-primary-foreground">
                            {mark}
                        </span>
                        <span>{details.label}</span>
                    </span>
                }
                footer={
                    details.verify ? (
                        <a
                            href={details.verify.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="certification-verify"
                            className="inline-flex text-sm font-medium underline underline-offset-4">
                            {details.verify.label}
                            <span aria-hidden="true">&nbsp;→</span>
                        </a>
                    ) : undefined
                }>
                {details.title ? <h3 className="mb-3 font-serif text-base">{details.title}</h3> : null}
                <dl data-testid="certification-details">
                    {details.rows.map((row) => (
                        <div
                            key={row.label}
                            className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
                            <dt className="text-muted-foreground">{row.label}</dt>
                            <dd className="text-right">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            </CollapsibleSection>
        </div>
    );
}
