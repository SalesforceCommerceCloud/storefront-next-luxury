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
import { StaticDocument, limestoneDocumentLoader, type StaticDocumentData } from '@/components/static-document';

export const loader = limestoneDocumentLoader;

export default function PrivacyChoicesPage({ loaderData }: { loaderData: StaticDocumentData }): ReactElement {
    const { t } = useTranslation('watch');

    return (
        <StaticDocument
            testId="privacy-choices-page"
            title={t('legal.choices.title')}
            breadcrumb={t('legal.choices.breadcrumb')}
            intro={t('legal.choices.intro')}
            pageUrl={loaderData.pageUrl}
            ogImageUrl={loaderData.ogImageUrl}>
            <div className="grid gap-6 md:grid-cols-3">
                <ContentCard
                    layout="tile"
                    eyebrow="01"
                    title={t('legal.choices.consent.title')}
                    description={t('legal.choices.consent.content')}
                />
                <ContentCard
                    layout="tile"
                    eyebrow="02"
                    title={t('legal.choices.dnt.title')}
                    description={t('legal.choices.dnt.content')}
                />
                <ContentCard
                    layout="tile"
                    eyebrow="03"
                    title={t('legal.choices.contact.title')}
                    description={t('legal.choices.contact.content')}
                    buttonText={t('legal.choices.contact.cta')}
                    buttonLink="/about-us"
                />
            </div>
        </StaticDocument>
    );
}
