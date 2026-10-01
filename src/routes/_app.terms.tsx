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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import atelierImage from '/images/pages/atelier.webp';
import { StaticDocument, limestoneDocumentLoader, type StaticDocumentData } from '@/components/static-document';

export const loader = limestoneDocumentLoader;

export default function TermsPage({ loaderData }: { loaderData: StaticDocumentData }): ReactElement {
    const { t } = useTranslation('watch');

    return (
        <StaticDocument
            testId="terms-page"
            title={t('legal.terms.title')}
            breadcrumb={t('legal.terms.breadcrumb')}
            intro={t('legal.terms.intro')}
            pageUrl={loaderData.pageUrl}
            ogImageUrl={loaderData.ogImageUrl}>
            <ContentCard
                layout="callout"
                eyebrow={t('legal.terms.demo.eyebrow')}
                title={t('legal.terms.demo.title')}
                description={t('legal.terms.demo.content')}
            />
            <ContentCard
                layout="split"
                title={t('legal.terms.purchase.title')}
                description={t('legal.terms.purchase.content')}
                imageUrl={atelierImage}
                imageAlt={t('legal.terms.purchase.imageAlt')}
                buttonText={t('legal.terms.purchase.cta')}
                buttonLink={'/collections' as '/'}
            />
            <Accordion type="single" collapsible className="border-y border-border" defaultValue="warranty">
                <AccordionItem value="warranty">
                    <AccordionTrigger headingLevel={2} className="font-serif text-xl">
                        {t('legal.terms.warranty.title')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {t('legal.terms.warranty.content')}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="returns">
                    <AccordionTrigger headingLevel={2} className="font-serif text-xl">
                        {t('legal.terms.returns.title')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {t('legal.terms.returns.content')}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </StaticDocument>
    );
}
