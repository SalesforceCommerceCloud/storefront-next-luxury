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

/**
 * Luxury Next header — mobile: hamburger, centered logo, search icon;
 * desktop: logo left, search centered, extras beside account. Catalog mega
 * on a second row. Conceal-on-scroll.
 */
import {
    type ReactElement,
    type ReactNode,
    type PropsWithChildren,
    useRef,
    useEffect,
    useCallback,
    useState,
} from 'react';
import { useLocation } from 'react-router';
import { Link } from '@/components/link';
import Search from '@/components/header/search';
import CartBadge from '@/components/header/cart-badge';
import UserActions from '@/components/header/user-actions/user-actions';
import WishlistIcon from '@/components/header/wishlist-icon';
import { useTranslation } from 'react-i18next';
import logo from '/images/logo.svg';
import { Search as SearchIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@/components/icons';
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import { openAgentWidget, isCimulateEnabled, validateCimulateConfig } from '@/components/cimulate';
import { UITarget } from '@/targets/ui-target';
import { cn } from '@/lib/utils';
import { Component } from '@/lib/decorators/component';
import { RegionDefinition } from '@/lib/decorators';

@Component('header', {
    name: 'Header',
    group: 'Layout',
    description: 'Global site header with navigation, search, and cart',
    embedded: true,
    component_id: 'header',
})
@RegionDefinition([{ id: 'announcement', name: 'Announcement', description: 'Displayed above the header' }])
// oxlint-disable-next-line react/only-export-components -- oxlint flags the co-exported Page Designer metadata class; eslint-plugin-react-refresh does not
export class HeaderMetadata {}

interface HeaderProps extends PropsWithChildren {
    beforeHeader?: ReactNode;
    announcementSlot?: ReactNode;
    variant?: 'full' | 'checkout';
}

function LocationKeyedSearch() {
    const location = useLocation();
    return <Search key={`${location.pathname}${location.search}`} />;
}

function useConcealOnScroll(): boolean {
    const [concealed, setConcealed] = useState(false);

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reduce.matches) return undefined;

        let lastY = window.scrollY;
        let ticking = false;
        let rafId: number | null = null;

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            rafId = window.requestAnimationFrame(() => {
                const y = window.scrollY;
                const locked =
                    document.documentElement.hasAttribute('data-mega-menu-open') ||
                    document.documentElement.hasAttribute('data-search-open') ||
                    document.documentElement.hasAttribute('data-mobile-menu-open');
                if (locked || y < 12) {
                    setConcealed(false);
                } else if (y > lastY + 8) {
                    setConcealed(true);
                } else if (y < lastY - 8) {
                    setConcealed(false);
                }
                lastY = y;
                ticking = false;
                rafId = null;
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (rafId !== null) window.cancelAnimationFrame(rafId);
        };
    }, []);

    return concealed;
}

const chromeClass =
    'bg-header-background text-header-foreground border-b border-header-border fixed top-0 left-0 right-0 z-50 [@media(max-height:400px)]:static transition-[background-color,border-color,color] duration-300 ease-out';

export default function Header({
    children,
    beforeHeader,
    announcementSlot,
    variant = 'full',
}: HeaderProps): ReactElement {
    const { t } = useTranslation('header');
    const headerRef = useRef<HTMLElement>(null);
    const config = useConfig();
    const concealed = useConcealOnScroll();
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const showChat =
        variant === 'full' &&
        isCimulateEnabled(config.cimulateAgent?.enabled) &&
        validateCimulateConfig(config.cimulateAgent);

    const updateHeaderHeight = useCallback(() => {
        if (headerRef.current) {
            const height = `${headerRef.current.offsetHeight}px`;
            headerRef.current.style.setProperty('--header-height', height);
            document.documentElement.style.setProperty('--header-height', height);
        }
    }, []);

    const handleNavMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as Element;
        const trigger = target.closest('[data-slot="navigation-menu-trigger"]');
        if (trigger?.hasAttribute('data-has-submenu')) {
            document.documentElement.setAttribute('data-mega-menu-open', 'true');
        }
    }, []);

    const handleNavFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
        const target = e.target as Element;
        const trigger = target.closest('[data-slot="navigation-menu-trigger"]');
        if (trigger?.hasAttribute('data-has-submenu')) {
            document.documentElement.setAttribute('data-mega-menu-open', 'true');
        }
    }, []);

    const handleNavMouseLeave = useCallback(() => {
        const openTrigger = document.querySelector('[data-slot="navigation-menu-trigger"][data-state="open"]');
        if (!openTrigger) {
            document.documentElement.removeAttribute('data-mega-menu-open');
        }
    }, []);

    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        updateHeaderHeight();
        const observer = new ResizeObserver(updateHeaderHeight);
        observer.observe(el);
        return () => observer.disconnect();
    }, [updateHeaderHeight]);

    useEffect(() => {
        if (!mobileSearchOpen) {
            document.documentElement.removeAttribute('data-search-open');
            return undefined;
        }
        document.documentElement.setAttribute('data-search-open', 'true');
        const frame = window.requestAnimationFrame(() => {
            document.querySelector<HTMLInputElement>('[data-testid="header-search-mobile"] input')?.focus();
        });
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMobileSearchOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('keydown', onKey);
            document.documentElement.removeAttribute('data-search-open');
        };
    }, [mobileSearchOpen]);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const openTrigger = document.querySelector('[data-slot="navigation-menu-trigger"][data-state="open"]');
            if (openTrigger) {
                document.documentElement.setAttribute('data-mega-menu-open', 'true');
            } else {
                document.documentElement.removeAttribute('data-mega-menu-open');
            }
        });
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-state'],
            subtree: true,
        });
        return () => observer.disconnect();
    }, []);

    const concealClass = cn(
        chromeClass,
        'transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:translate-y-0',
        concealed && '-translate-y-full'
    );

    if (variant === 'checkout') {
        return (
            <header ref={headerRef} data-slot="site-header" className={chromeClass}>
                <div className="section-container">
                    <div className="flex items-center h-14">
                        <Link to="/" className="flex-shrink-0 flex items-center" data-testid="header-logo">
                            <img
                                src={logo}
                                alt={t('logoAlt')}
                                className="h-8 w-auto [filter:var(--header-logo-filter)]"
                            />
                        </Link>
                        <div className="flex-1" />
                        <CartBadge />
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header
            ref={headerRef}
            data-slot="site-header"
            data-header-concealed={concealed ? 'true' : 'false'}
            className={concealClass}>
            {announcementSlot}
            <UITarget targetId="sfcc.header.promo.top" />
            {beforeHeader}
            <div className="section-container">
                <div className="relative flex flex-wrap items-center gap-x-3 py-3 lg:gap-x-6 lg:py-3.5">
                    <div className="z-10 flex shrink-0 items-center self-stretch">
                        <div
                            className="flex items-center self-stretch"
                            onMouseOver={handleNavMouseOver}
                            onFocus={handleNavFocus}
                            onMouseLeave={handleNavMouseLeave}>
                            {children}
                        </div>
                        <Link
                            to="/"
                            className="flex shrink-0 items-center max-lg:absolute max-lg:left-1/2 max-lg:top-1/2 max-lg:z-0 max-lg:-translate-x-1/2 max-lg:-translate-y-1/2"
                            data-testid="header-logo">
                            <img
                                src={logo}
                                alt={t('logoAlt')}
                                className="h-auto w-auto max-h-5 max-w-[6.25rem] lg:max-h-10 lg:max-w-none [filter:var(--header-logo-filter)]"
                            />
                        </Link>
                    </div>

                    <div
                        className="order-last mt-2 hidden w-full min-w-0 lg:block xl:order-none xl:mt-0 xl:w-auto xl:flex-1 xl:px-8"
                        data-slot="luxury-header-search">
                        <div className="mx-auto w-full max-w-4xl">
                            <LocationKeyedSearch />
                        </div>
                    </div>

                    <div className="relative z-10 ml-auto flex shrink-0 items-center justify-end gap-x-0.5 lg:gap-x-1">
                        <div
                            data-slot="luxury-utility-slot"
                            className="hidden lg:flex items-center self-stretch pr-2"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden cursor-pointer px-1 text-header-foreground hover:bg-transparent hover:opacity-50 transition-opacity"
                            onClick={() => setMobileSearchOpen((open) => !open)}
                            aria-expanded={mobileSearchOpen}
                            aria-controls="header-mobile-search"
                            data-testid="header-search-toggle"
                            aria-label={
                                mobileSearchOpen ? t('closeSearch', 'Close search') : t('openSearch', 'Open search')
                            }>
                            {mobileSearchOpen ? <X className="size-5" /> : <SearchIcon className="size-5" />}
                        </Button>
                        <UITarget targetId="sfcc.header.before.cart" />
                        {showChat && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer lg:px-2 px-1 text-header-foreground hover:bg-transparent hover:opacity-50 transition-opacity"
                                onClick={() => openAgentWidget()}
                                aria-label={t('openChat')}>
                                <SparklesIcon />
                            </Button>
                        )}
                        <UserActions />
                        <WishlistIcon />
                        <CartBadge />
                    </div>
                </div>

                <div data-slot="luxury-catalog-slot" className="hidden lg:block" />

                {mobileSearchOpen ? (
                    <div className="pb-3 pt-1 lg:hidden" data-testid="header-search-mobile" id="header-mobile-search">
                        <LocationKeyedSearch />
                    </div>
                ) : null}
                <UITarget targetId="sfcc.header.bnpl.banner" />
            </div>
        </header>
    );
}
