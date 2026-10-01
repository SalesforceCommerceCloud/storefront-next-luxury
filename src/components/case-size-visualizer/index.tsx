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
import { useId, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { getCaseDiameter } from '../../lib/luxury-product';
import { WRISTS, caseCoveragePercent, presenceFromCoverage, wristWidthMm, type WristId } from './presence';

const VIEW = 120;
const CX = VIEW / 2;
const CY = VIEW / 2;
const PX_PER_MM = (VIEW - 16) / wristWidthMm(18.5);
const MIN_WRIST_MM = 130;
const MAX_WRIST_MM = 220;

function FitDiagram({ caseMm, wristCm, label }: { caseMm: number; wristCm: number; label: string }): ReactElement {
    const wristR = (wristWidthMm(wristCm) * PX_PER_MM) / 2;
    const caseR = (caseMm * PX_PER_MM) / 2;

    return (
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="size-28 shrink-0 sm:size-32" role="img" aria-label={label}>
            <circle cx={CX} cy={CY} r={wristR} className="fill-muted-foreground/20" />
            <circle cx={CX} cy={CY} r={caseR} className="fill-card stroke-foreground" strokeWidth={1.5} />
            <text
                x={CX}
                y={CY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground font-serif"
                fontSize="11">
                {`${caseMm}mm`}
            </text>
        </svg>
    );
}

function matchingWrist(mm: number): WristId | null {
    const match = WRISTS.find((item) => Math.round(item.cm * 10) === mm);
    return match?.id ?? null;
}

export default function CaseSizeVisualizer({ product }: { product?: unknown }): ReactElement | null {
    const { t } = useTranslation('watch');
    const inputId = useId();
    const diameter = getCaseDiameter(product);
    const [wristMm, setWristMm] = useState(Math.round(WRISTS[1].cm * 10));
    // Editing buffer: the input is driven by this string so partial/empty entries survive while typing.
    // `wristMm` (the committed number) drives the diagram/coverage; the two re-sync on a valid commit.
    const [draft, setDraft] = useState(() => String(Math.round(WRISTS[1].cm * 10)));

    if (diameter == null) return null;

    const wristCm = wristMm / 10;
    const selected = matchingWrist(wristMm);
    const percent = caseCoveragePercent(diameter, wristCm);
    const presence = t(`visualizer.presence.${presenceFromCoverage(percent)}`);

    // Commit a wrist value: clamp into [MIN, MAX], round, and keep the editing buffer in sync.
    const commitWrist = (mm: number) => {
        const clamped = Math.min(MAX_WRIST_MM, Math.max(MIN_WRIST_MM, Math.round(mm)));
        setWristMm(clamped);
        setDraft(String(clamped));
    };
    // Normalize the free-typed draft on commit (blur / Enter): clamp a valid number, else revert.
    const commitDraft = () => {
        const next = Number(draft);
        if (draft === '' || !Number.isFinite(next)) {
            setDraft(String(wristMm));
            return;
        }
        commitWrist(next);
    };

    return (
        <div data-testid="case-size-visualizer">
            <Accordion type="single" collapsible className="w-full border-y border-border">
                <AccordionItem value="wears" className="border-0">
                    <AccordionTrigger className="py-4 text-left font-serif text-base font-normal hover:no-underline">
                        {t('visualizer.title')}
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:gap-6">
                            <FitDiagram
                                caseMm={diameter}
                                wristCm={wristCm}
                                label={t('visualizer.diagramLabel', { mm: diameter, cm: wristCm })}
                            />
                            <div className="min-w-0 flex-1">
                                <label htmlFor={inputId} className="text-sm text-muted-foreground">
                                    {t('visualizer.yourWrist')}
                                </label>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <input
                                        id={inputId}
                                        type="number"
                                        inputMode="numeric"
                                        min={MIN_WRIST_MM}
                                        max={MAX_WRIST_MM}
                                        value={draft}
                                        onChange={(event) => {
                                            const raw = event.target.value;
                                            setDraft(raw); // allow free/partial typing ("", "1", "18", …)
                                            // Commit live only when already valid AND in range — this covers
                                            // the native steppers and a completed value; partial/out-of-range
                                            // entries wait for blur so typing never snaps back to the minimum.
                                            const next = Number(raw);
                                            if (
                                                raw !== '' &&
                                                Number.isFinite(next) &&
                                                next >= MIN_WRIST_MM &&
                                                next <= MAX_WRIST_MM
                                            ) {
                                                setWristMm(Math.round(next));
                                            }
                                        }}
                                        onBlur={commitDraft}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') commitDraft();
                                        }}
                                        className="w-20 border-b border-border bg-transparent py-1 font-serif text-xl outline-none focus-visible:border-foreground"
                                    />
                                    <span className="text-sm text-muted-foreground">{t('visualizer.mmUnit')}</span>
                                </div>
                                <div
                                    role="radiogroup"
                                    aria-label={t('visualizer.wristLabel')}
                                    className="mt-3 flex flex-wrap gap-2">
                                    {WRISTS.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected === item.id}
                                            className={cn(
                                                'rounded-ui border px-3 py-1.5 text-center text-xs',
                                                selected === item.id
                                                    ? 'border-foreground'
                                                    : 'border-border hover:border-foreground/40'
                                            )}
                                            onClick={() => commitWrist(item.cm * 10)}>
                                            {t(`visualizer.wrist.${item.id}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="mt-3 text-sm" data-testid="case-size-coverage">
                            {t('visualizer.coverageLine', { presence, mm: diameter, percent })}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{t('visualizer.compare')}</p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
