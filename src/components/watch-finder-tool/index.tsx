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
import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/link';
import { cn, resolveAssetUrl } from '@/lib/utils';
import ProductPrice from '@/components/product-price';
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import { isCimulateEnabled, openAgentWidgetAndSendMessage, validateCimulateConfig } from '@/components/cimulate';
import { collectionDisplayName, getCaseDiameter, getCollection, getMovementType } from '../../lib/luxury-product';
import { EMPTY_ANSWERS, rankFinderHits, type FinderAnswers, type FinderReasonKey, type RankedWatch } from './match';
import type { ShopperSearch } from '@/scapi';
import { createProductUrl } from '@/route-paths';
import { useSeoUrlContext } from '@/hooks/use-seo-url-context';

const STEPS = ['budget', 'style', 'occasion', 'wrist', 'movement'] as const;
type StepId = (typeof STEPS)[number];

// Editorial stills only — catalog imagery lives in the dataset and is served via SCAPI, so the
// finder chrome points at kept editorial assets (heroes, band, salon) rather than bundled catalog files.
const STEP_STILL: Record<StepId | 'intro', string> = {
    intro: resolveAssetUrl('/images/finder-band.webp'),
    budget: resolveAssetUrl('/images/hero-02.webp'),
    style: resolveAssetUrl('/images/hero-01.webp'),
    occasion: resolveAssetUrl('/images/salons/salon-interior.webp'),
    wrist: resolveAssetUrl('/images/hero-04.webp'),
    movement: resolveAssetUrl('/images/hero-03.webp'),
};

type Option = {
    value: string;
    titleKey: string;
    hintKey: string;
    image?: string;
    imageClassName?: string;
    fit?: 'cover' | 'contain';
};

const FINDER_VALUE_KEYS: Record<string, string> = {
    under5k: 'finder.under5k',
    from5kTo10k: 'finder.from5kTo10k',
    from10kTo20k: 'finder.from10kTo20k',
    over20k: 'finder.over20k',
    dressy: 'finder.styleDressy',
    sporty: 'finder.styleSporty',
    everyday: 'finder.styleEveryday',
    statement: 'finder.styleStatement',
    self: 'finder.occasionSelf',
    gift: 'finder.occasionGift',
    career: 'finder.occasionCareer',
    first: 'finder.occasionFirst',
    s: 'finder.wristS',
    m: 'finder.wristM',
    l: 'finder.wristL',
    unknown: 'finder.wristUnknown',
    automatic: 'finder.automatic',
    manual: 'finder.manual',
    any: 'finder.any',
};

type WatchFinderToolProps = {
    hits: ShopperSearch.schemas['ProductSearchHit'][];
    onSubmit?: (answers: FinderAnswers) => void;
};

function finderAnswerLabel(t: (key: string) => string, value: string): string {
    if (!value) return '—';
    const key = FINDER_VALUE_KEYS[value];
    return key ? t(key) : value;
}

function OptionCard({
    option,
    selected,
    onSelect,
    wide,
}: {
    option: Option;
    selected: boolean;
    onSelect: (value: string) => void;
    wide?: boolean;
}): ReactElement {
    const { t } = useTranslation('watch');
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            className={cn(
                'group flex min-h-28 w-full flex-col overflow-hidden rounded-ui border bg-card text-left transition-colors [&_*]:pointer-events-none',
                selected ? 'border-foreground' : 'border-border hover:border-foreground/40',
                wide && 'sm:col-span-2'
            )}>
            {option.image ? (
                <span className="aspect-[5/4] overflow-hidden bg-muted">
                    <img
                        src={resolveAssetUrl(option.image)}
                        alt=""
                        className={cn(
                            'size-full transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.04]',
                            option.fit === 'contain' ? 'object-contain p-6' : 'object-cover',
                            option.imageClassName
                        )}
                    />
                </span>
            ) : null}
            <span className={cn('flex min-w-0 flex-col justify-center px-5', option.image ? 'py-4' : 'py-6')}>
                <span className={cn('block', option.image ? 'font-medium' : 'font-serif text-2xl font-normal')}>
                    {t(option.titleKey)}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{t(option.hintKey)}</span>
            </span>
        </button>
    );
}

function FinderStill({ src }: { src: string }): ReactElement {
    return (
        <div
            className="relative h-52 overflow-hidden bg-muted lg:sticky lg:top-[var(--header-height,72px)] lg:h-[calc(100dvh-var(--header-height,72px))]"
            aria-hidden="true"
            data-slot="luxury-finder-still">
            <img key={src} src={resolveAssetUrl(src)} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-accent lg:block" />
        </div>
    );
}

export default function WatchFinderTool({ hits, onSubmit }: WatchFinderToolProps): ReactElement {
    const { t } = useTranslation('watch');
    const seoUrlContext = useSeoUrlContext();
    const config = useConfig();
    const agentEnabled =
        isCimulateEnabled(config.cimulateAgent?.enabled) && validateCimulateConfig(config.cimulateAgent);
    const [started, setStarted] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [answers, setAnswers] = useState<FinderAnswers>(EMPTY_ANSWERS);
    const [showExplain, setShowExplain] = useState(false);
    const [results, setResults] = useState<RankedWatch[] | null>(null);

    const step = STEPS[stepIndex];
    const answerKey = step as keyof FinderAnswers;
    const selected = answers[answerKey];

    const options = useMemo((): Option[] => {
        if (step === 'budget') {
            return [
                { value: 'under5k', titleKey: 'finder.under5k', hintKey: 'finder.under5kHint' },
                { value: 'from5kTo10k', titleKey: 'finder.from5kTo10k', hintKey: 'finder.from5kTo10kHint' },
                { value: 'from10kTo20k', titleKey: 'finder.from10kTo20k', hintKey: 'finder.from10kTo20kHint' },
                { value: 'over20k', titleKey: 'finder.over20k', hintKey: 'finder.over20kHint' },
            ];
        }
        if (step === 'style') {
            return [
                {
                    value: 'dressy',
                    titleKey: 'finder.styleDressy',
                    hintKey: 'finder.styleDressyHint',
                    image: resolveAssetUrl('/images/finder-band.webp'),
                },
                {
                    value: 'sporty',
                    titleKey: 'finder.styleSporty',
                    hintKey: 'finder.styleSportyHint',
                    image: resolveAssetUrl('/images/hero-04.webp'),
                },
                {
                    value: 'everyday',
                    titleKey: 'finder.styleEveryday',
                    hintKey: 'finder.styleEverydayHint',
                    image: resolveAssetUrl('/images/hero-02.webp'),
                },
                {
                    value: 'statement',
                    titleKey: 'finder.styleStatement',
                    hintKey: 'finder.styleStatementHint',
                    image: resolveAssetUrl('/images/hero-03.webp'),
                },
            ];
        }
        if (step === 'occasion') {
            return [
                {
                    value: 'self',
                    titleKey: 'finder.occasionSelf',
                    hintKey: 'finder.occasionSelfHint',
                    image: resolveAssetUrl('/images/hero-01.webp'),
                },
                {
                    value: 'gift',
                    titleKey: 'finder.occasionGift',
                    hintKey: 'finder.occasionGiftHint',
                    image: resolveAssetUrl('/images/hero-02.webp'),
                },
                {
                    value: 'career',
                    titleKey: 'finder.occasionCareer',
                    hintKey: 'finder.occasionCareerHint',
                    image: resolveAssetUrl('/images/hero-03.webp'),
                },
                {
                    value: 'first',
                    titleKey: 'finder.occasionFirst',
                    hintKey: 'finder.occasionFirstHint',
                    image: resolveAssetUrl('/images/hero-04.webp'),
                },
            ];
        }
        if (step === 'wrist') {
            return [
                {
                    value: 's',
                    titleKey: 'finder.wristS',
                    hintKey: 'finder.wristSHint',
                    image: resolveAssetUrl('/images/finder-band.webp'),
                },
                {
                    value: 'm',
                    titleKey: 'finder.wristM',
                    hintKey: 'finder.wristMHint',
                    image: resolveAssetUrl('/images/hero-02.webp'),
                },
                {
                    value: 'l',
                    titleKey: 'finder.wristL',
                    hintKey: 'finder.wristLHint',
                    image: resolveAssetUrl('/images/hero-04.webp'),
                },
                { value: 'unknown', titleKey: 'finder.wristUnknown', hintKey: 'finder.wristUnknownHint' },
            ];
        }
        return [
            {
                value: 'automatic',
                titleKey: 'finder.automatic',
                hintKey: 'finder.automaticHint',
                image: resolveAssetUrl('/images/finder-band.webp'),
            },
            {
                value: 'manual',
                titleKey: 'finder.manual',
                hintKey: 'finder.manualHint',
                image: resolveAssetUrl('/images/hero-03.webp'),
            },
            { value: 'any', titleKey: 'finder.any', hintKey: 'finder.anyHint' },
        ];
    }, [step]);

    const select = (value: string) => {
        if (step === 'movement') setShowExplain(false);
        setAnswers((prev) => ({ ...prev, [answerKey]: value }));
    };

    const finish = (nextAnswers: FinderAnswers) => {
        const ranked = rankFinderHits(hits, nextAnswers);
        setResults(ranked);
        onSubmit?.(nextAnswers);
    };

    const goNext = () => {
        if (stepIndex === STEPS.length - 1) {
            finish(answers);
            return;
        }
        setShowExplain(false);
        setStepIndex((index) => index + 1);
    };

    const skipBudget = () => {
        setAnswers((prev) => ({ ...prev, budget: '' }));
        setStepIndex(1);
    };

    const startOver = () => {
        setAnswers(EMPTY_ANSWERS);
        setStepIndex(0);
        setShowExplain(false);
        setResults(null);
        setStarted(false);
    };

    const reasonLabel = (key: FinderReasonKey) => t(`finder.${key}`);

    if (!started && !results) {
        return (
            <div
                className="grid w-full lg:grid-cols-2 lg:items-start"
                data-testid="watch-finder"
                data-slot="luxury-finder"
                data-phase="intro">
                <FinderStill src={STEP_STILL.intro} />
                <div className="flex min-h-[calc(100dvh-var(--header-height,72px)-13rem)] flex-col justify-center px-[var(--page-gutter)] py-12 lg:min-h-[calc(100dvh-var(--header-height,72px))]">
                    <p className="text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        {t('finder.title')}
                    </p>
                    <h1 className="mt-4 max-w-xl font-serif text-4xl font-normal tracking-tight md:text-5xl">
                        {t('finder.subtitle')}
                    </h1>
                    <p className="mt-5 max-w-md text-muted-foreground">{t('finder.introBody')}</p>
                    <Button type="button" className="mt-10 w-fit px-8" onClick={() => setStarted(true)}>
                        {t('finder.begin')}
                    </Button>
                </div>
            </div>
        );
    }

    if (results) {
        return (
            <div
                className="w-full px-[var(--page-gutter)] py-16"
                data-testid="watch-finder"
                data-slot="luxury-finder"
                data-phase="results">
                <header className="max-w-2xl text-left">
                    <p className="text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        {t('finder.title')}
                    </p>
                    <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight md:text-5xl">
                        {t('finder.resultsTitle')}
                    </h1>
                    <p className="mt-3 text-muted-foreground">{t('finder.resultsSubtitle')}</p>
                </header>
                {results.length === 0 ? (
                    <p className="mt-16 text-muted-foreground">{t('finder.noResults')}</p>
                ) : (
                    <ul
                        className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8"
                        data-testid="watch-finder-results"
                        aria-live="polite">
                        {results.map(({ hit, reason }) => {
                            const diameter = getCaseDiameter(hit);
                            const movement = getMovementType(hit);
                            const collection = collectionDisplayName(getCollection(hit));
                            const specs = [
                                diameter !== undefined ? t('diameter', { mm: diameter }) : null,
                                movement ? t(`finder.${movement}`) : null,
                                collection || null,
                            ]
                                .filter(Boolean)
                                .join(' · ');
                            return (
                                <li key={hit.productId} className="flex flex-col text-left">
                                    <div className="mb-6 flex aspect-square items-center justify-center bg-muted">
                                        {hit.image?.link ? (
                                            <img
                                                src={resolveAssetUrl(hit.image.link)}
                                                alt={hit.productName ?? ''}
                                                className="h-full w-full object-contain p-6"
                                            />
                                        ) : null}
                                    </div>
                                    <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground">
                                        {reasonLabel(reason)}
                                    </p>
                                    <h2 className="mt-3 font-serif text-2xl font-normal">{hit.productName}</h2>
                                    <p className="mt-2 text-sm text-muted-foreground">{specs}</p>
                                    <div className="mt-3">
                                        <ProductPrice
                                            product={hit}
                                            currency={hit.currency ?? 'USD'}
                                            labelForA11y={hit.productName}
                                            currentPriceOnly
                                            hidePromo
                                        />
                                    </div>
                                    <Button asChild className="mt-8 w-full">
                                        <Link
                                            to={createProductUrl(
                                                { productId: hit.productId ?? '', slug: hit.slug },
                                                seoUrlContext
                                            )}>
                                            {t('finder.explore')}
                                        </Link>
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <div className="mt-14 flex flex-col items-start gap-4">
                    {agentEnabled ? (
                        <Button
                            type="button"
                            onClick={() =>
                                openAgentWidgetAndSendMessage(
                                    t('finder.agentResultsSeed', {
                                        budget: finderAnswerLabel(t, answers.budget),
                                        style: finderAnswerLabel(t, answers.style),
                                        occasion: finderAnswerLabel(t, answers.occasion),
                                        wrist: finderAnswerLabel(t, answers.wrist),
                                        movement: finderAnswerLabel(t, answers.movement),
                                    })
                                )
                            }>
                            {t('finder.askAdvisor')}
                        </Button>
                    ) : null}
                    <button
                        type="button"
                        onClick={startOver}
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                        {t('finder.startOver')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="grid w-full lg:grid-cols-2 lg:items-start"
            data-testid="watch-finder"
            data-slot="luxury-finder"
            data-step={step}
            data-phase="question">
            <FinderStill src={STEP_STILL[step]} />
            <div className="flex flex-col px-[var(--page-gutter)] py-10 lg:min-h-[calc(100dvh-var(--header-height,72px))] lg:py-16">
                <nav aria-label={t('finder.progressLabel')} className="mb-10">
                    <p className="mb-4 font-serif text-sm tracking-[0.2em] text-muted-foreground">
                        {String(stepIndex + 1).padStart(2, '0')}
                        <span className="mx-2 text-border">—</span>
                        {t('finder.stepOf', { current: stepIndex + 1, total: STEPS.length })}
                    </p>
                    <ol className="flex flex-wrap gap-x-5 gap-y-2 text-[0.6875rem] uppercase tracking-[0.16em]">
                        {STEPS.map((id, index) => (
                            <li key={id}>
                                <span
                                    className={cn(
                                        index === stepIndex
                                            ? 'text-foreground'
                                            : index < stepIndex
                                              ? 'text-foreground/50'
                                              : 'text-muted-foreground/50'
                                    )}
                                    aria-current={index === stepIndex ? 'step' : undefined}>
                                    {t(`finder.chapter.${id}`)}
                                </span>
                            </li>
                        ))}
                    </ol>
                </nav>

                <header className="text-left" key={step}>
                    <h1 className="font-serif text-4xl font-normal tracking-tight md:text-5xl">
                        {t(`finder.${step}Question`)}
                    </h1>
                    <p className="mt-3 max-w-xl text-muted-foreground">{t(`finder.${step}Hint`)}</p>
                </header>

                <div
                    aria-label={t(`finder.${step}Question`)}
                    className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2"
                    key={`${step}-options`}>
                    {options.map((option) => (
                        <OptionCard
                            key={option.value}
                            option={option}
                            selected={selected === option.value}
                            onSelect={select}
                            wide={Boolean(option.image === undefined && options.some((item) => item.image))}
                        />
                    ))}
                </div>

                {step === 'movement' ? (
                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() => setShowExplain((open) => !open)}
                            className={cn(
                                'flex w-full items-start gap-4 border-b border-border-subtle py-4 text-left transition-colors [&_*]:pointer-events-none',
                                showExplain ? 'border-foreground' : 'hover:border-foreground/40'
                            )}>
                            <span>
                                <span className="block font-medium">{t('finder.explain')}</span>
                                <span className="mt-1 block text-sm text-muted-foreground">
                                    {t('finder.explainHint')}
                                </span>
                            </span>
                        </button>
                        {showExplain ? (
                            <div className="mt-6 space-y-5 text-left" data-testid="watch-finder-education">
                                {(['automatic', 'manual', 'quartz'] as const).map((type) => (
                                    <article key={type}>
                                        <h2 className="font-serif text-xl">{t(`education.${type}.title`)}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {t(`education.${type}.body`)}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="mt-10 flex flex-col items-start gap-4">
                    <div className="flex items-center gap-3">
                        {stepIndex > 0 ? (
                            <Button type="button" variant="outline" onClick={() => setStepIndex((index) => index - 1)}>
                                {t('finder.back')}
                            </Button>
                        ) : null}
                        <Button type="button" onClick={goNext} disabled={!selected}>
                            {stepIndex === STEPS.length - 1 ? t('finder.submit') : t('finder.next')}
                        </Button>
                    </div>
                    {step === 'budget' ? (
                        <button
                            type="button"
                            onClick={skipBudget}
                            className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                            {t('finder.skip')}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
