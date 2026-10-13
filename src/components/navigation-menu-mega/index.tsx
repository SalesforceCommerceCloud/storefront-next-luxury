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
import { useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import type { ShopperProducts } from '@/scapi';
import { Component } from '@/lib/decorators/component';
import { RegionDefinition } from '@/lib/decorators';
import { getRegionIds } from '@/lib/decorators/region-definition';
import { Link } from '@/components/link';
import { isCimulateEnabled, openAgentWidgetAndSendMessage, validateCimulateConfig } from '@/components/cimulate';
import ResponsiveNavigationMenuEngine, {
    type ResponsiveNavigationMenuProps as ResponsiveNavigationMenuPropsBase,
    categoryHasBanner,
    resolveMegaMenuRegionId as resolveMegaMenuRegionIdEngine,
} from '@/components/navigation-menu-mega/responsive-navigation-menu';

/**
 * Luxury sources the mega-menu banner from `c_slotBannerImage` (mapped from `category.image` in
 * `resolve` below) in addition to the canonical `c_headerMenuBanner`. Passed to the shared engine as
 * its `hasBanner` predicate so this widening stays vertical-local — the canonical default only
 * matches `c_headerMenuBanner`, leaving other verticals untouched.
 */
function luxuryHasBanner(category?: ShopperProducts.schemas['Category']): boolean {
    if (categoryHasBanner(category)) return true;
    return typeof category?.c_slotBannerImage === 'string' && category.c_slotBannerImage.length > 0;
}

/**
 * Point the mega-menu banner at the standard, version-stamped `category.image` instead of the raw
 * `c_slotBannerImage` SCAPI returns unversioned (which 404s on Managed Runtime). Applied to both the
 * `resolve` and `defer` category feeds so the top nav bar AND the open dropdown panel resolve.
 */
function remapCategoryBanner(category: ShopperProducts.schemas['Category']): ShopperProducts.schemas['Category'] {
    const image = (category as { image?: string }).image;
    return image ? ({ ...category, c_slotBannerImage: image } as ShopperProducts.schemas['Category']) : category;
}

// Re-export shared helpers from canonical for backward compatibility
/* eslint-disable react-refresh/only-export-components -- re-exporting shared engine helpers, not new component definitions */
export {
    type MegaMenuCategoryFields,
    useMobileMenu,
    MobileMenuDropdown,
    regionHasContent,
    categoryHasBanner,
} from '@/components/navigation-menu-mega/responsive-navigation-menu';
/* eslint-enable react-refresh/only-export-components */

@Component('megaMenu', {
    name: 'Mega Menu',
    group: 'Layout',
    description: 'Site-wide mega menu with per-category dropdown panel content slots',
    embedded: true,
    component_id: 'mega-menu',
})
@RegionDefinition([
    // One region per top-level category, keyed by category id via the `region_<id>` convention.
    // Edit this list to match your catalog's top-level category ids. Must stay an array literal —
    // the cartridge generator extracts regions via AST and only handles array-literal arguments.
    // Region ids must match Page Designer's ^[\w]+$ pattern, so hyphenated category ids
    // (limited-editions, shop-by-price) are normalized to `_` here — the same normalization
    // resolveMegaMenuRegionId applies at runtime, so `region_<category.id>` still resolves.
    { id: 'region_heritage', name: 'Heritage' },
    { id: 'region_sport', name: 'Sport' },
    { id: 'region_dive', name: 'Dive' },
    { id: 'region_aviation', name: 'Aviation' },
    { id: 'region_complications', name: 'Complications' },
    { id: 'region_limited_editions', name: 'Limited Editions' },
    { id: 'region_ladies', name: 'Ladies' },
    { id: 'region_shop_by_price', name: 'Shop By Price' },
])
// oxlint-disable-next-line react-refresh/only-export-components
export class MegaMenuMetadata {}

/**
 * Declared mega-menu region ids, derived from the `@RegionDefinition` decorator above so the
 * decorator list is the single source of truth. A top-level category renders its region when
 * `region_${category.id}` is present in this set.
 */
export const MEGA_MENU_REGION_IDS: ReadonlySet<string> = new Set(getRegionIds(MegaMenuMetadata));

/**
 * Resolves the embedded-component region id for a top-level category, defaulting `regionIds` to
 * luxury's {@link MEGA_MENU_REGION_IDS} so callers may omit it — same signature as the canonical
 * export, so the shared unit tests apply unchanged. Wraps the shared engine resolver.
 */
// oxlint-disable-next-line react-refresh/only-export-components
export function resolveMegaMenuRegionId(
    categoryId: string | undefined,
    hasEmbeddedComponent: boolean,
    regionIds: ReadonlySet<string> = MEGA_MENU_REGION_IDS
): string | undefined {
    return resolveMegaMenuRegionIdEngine(categoryId, hasEmbeddedComponent, regionIds);
}

// All configuration is handled internally
export type ResponsiveNavigationMenuProps = Omit<
    ResponsiveNavigationMenuPropsBase,
    'regionIds' | 'categoryFilter' | 'portalSlots' | 'hasBanner' | 'utilityContent'
>;

/**
 * ResponsiveNavigationMenu - Luxury vertical wrapper for the shared navigation engine
 *
 * This wrapper configures the shared ResponsiveNavigationMenu engine with luxury-specific settings:
 * - Luxury region IDs (heritage, sport, dive, etc.)
 * - Portal slots for catalog and utility sections
 * - Extra navigation links (watch finder, boutiques)
 * - Category filter that hides menu-suppressed categories (c_showInMenu:false — e.g. shop-by-price, straps)
 *
 * @param props - Component props
 * @param props.resolve - Promise resolving to root categories and first-level subcategories
 * @param props.defer - Promise resolving to deeper subcategory data for prefetch
 * @param props.embeddedComponent - Optional Page Designer 'mega-menu' component data
 * @returns A responsive navigation component with luxury-specific configuration
 */
export default function ResponsiveNavigationMenu(props: ResponsiveNavigationMenuProps): ReactElement {
    const { t } = useTranslation('header');
    const { t: tw } = useTranslation('watch');
    const config = useConfig();
    const watchFinderAgent =
        isCimulateEnabled(config.cimulateAgent?.enabled) && validateCimulateConfig(config.cimulateAgent);

    // The mega-menu CategoryBanner reads `c_slotBannerImage`, but SCAPI returns that custom attribute
    // verbatim as an unversioned path that never resolves on Managed Runtime (which requires the
    // `dwXXXX` version segment). Point the banner at the STANDARD `category.image` field instead — the
    // same version-stamped URL the home collection tiles render. Apply to BOTH feeds: `resolve` (the
    // top-level nav bar) AND `defer` (prefills the sub-category store backing the OPEN dropdown panel);
    // remapping only `resolve` leaves the open panel showing the broken raw value.
    const resolve = useMemo(() => {
        const base = props.resolve;
        if (!base) return base;
        return base.then((root) => ({
            ...root,
            categories: (root.categories ?? []).map(remapCategoryBanner),
        }));
    }, [props.resolve]);
    const defer = useMemo(() => {
        const base = props.defer;
        if (!base) return base;
        return base.then((categories) => (categories ?? []).map(remapCategoryBanner));
    }, [props.defer]);

    const utilityContent = (
        <nav className="flex h-full w-full items-center" aria-label="Site">
            <ul className="flex items-center gap-5">
                <li>
                    {watchFinderAgent ? (
                        <button
                            type="button"
                            onClick={() => openAgentWidgetAndSendMessage(tw('finder.agentSeed'))}
                            className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-header-foreground hover:text-header-menu-hover-foreground">
                            {t('watchFinder')}
                        </button>
                    ) : (
                        <Link
                            to="/find-your-watch"
                            className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-header-foreground hover:text-header-menu-hover-foreground">
                            {t('watchFinder')}
                        </Link>
                    )}
                </li>
                <li>
                    <Link
                        to="/boutiques"
                        className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-header-foreground hover:text-header-menu-hover-foreground">
                        {t('boutiques')}
                    </Link>
                </li>
            </ul>
        </nav>
    );

    return (
        <ResponsiveNavigationMenuEngine
            {...props}
            resolve={resolve}
            defer={defer}
            regionIds={MEGA_MENU_REGION_IDS}
            hasBanner={luxuryHasBanner}
            categoryFilter={(category) => String((category as { c_showInMenu?: unknown }).c_showInMenu) !== 'false'}
            portalSlots={{
                catalog: 'luxury-catalog-slot',
                utility: 'luxury-utility-slot',
                mobileMenu: 'luxury-mobile-menu',
            }}
            utilityContent={utilityContent}
        />
    );
}
