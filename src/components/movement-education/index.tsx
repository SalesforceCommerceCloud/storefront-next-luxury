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
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getMovementType } from '../../lib/luxury-product';

const TYPES = ['automatic', 'manual', 'quartz'] as const;
type MovementId = (typeof TYPES)[number];

function lines(value: string): string[] {
    return value.split('\n').filter(Boolean);
}

export default function MovementEducation({ product }: { product?: unknown }): ReactElement {
    const { t } = useTranslation('watch');
    const current = getMovementType(product);
    const initial: MovementId = TYPES.includes(current as MovementId) ? (current as MovementId) : 'automatic';
    const [selected, setSelected] = useState<MovementId>(initial);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button type="button" className="text-sm underline underline-offset-4" data-testid="movement-education">
                    {t('education.link')}
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl font-normal">{t('education.title')}</DialogTitle>
                    <DialogDescription>{t('education.intro')}</DialogDescription>
                </DialogHeader>
                <div role="tablist" aria-label={t('education.title')} className="flex gap-1 border-b border-border">
                    {TYPES.map((type) => (
                        <button
                            key={type}
                            type="button"
                            role="tab"
                            id={`movement-tab-${type}`}
                            aria-selected={selected === type}
                            aria-controls={`movement-panel-${type}`}
                            className={cn(
                                '-mb-px border-b px-3 py-2 text-sm transition-colors',
                                selected === type
                                    ? 'border-foreground text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            )}
                            onClick={() => setSelected(type)}>
                            {t(`education.${type}.title`)}
                        </button>
                    ))}
                </div>
                {TYPES.map((type) =>
                    selected === type ? (
                        <div
                            key={type}
                            role="tabpanel"
                            id={`movement-panel-${type}`}
                            aria-labelledby={`movement-tab-${type}`}
                            className="pt-1">
                            {current === type ? (
                                <p className="mb-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    {t('education.onThisWatch')}
                                </p>
                            ) : null}
                            <p className="text-sm text-muted-foreground">{t(`education.${type}.body`)}</p>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        {t('education.forLabel')}
                                    </p>
                                    <ul className="mt-2 flex flex-col gap-1.5">
                                        {lines(t(`education.${type}.for`)).map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        {t('education.considerLabel')}
                                    </p>
                                    <ul className="mt-2 flex flex-col gap-1.5 text-muted-foreground">
                                        {lines(t(`education.${type}.consider`)).map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-muted-foreground">{t(`education.${type}.cadence`)}</p>
                        </div>
                    ) : null
                )}
            </DialogContent>
        </Dialog>
    );
}
