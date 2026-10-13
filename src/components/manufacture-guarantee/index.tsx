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
import { Minus, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { resolveAssetUrl } from '@/lib/utils';

const ITEMS = [
    { id: 'warranty', titleKey: 'pdp.guarantee.warranty.title', bodyKey: 'pdp.guarantee.warranty.body' },
    { id: 'seal', titleKey: 'pdp.guarantee.seal.title', bodyKey: 'pdp.guarantee.seal.body' },
    { id: 'box', titleKey: 'pdp.guarantee.box.title', bodyKey: 'pdp.guarantee.box.body' },
] as const;

export default function ManufactureGuarantee(): ReactElement {
    const { t } = useTranslation('watch');

    return (
        <section
            data-testid="luxury-manufacture-guarantee"
            className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="flex min-h-[20rem] items-center justify-center bg-muted px-8 py-12 lg:min-h-[28rem]">
                <img
                    src={resolveAssetUrl('/images/guarantee-card.svg')}
                    alt={t('pdp.guarantee.imageAlt')}
                    className="w-[min(100%,22rem)] -rotate-6 shadow-ui"
                />
            </div>
            <Accordion type="single" collapsible defaultValue="warranty" className="w-full">
                {ITEMS.map((item) => (
                    <AccordionItem key={item.id} value={item.id} className="border-border-subtle">
                        <AccordionTrigger
                            headingLevel={2}
                            className="group py-5 font-serif text-lg font-medium hover:no-underline [&>svg]:hidden">
                            <span className="flex flex-1 items-center justify-between gap-4 pr-1">
                                {t(item.titleKey)}
                                <span className="relative size-5 shrink-0" aria-hidden="true">
                                    <Plus className="size-5 group-data-[state=open]:hidden" />
                                    <Minus className="hidden size-5 group-data-[state=open]:block" />
                                </span>
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <p className="max-w-prose pb-2 text-sm leading-relaxed text-muted-foreground">
                                {t(item.bodyKey)}
                            </p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
}
