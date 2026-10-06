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

export default function PrivacyPage({ loaderData }: { loaderData: StaticDocumentData }): ReactElement {
    const { t } = useTranslation('watch');

    return (
        <StaticDocument
            testId="privacy-page"
            title={t('legal.privacy.title')}
            breadcrumb={t('legal.privacy.breadcrumb')}
            intro={t('legal.privacy.intro')}
            pageUrl={loaderData.pageUrl}
            ogImageUrl={loaderData.ogImageUrl}>
            <ContentCard
                layout="prose"
                title={t('legal.privacy.scope.title')}
                description={t('legal.privacy.scope.content')}
            />
            <div className="grid gap-6 md:grid-cols-2">
                <ContentCard
                    layout="tile"
                    eyebrow={t('legal.privacy.appointments.eyebrow')}
                    title={t('legal.privacy.appointments.title')}
                    description={t('legal.privacy.appointments.content')}
                />
                <ContentCard
                    layout="tile"
                    eyebrow={t('legal.privacy.orders.eyebrow')}
                    title={t('legal.privacy.orders.title')}
                    description={t('legal.privacy.orders.content')}
                />
            </div>
            <ContentCard
                layout="callout"
                eyebrow={t('legal.privacy.contact.eyebrow')}
                title={t('legal.privacy.contact.title')}
                description={t('legal.privacy.contact.content')}
                buttonText={t('legal.privacy.contact.cta')}
                buttonLink="/about-us"
            />
        </StaticDocument>
    );
}
