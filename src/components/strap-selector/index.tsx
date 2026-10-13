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
import { Link } from '@/components/link';
import { formatCurrency } from '@/lib/currency';
import type { ShopperProducts } from '@/scapi';
import { createProductUrl } from '@/route-paths';
import { useSeoUrlContext } from '@/hooks/use-seo-url-context';

export default function StrapSelector({
    straps,
}: {
    straps: ShopperProducts.schemas['Product'][];
}): ReactElement | null {
    const { t, i18n } = useTranslation('watch');
    const seoUrlContext = useSeoUrlContext();
    if (straps.length === 0) return null;

    return (
        <section className="mt-10" data-testid="strap-selector">
            <h2 className="font-serif text-2xl">{t('strap.title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('strap.compatible')}</p>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {straps.map((strap) => {
                    const image = strap.imageGroups?.[0]?.images?.[0];
                    const price =
                        typeof strap.price === 'number'
                            ? formatCurrency(strap.price, i18n.language, strap.currency ?? 'USD')
                            : null;
                    return (
                        <li key={strap.id}>
                            <Link
                                to={createProductUrl({ productId: strap.id ?? '', slug: strap.slug }, seoUrlContext)}
                                className="group flex flex-col text-foreground no-underline">
                                <div className="aspect-[4/5] overflow-hidden bg-muted">
                                    {image?.link ? (
                                        <img
                                            src={image.link}
                                            alt={image.alt || strap.name || ''}
                                            className="size-full object-cover object-center transition-transform group-hover:scale-[1.04]"
                                        />
                                    ) : null}
                                </div>
                                <p className="mt-3 font-serif text-sm leading-snug">{strap.name}</p>
                                {price ? <p className="mt-1 text-xs text-muted-foreground">{price}</p> : null}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
