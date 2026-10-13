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
import type { ShopperProducts } from '@/scapi';
import type { GalleryImage } from '@/components/image-gallery';
import { cn } from '@/lib/utils';
import SpecTable from '@/components/spec-table';
import CollapsibleSection from '@/components/collapsible-section';
import type { SpecTableGroup } from '@/components/html-fragment/types';
import ManufactureGuarantee from '../manufacture-guarantee';
import {
    getCaseback,
    getCaseDiameter,
    getCertification,
    getCollection,
    getCrystal,
    getLugWidth,
    getMovementCaliber,
    getMovementType,
    getReferenceNumber,
    collectionDisplayName,
} from '../../lib/luxury-product';

function galleryGridClass(count: number): string {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 lg:grid-cols-4';
}

function galleryShotAspect(count: number): string {
    return count === 1 ? 'aspect-[16/10]' : 'aspect-[4/5]';
}

function shotCaption(
    key: string | undefined,
    t: (key: 'pdp.shot.wrist' | 'pdp.shot.angle' | 'pdp.shot.profile' | 'pdp.shot.detail') => string,
    fallback: string
): string {
    if (key === 'wrist') return t('pdp.shot.wrist');
    if (key === 'angle') return t('pdp.shot.angle');
    if (key === 'profile') return t('pdp.shot.profile');
    if (key === 'detail') return t('pdp.shot.detail');
    return fallback;
}

function shotKey(src: string | undefined): string | undefined {
    if (!src) return undefined;
    if (src.includes('-wrist.')) return 'wrist';
    if (src.includes('-angle.')) return 'angle';
    if (src.includes('-profile.')) return 'profile';
    if (src.includes('-detail.')) return 'detail';
    return undefined;
}

function AboutParagraphs({ text }: { text: string }): ReactElement {
    const blocks = text
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
    return (
        <div className="flex flex-col gap-4 text-base leading-relaxed text-foreground/90">
            {blocks.map((block) => (
                <p key={block.slice(0, 48)}>{block}</p>
            ))}
        </div>
    );
}

const COLLECTION_BROCHURE_HREF = '/docs/luxury-next-collection-brochure.pdf';

export default function PdpDetails({
    product,
    images,
}: {
    product: ShopperProducts.schemas['Product'];
    images: GalleryImage[];
}): ReactElement {
    const { t } = useTranslation('watch');
    const extra = images.filter((image) => shotKey(image.src));
    const collection = collectionDisplayName(getCollection(product));
    const name = product.name ?? '';
    const longDescription = product.longDescription ?? '';
    const [tab, setTab] = useState<'watch' | 'movement' | 'shipping'>('watch');

    const diameter = getCaseDiameter(product);
    const movement = getMovementType(product);
    const caliber = getMovementCaliber(product);
    const crystal = getCrystal(product);

    // Highlights render as the summary row at the top of the Specifications section (design parity).
    const highlights: Array<{ label: string; value: string }> = [];
    if (diameter) highlights.push({ label: t('pdp.highlight.diameter'), value: `${diameter}mm` });
    if (movement) highlights.push({ label: t('pdp.highlight.movement'), value: movement });
    if (caliber) highlights.push({ label: t('pdp.highlight.caliber'), value: caliber });
    if (crystal) highlights.push({ label: t('pdp.highlight.crystal'), value: crystal.replaceAll('_', ' ') });

    // Build specification groups (Movement, Case, Dial) for the dedicated section.
    const specGroups: SpecTableGroup[] = [];
    const pr = product as Record<string, unknown>;

    // Movement group
    const movementRows: Array<{ label: string; values: Record<string, string> }> = [];
    const movementType = getMovementType(product);
    const movementCaliber = getMovementCaliber(product);
    if (movementType) movementRows.push({ label: t('spec.movement'), values: { default: movementType } });
    if (movementCaliber) movementRows.push({ label: t('spec.caliber'), values: { default: movementCaliber } });
    if (typeof pr.c_powerReserve === 'number') {
        movementRows.push({
            label: t('spec.powerReserve'),
            values: { default: t('spec.hours', { hours: pr.c_powerReserve }) },
        });
    }
    if (typeof pr.c_frequency === 'number') {
        movementRows.push({
            label: t('spec.frequency'),
            values: { default: t('spec.hz', { hz: pr.c_frequency }) },
        });
    }
    if (typeof pr.c_jewels === 'number') {
        movementRows.push({ label: t('spec.jewels'), values: { default: String(pr.c_jewels) } });
    }
    const lug = getLugWidth(product);
    if (lug) movementRows.push({ label: t('spec.lugWidth'), values: { default: `${lug}mm` } });
    const caseback = getCaseback(product);
    if (caseback) movementRows.push({ label: t('spec.caseback'), values: { default: caseback } });
    if (movementRows.length > 0) {
        specGroups.push({ heading: t('spec.movement'), rows: movementRows });
    }

    // Case group
    const caseRows: Array<{ label: string; values: Record<string, string> }> = [];
    const reference = getReferenceNumber(product);
    if (reference) caseRows.push({ label: t('spec.reference'), values: { default: reference } });
    if (diameter) caseRows.push({ label: t('spec.diameter'), values: { default: `${diameter}mm` } });
    if (typeof pr.c_caseThickness === 'number') {
        caseRows.push({ label: t('spec.thickness'), values: { default: `${pr.c_caseThickness}mm` } });
    }
    if (typeof pr.c_caseMaterial === 'string') {
        caseRows.push({
            label: t('spec.material'),
            values: { default: pr.c_caseMaterial.replaceAll('_', ' ') },
        });
    }
    const crystalSpec = getCrystal(product);
    if (crystalSpec) caseRows.push({ label: t('spec.crystal'), values: { default: crystalSpec.replaceAll('_', ' ') } });
    if (typeof pr.c_waterResistance === 'number') {
        caseRows.push({
            label: t('spec.waterResistance'),
            values: { default: t('spec.meters', { meters: pr.c_waterResistance }) },
        });
    }
    if (caseRows.length > 0) {
        specGroups.push({ heading: t('spec.case'), rows: caseRows });
    }

    // Dial group
    const dialRows: Array<{ label: string; values: Record<string, string> }> = [];
    if (typeof pr.c_dialColor === 'string' && pr.c_dialColor) {
        dialRows.push({
            label: t('spec.dial'),
            values: { default: pr.c_dialColor.replaceAll('_', ' ') },
        });
    }
    const certification = getCertification(product);
    if (certification) dialRows.push({ label: t('spec.certification'), values: { default: certification } });
    if (Array.isArray(pr.c_complications) && pr.c_complications.length > 0) {
        dialRows.push({
            label: t('spec.features'),
            values: { default: pr.c_complications.map((c) => String(c).replaceAll('_', ' ')).join(', ') },
        });
    }
    if (typeof pr.c_bandType === 'string') {
        dialRows.push({
            label: t('spec.bracelet'),
            values: { default: pr.c_bandType.replaceAll('_', ' ') },
        });
    }
    if (dialRows.length > 0) {
        specGroups.push({ heading: t('spec.dial'), rows: dialRows });
    }

    const tabs = [
        { id: 'watch' as const, label: t('pdp.tab.watch') },
        { id: 'movement' as const, label: t('pdp.tab.movement') },
        { id: 'shipping' as const, label: t('pdp.tab.shipping') },
    ];

    // The Watch tab shows the full spec sheet (Movement / Case / Dial); the Movement tab narrows to
    // the Movement group only (matching the design reference). Shipping renders its own copy below.
    const visibleSpecGroups =
        tab === 'movement' ? specGroups.filter((group) => group.heading === t('spec.movement')) : specGroups;

    // The spec sheet: the visible groups as side-by-side collapsible sections, held permanently open
    // with the chevron hidden (canonical CollapsibleSection `forceOpen` + `hideToggle`) so they read
    // as an always-expanded table, matching the design.
    const specSheet = (
        <>
            <div className={cn('grid gap-4', visibleSpecGroups.length > 1 ? 'lg:grid-cols-3' : 'grid-cols-1')}>
                {visibleSpecGroups.map((group) => (
                    <CollapsibleSection
                        key={group.heading}
                        label={group.heading}
                        forceOpen
                        hideToggle
                        className="border-0">
                        <SpecTable content={{ contentType: 'spec-table', rows: group.rows }} />
                    </CollapsibleSection>
                ))}
            </div>
            <div className="mt-8">
                <a
                    href={COLLECTION_BROCHURE_HREF}
                    download
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                    {t('spec.downloadBrochure')}
                </a>
            </div>
        </>
    );

    return (
        <div data-testid="luxury-pdp-details" className="mt-16 lg:mt-24 flex flex-col gap-16 lg:gap-24">
            {longDescription ? (
                <section className="grid gap-8 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-16">
                    <div>
                        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('pdp.aboutEyebrow')}
                        </p>
                        <h2 className="mt-3 font-serif text-3xl md:text-4xl font-normal tracking-tight">
                            {t('pdp.aboutTitle', { name })}
                        </h2>
                        {collection ? <p className="mt-3 text-sm text-muted-foreground">{collection}</p> : null}
                    </div>
                    <AboutParagraphs text={longDescription} />
                </section>
            ) : null}

            {extra.length > 0 ? (
                <section>
                    <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        {t('pdp.detailsEyebrow')}
                    </p>
                    <h2 className="mt-3 mb-8 font-serif text-3xl md:text-4xl font-normal tracking-tight">
                        {t('pdp.detailsTitle')}
                    </h2>
                    <div
                        data-testid="luxury-pdp-gallery"
                        className={cn('grid gap-4 md:gap-6', galleryGridClass(extra.length))}>
                        {extra.map((image) => {
                            const key = shotKey(image.src);
                            const caption = shotCaption(key, t, image.alt ?? '');
                            return (
                                <figure key={image.src} className="flex flex-col">
                                    <div className={cn('overflow-hidden bg-muted', galleryShotAspect(extra.length))}>
                                        <img
                                            src={image.src}
                                            alt={image.alt ?? caption}
                                            className={cn(
                                                'block size-full origin-center object-cover',
                                                key === 'wrist'
                                                    ? 'scale-[1.12] object-[center_42%]'
                                                    : key === 'profile'
                                                      ? 'scale-[1.55] object-center'
                                                      : 'scale-[1.4] object-center'
                                            )}
                                        />
                                    </div>
                                    <figcaption className="pt-3 text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground">
                                        {caption}
                                    </figcaption>
                                </figure>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            <section className="text-center">
                <span className="mx-auto mb-8 block size-8 rotate-45 border border-accent" aria-hidden="true" />
                <h2 className="font-serif text-3xl md:text-4xl font-normal tracking-tight mb-8">
                    {t('pdp.availability.title')}
                </h2>
                <div className="flex flex-col gap-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                    <p>{t('pdp.availability.p1')}</p>
                    <p>{t('pdp.availability.p2')}</p>
                    <p>{t('pdp.availability.p3')}</p>
                </div>
            </section>

            <ManufactureGuarantee />

            {/* The Specifications section always renders so Shipping & warranty stays reachable even
                for a watch with no spec attributes (matching the design reference). The highlights row
                and each spec group are individually gated on having content. */}
            <section data-testid="luxury-pdp-specs" className="border-t border-border-subtle pt-10 lg:pt-14">
                <h2 className="font-serif text-3xl md:text-4xl font-normal tracking-tight">{t('spec.title')}</h2>
                {highlights.length > 0 ? (
                    <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 border-b border-border-subtle pb-8 md:grid-cols-4">
                        {highlights.map((row) => (
                            <div key={row.label}>
                                <dt className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground">
                                    {row.label}
                                </dt>
                                <dd className="mt-2 font-serif text-xl capitalize">{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                ) : null}
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-border-subtle">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={cn(
                                'pb-3 text-sm tracking-wide border-b-2 -mb-px',
                                tab === item.id
                                    ? 'border-foreground text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            )}>
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="mt-8">
                    {tab === 'shipping' ? (
                        <div className="grid gap-8 text-sm leading-relaxed lg:grid-cols-2">
                            <div>
                                <h3 className="mb-2 font-serif text-lg">{t('pdp.shipping.title')}</h3>
                                <p>{t('pdp.shipping.body')}</p>
                            </div>
                            <div>
                                <h3 className="mb-2 font-serif text-lg">{t('pdp.warranty.title')}</h3>
                                <p>{t('pdp.warranty.body')}</p>
                            </div>
                        </div>
                    ) : (
                        specSheet
                    )}
                </div>
            </section>
        </div>
    );
}
