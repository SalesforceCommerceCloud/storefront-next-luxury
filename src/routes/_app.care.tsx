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
import { Typography } from '@/components/typography';
import servicingImage from '/images/pages/servicing.webp';
import salonImage from '/images/salons/salon-interior.webp';
import { createStaticDocumentLoader, StaticDocument, type StaticDocumentData } from '@/components/static-document';

export const loader = createStaticDocumentLoader(servicingImage);

export default function CarePage({ loaderData }: { loaderData: StaticDocumentData }): ReactElement {
    const { t } = useTranslation('watch');

    return (
        <StaticDocument
            testId="care-page"
            title={t('carePage.title')}
            breadcrumb={t('carePage.breadcrumb')}
            intro={t('carePage.intro')}
            pageUrl={loaderData.pageUrl}
            ogImageUrl={loaderData.ogImageUrl}>
            <ContentCard
                layout="split"
                title={t('carePage.warranty.title')}
                description={t('carePage.warranty.content')}
                imageUrl={servicingImage}
                imageAlt={t('carePage.imageAlt')}
            />
            <div>
                <Typography variant="h3" as="h2" className="mb-6">
                    {t('carePage.rhythm.title')}
                </Typography>
                <div className="grid gap-6 md:grid-cols-3">
                    <ContentCard
                        layout="tile"
                        eyebrow="01"
                        title={t('carePage.rhythm.wear.title')}
                        description={t('carePage.rhythm.wear.content')}
                    />
                    <ContentCard
                        layout="tile"
                        eyebrow="02"
                        title={t('carePage.rhythm.bring.title')}
                        description={t('carePage.rhythm.bring.content')}
                    />
                    <ContentCard
                        layout="tile"
                        eyebrow="03"
                        title={t('carePage.rhythm.complete.title')}
                        description={t('carePage.rhythm.complete.content')}
                    />
                </div>
            </div>
            <ContentCard
                layout="stack"
                title={t('carePage.boutique.title')}
                description={t('carePage.boutique.content')}
                imageUrl={salonImage}
                imageAlt={t('carePage.boutique.imageAlt')}
                buttonText={t('carePage.boutique.cta')}
                buttonLink={'/boutiques' as '/'}
            />
        </StaticDocument>
    );
}
