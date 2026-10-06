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
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type WatchConfiguratorOption = {
    value: string;
    name: string;
    available?: boolean;
    image?: string;
    swatch?: string;
    filter?: string;
};

export type WatchConfiguratorStep = {
    id: string;
    name: string;
    options: WatchConfiguratorOption[];
};

export type WatchConfiguratorSelection = Record<string, string>;

type WatchConfiguratorProps = {
    steps: WatchConfiguratorStep[];
    value?: WatchConfiguratorSelection;
    defaultValue?: WatchConfiguratorSelection;
    validCombinations?: WatchConfiguratorSelection[];
    onChange?: (next: WatchConfiguratorSelection) => void;
};

function optionAvailable(
    stepId: string,
    optionValue: string,
    selection: WatchConfiguratorSelection,
    combos?: WatchConfiguratorSelection[]
): boolean {
    if (!combos?.length) return true;
    const trial = { ...selection, [stepId]: optionValue };
    return combos.some((combo) =>
        Object.entries(trial).every(([key, val]) => !val || combo[key] === undefined || combo[key] === val)
    );
}

function optionKind(step: WatchConfiguratorStep): 'image' | 'swatch' | 'label' {
    if (step.options.some((option) => option.image)) return 'image';
    if (step.options.some((option) => option.swatch)) return 'swatch';
    return 'label';
}

/**
 * Visual watch chooser — every axis stays in view (strap photos, dial chips, case metal)
 * so the shopper can see the difference, not walk a text wizard.
 */
export default function WatchConfigurator({
    steps,
    value,
    defaultValue,
    validCombinations,
    onChange,
}: WatchConfiguratorProps): ReactElement | null {
    const { t } = useTranslation('watch');
    const visibleSteps = useMemo(() => steps.filter((step) => step.options.length > 1), [steps]);
    const [internal, setInternal] = useState<WatchConfiguratorSelection>(() => defaultValue ?? {});
    const selection = value ?? internal;

    const commit = useCallback(
        (next: WatchConfiguratorSelection) => {
            setInternal(next);
            onChange?.(next);
        },
        [onChange]
    );

    const handleSelect = (stepId: string, optionValue: string) => {
        const next: WatchConfiguratorSelection = { ...selection, [stepId]: optionValue };
        for (const other of visibleSteps) {
            if (other.id === stepId) continue;
            const current = next[other.id];
            if (current && !optionAvailable(other.id, current, next, validCombinations)) {
                delete next[other.id];
            }
        }
        commit(next);
    };

    if (visibleSteps.length === 0) return null;

    return (
        <div className="flex flex-col gap-6" data-testid="watch-configurator" data-slot="watch-configurator">
            {visibleSteps.map((step, index) => {
                const kind = optionKind(step);
                const selectedOption = step.options.find((option) => option.value === selection[step.id]);
                return (
                    <section
                        key={step.id}
                        data-slot="configurator-step"
                        data-step={step.id}
                        data-kind={kind}
                        className="border-b border-border-subtle pb-5">
                        <div className="mb-3 flex items-baseline justify-between gap-3">
                            <h3 className="font-serif text-base font-normal">
                                <span className="sr-only">{t('configurator.stepLabel', { number: index + 1 })}</span>
                                {step.name}
                            </h3>
                            {selectedOption ? (
                                <span
                                    className="truncate text-xs text-muted-foreground"
                                    data-slot="configurator-step-choice">
                                    {selectedOption.name}
                                </span>
                            ) : (
                                <span className="text-xs text-muted-foreground">{t('configurator.choose')}</span>
                            )}
                        </div>
                        <div
                            role="radiogroup"
                            aria-label={step.name}
                            className={cn(
                                kind === 'swatch' && 'flex flex-wrap gap-3',
                                kind === 'image' && 'grid grid-cols-3 gap-2',
                                kind === 'label' && 'flex flex-col gap-1'
                            )}>
                            {step.options.map((option) => {
                                const selected = selection[step.id] === option.value;
                                const available =
                                    option.available !== false &&
                                    optionAvailable(step.id, option.value, selection, validCombinations);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        aria-label={option.name}
                                        disabled={!available}
                                        onClick={() => handleSelect(step.id, option.value)}
                                        data-slot="configurator-option"
                                        data-selected={selected || undefined}
                                        className={cn(
                                            'text-left transition-colors [&_*]:pointer-events-none',
                                            !available && 'cursor-not-allowed opacity-40',
                                            kind === 'image' &&
                                                cn(
                                                    'flex flex-col gap-2 rounded-ui border p-1.5',
                                                    selected
                                                        ? 'border-foreground'
                                                        : 'border-border hover:border-foreground/50'
                                                ),
                                            kind === 'swatch' && 'flex w-16 flex-col items-center gap-1.5',
                                            kind === 'label' &&
                                                cn(
                                                    'flex w-full items-center justify-between border-b border-border-subtle py-2 text-sm',
                                                    selected
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                )
                                        )}>
                                        {kind === 'image' ? (
                                            <span
                                                aria-hidden="true"
                                                data-slot="configurator-option-thumb"
                                                className="aspect-square w-full overflow-hidden bg-muted">
                                                {option.image ? (
                                                    <img
                                                        src={option.image}
                                                        alt=""
                                                        className="size-full object-cover object-center"
                                                        style={option.filter ? { filter: option.filter } : undefined}
                                                    />
                                                ) : option.swatch ? (
                                                    <span
                                                        className="block size-full"
                                                        style={{ backgroundColor: option.swatch }}
                                                    />
                                                ) : null}
                                            </span>
                                        ) : null}
                                        {kind === 'swatch' ? (
                                            <span
                                                aria-hidden="true"
                                                data-slot="configurator-option-swatch"
                                                className={cn(
                                                    'size-10 rounded-full border',
                                                    selected
                                                        ? 'border-foreground ring-1 ring-foreground ring-offset-2'
                                                        : 'border-border',
                                                    !option.swatch && 'bg-muted'
                                                )}
                                                style={option.swatch ? { backgroundColor: option.swatch } : undefined}
                                            />
                                        ) : null}
                                        <span
                                            className={cn(
                                                'font-medium text-foreground',
                                                kind === 'image' && 'px-0.5 pb-1 text-[0.6875rem] leading-tight',
                                                kind === 'swatch' && 'text-center text-[0.625rem] leading-tight',
                                                kind === 'label' && 'text-sm'
                                            )}>
                                            {option.name}
                                        </span>
                                        {!available ? (
                                            <span className="text-[0.625rem] text-muted-foreground" aria-hidden="true">
                                                {t('configurator.notAvailable')}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
