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
import { useTranslation } from 'react-i18next';
import ContentCard from '@/components/content-card';
import Contact from '@/components/contact';
import salonImage from '/images/salons/salon-interior.webp';
import { StaticDocument, limestoneDocumentLoader, type StaticDocumentData } from '@/components/static-document';

export const loader = limestoneDocumentLoader;

export default function AccessibilityPage({ loaderData }: { loaderData: StaticDocumentData }): ReactElement {
    const { t } = useTranslation('watch');

    return (
        <StaticDocument
            testId="accessibility-page"
            title={t('legal.accessibility.title')}
            breadcrumb={t('legal.accessibility.breadcrumb')}
            intro={t('legal.accessibility.intro')}
            pageUrl={loaderData.pageUrl}
            ogImageUrl={loaderData.ogImageUrl}>
            <ContentCard
                layout="callout"
                eyebrow={t('legal.accessibility.commitment.eyebrow')}
                title={t('legal.accessibility.commitment.title')}
                description={t('legal.accessibility.commitment.content')}
            />
            <ContentCard
                layout="split"
                title={t('legal.accessibility.salons.title')}
                description={t('legal.accessibility.salons.content')}
                imageUrl={salonImage}
                imageAlt={t('legal.accessibility.salons.imageAlt')}
                buttonText={t('legal.accessibility.salons.cta')}
                buttonLink={'/boutiques' as '/'}
            />
            <div className="-mx-[var(--page-gutter)] bg-secondary px-[var(--page-gutter)] py-12">
                <Contact />
            </div>
        </StaticDocument>
    );
}
