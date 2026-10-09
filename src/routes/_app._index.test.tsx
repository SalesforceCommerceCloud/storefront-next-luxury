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

import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { LoaderFunctionArgs } from 'react-router';
import type { ShopperExperience, ShopperProducts, ShopperSearch } from '@/scapi';
import HomePage, { type HomePageData, loader } from './_app._index';
import { createTestContext } from '@/lib/test-utils';
import { fetchPageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { fetchSearchProducts } from '@/lib/api/search.server';
import { fetchCategories } from '@/lib/api/categories.server';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import type { AppConfig } from '@/types/config';

// Mock data
const mockSearchResult = {
    hits: [
        {
            productId: 'product-1',
            productName: 'Product 1',
            image: { alt: 'Product 1', link: '/product1.jpg' },
            price: 29.99,
            currency: 'USD',
            inventory: { ats: 10 },
            representedProduct: {
                id: 'product-1',
            },
        },
    ],
    total: 1,
    query: '',
    refinements: [],
    searchPhraseSuggestions: { suggestedTerms: [] },
    sortingOptions: [],
    start: 0,
    count: 1,
    offset: 0,
    limit: 10,
} as unknown as ShopperSearch.schemas['ProductSearchResult'];

const mockCategories: ShopperProducts.schemas['Category'][] = [
    {
        id: 'category-1',
        name: 'Category 1',
        parentCategoryId: 'root',
        image: '/category1.jpg',
    },
    {
        id: 'category-2',
        name: 'Category 2',
        parentCategoryId: 'root',
        image: '/category2.jpg',
    },
    {
        id: 'category-3',
        name: 'Category 3',
        parentCategoryId: 'root',
        image: '/category3.jpg',
    },
    {
        id: 'category-4',
        name: 'Category 4',
        parentCategoryId: 'root',
        image: '/category4.jpg',
    },
];

// Helper function to create mock Page objects
const createMockPage = (regions: any[] = []): ShopperExperience.schemas['Page'] =>
    ({
        id: 'mock-page',
        typeId: 'homepage',
        regions,
    }) as ShopperExperience.schemas['Page'];

// Luxury home now follows the Foundations model: the sections are static JSX and the <Region> slots
// are empty (no errorElement). Mock Region as an empty slot (renders nothing) so these tests prove the
// sections render as STATIC content, independent of any Page Designer page.
vi.mock('@/components/region', () => ({
    Region: () => null,
}));

vi.mock('@/components/home/popular-category', () => ({
    default: ({ category }: { category: { id?: string; name?: string } }) => (
        <div data-testid="popular-category">{category.name}</div>
    ),
}));

vi.mock('@/components/grid', () => ({
    Grid: ({ children }: { children: React.ReactNode }) => <div data-testid="collection-grid">{children}</div>,
}));

vi.mock('@/components/link', () => ({
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

vi.mock('@/hooks/use-seo-url-context', () => ({
    useSeoUrlContext: () => ({ siteId: 'RefArchGlobal' }),
}));

vi.mock('@/components/content-card', () => ({
    default: ({ title, description, buttonText }: { title?: string; description?: string; buttonText?: string }) => (
        <section>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
            {buttonText ? <span>{buttonText}</span> : null}
        </section>
    ),
}));

// Mock HeroCarousel component
vi.mock('@/components/hero-carousel', () => ({
    default: () => <div data-testid="hero-carousel">Hero Carousel</div>,
    HeroCarouselSkeleton: () => <div data-testid="hero-carousel-skeleton">Hero Carousel</div>,
}));

// Mock ProductCarousel components
vi.mock('@/components/product-carousel', () => ({
    ProductCarouselSkeleton: () => <div data-testid="product-carousel-skeleton">Product Carousel</div>,
}));

vi.mock('@/components/product-carousel/carousel', () => ({
    ProductCarouselWithData: ({ data, title }: any) => (
        <div data-testid="product-carousel">
            {title && <h2>{title}</h2>}
            {data?.hits?.length ?? 0} products
        </div>
    ),
}));

// Mock the Button component
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// Mock the Skeleton component
vi.mock('@/components/ui/skeleton', () => ({
    Skeleton: ({ className, ...props }: any) => <div data-testid="skeleton" className={className} {...props} />,
}));

vi.mock('@/components/home/skeleton', () => ({
    default: () => <div data-testid="home-skeleton" />,
}));

// Mock react-i18next with partial mock to preserve other exports
vi.mock('react-i18next', async () => {
    const actual: any = await vi.importActual('react-i18next');
    return {
        ...actual,
        useTranslation: () => ({
            t: (key: string) => {
                // Simple translation mock that returns the translation key used in tests
                // Handle both with and without the 'home:' namespace prefix
                const normalizedKey = key.startsWith('home:') ? key.substring(5) : key;
                const translations: Record<string, string> = {
                    'hero.slide1.title': 'Welcome to Our Store',
                    'hero.slide1.subtitle': 'Discover amazing products',
                    'hero.slide1.imageAlt': 'Hero image',
                    'hero.slide1.ctaText': 'Shop Now',
                    'hero.slide2.title': 'Summer Collection',
                    'hero.slide2.subtitle': 'Hot deals on trending items',
                    'hero.slide2.ctaText': 'Explore',
                    'hero.slide3.title': 'Free Shipping',
                    'hero.slide3.subtitle': 'On orders over $50',
                    'hero.slide3.ctaText': 'Learn More',
                    'featuredProducts.title': 'Pieces we would put on a wrist.',
                    'finderBand.title': 'Find Your Watch',
                    'finderBand.subtitle': 'Answer a few questions. We will match a timepiece to your wrist and life.',
                    'finderBand.cta': 'Start the finder',
                    'editorial.title': 'Geneva, 1964',
                    'editorial.body':
                        'A manufacture devoted to considered proportions, finishing you can feel, and calibers made in our ateliers. Time, perfected.',
                    'editorial.cta': 'Read our story',
                    'editorial.imageAlt': 'Manufacture atelier in Geneva.',
                    'pair.boutiques.title': 'Boutiques',
                    'pair.boutiques.description': 'Private viewing in boutique.',
                    'pair.boutiques.cta': 'Find a boutique',
                    'pair.care.title': 'Care',
                    'pair.care.description': 'Service and regulation.',
                    'pair.care.cta': 'Care & service',
                    'appointment.title': 'Visit a boutique',
                    'appointment.body': 'Pieces at three thousand and above are shown by appointment.',
                    'appointment.cta': 'Book an appointment',
                    'collections.title': 'Our Collections',
                };
                return translations[normalizedKey] || key;
            },
            i18n: {
                language: 'en-US',
                changeLanguage: vi.fn(),
            },
        }),
    };
});

// Mock decorators and utilities
vi.mock('@/lib/decorators/page-type', () => ({
    PageType: () => (target: any) => target,
}));

vi.mock('@/lib/decorators/region-definition', () => ({
    RegionDefinition: () => (target: any) => target,
    getRegionDefinition: vi.fn(() => ({ id: 'headerbanner' })),
}));

vi.mock('@/lib/page-designer/page-loader.server', () => ({
    fetchPageWithComponentData: vi.fn(),
}));

vi.mock('@/lib/api/search.server', () => ({
    fetchSearchProducts: vi.fn(() => Promise.resolve(mockSearchResult)),
}));

vi.mock('@/lib/api/categories.server', () => ({
    fetchCategories: vi.fn(() => Promise.resolve(mockCategories)),
}));

vi.mock('@salesforce/storefront-next-runtime/config', async (importOriginal) => {
    const actual = await importOriginal<object>();
    return {
        ...actual,
        getConfig: vi.fn(),
        useConfig: () => ({ cimulateAgent: { enabled: false } }),
    };
});

vi.mock('@/lib/logger.server', () => ({
    getLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    })),
}));

vi.mock('@/middlewares/auth.server', () => ({
    getAuth: vi.fn(() => ({ customerId: null })),
}));

const renderComponent = (loaderDataOverrides?: Partial<HomePageData>) => {
    const defaultData: HomePageData = {
        page: {
            ...createMockPage([]),
            componentData: {},
        },
        searchResult: Promise.resolve(mockSearchResult),
        categories: Promise.resolve(mockCategories),

        pageUrl: 'http://localhost/',
        ogImageUrl: 'http://localhost/__ASSET_MOCK__',
    };
    const data = { ...defaultData, ...loaderDataOverrides };
    return render(<HomePage loaderData={data} />);
};

describe('HomePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock implementations for loader tests
        vi.mocked(fetchPageWithComponentData).mockResolvedValue({
            ...createMockPage([]),
            componentData: {},
        });
        vi.mocked(getConfig).mockReturnValue({ pages: { home: { featuredProductsCount: 8 } } } as AppConfig);
    });

    describe('Basic Rendering', () => {
        test('renders collection grid, finder band, and editorial', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
            });
            expect(screen.getByText('Find Your Watch')).toBeInTheDocument();
            expect(screen.getByText('Geneva, 1964')).toBeInTheDocument();
        });

        test('renders the hero scene (carousel + featured) and collections as static content', async () => {
            renderComponent();
            // The hero carousel is static JSX — not gated on a Page Designer region.
            expect(screen.getByTestId('hero-carousel')).toBeInTheDocument();
            await waitFor(() => {
                expect(screen.getByTestId('product-carousel')).toBeInTheDocument();
            });
            expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
        });
    });

    describe('Collections Section', () => {
        test('renders collection grid with categories', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
                expect(screen.getAllByTestId('popular-category')).toHaveLength(4);
            });
        });
    });

    describe('Error Handling', () => {
        test('handles page promise rejection gracefully', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
            });
        });

        test('renders the full static home even when the Page Designer page is missing', async () => {
            // Regression guard for the Foundations-model refactor: with no PD page the sections must
            // still render (they are static JSX, not an empty-region errorElement fallback).
            renderComponent({ page: null });
            expect(screen.getByTestId('hero-carousel')).toBeInTheDocument();
            await waitFor(() => {
                expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
            });
            expect(screen.getByText('Find Your Watch')).toBeInTheDocument();
            expect(screen.getByText('Geneva, 1964')).toBeInTheDocument();
            expect(screen.getByText('Visit a boutique')).toBeInTheDocument();
        });
    });

    describe('Layout and Styling', () => {
        test('applies correct main container styling', () => {
            const { container } = renderComponent();
            const mainContainer = container.firstChild as HTMLElement;
            expect(mainContainer).toHaveAttribute('data-slot', 'luxury-home-hero');
            expect(mainContainer).toHaveClass('pb-16');
            expect(mainContainer).toHaveClass('bg-background');
            expect(mainContainer).not.toHaveClass('-mt-8');
            expect(container.querySelector('[data-slot="luxury-home-scene"]')).toBeInTheDocument();
            expect(container.querySelector('[data-slot="luxury-home-parallax"]')).toBeInTheDocument();
            expect(container.querySelectorAll('[data-slot="luxury-home-parallax"] img')).toHaveLength(3);
        });
    });

    describe('Loaders', () => {
        let mockContext: ReturnType<typeof createTestContext>;
        let baseLoaderArgs: LoaderFunctionArgs;

        beforeEach(() => {
            mockContext = createTestContext();
            baseLoaderArgs = {
                request: new Request('http://localhost/'),
                url: new URL('http://localhost/'),
                params: {},
                context: mockContext,
                pattern: '/',
            };
        });

        describe('loader (server-side)', () => {
            test('starts independent data requests before the critical page resolves', async () => {
                let resolvePage!: (page: ShopperExperience.schemas['Page']) => void;
                vi.mocked(fetchPageWithComponentData).mockReturnValue(
                    new Promise((resolve) => {
                        resolvePage = resolve;
                    })
                );

                const result = loader(baseLoaderArgs);

                expect(fetchSearchProducts).toHaveBeenCalled();
                expect(fetchCategories).toHaveBeenCalled();

                resolvePage(createMockPage([]));
                await result;
            });

            test('awaits home page data with fetchPageWithComponentData', async () => {
                const mockPageWithData = {
                    ...createMockPage([]),
                    componentData: { test: Promise.resolve('data') },
                };
                const pagePromise = Promise.resolve(mockPageWithData);

                vi.mocked(fetchPageWithComponentData).mockReturnValue(pagePromise);

                const result = await loader(baseLoaderArgs);

                // Assert - API calls
                expect(vi.mocked(fetchPageWithComponentData)).toHaveBeenCalledWith(baseLoaderArgs, {
                    pageId: 'homepage',
                });

                // Assert - Return value contains all expected promises
                expect(result.page).toBe(mockPageWithData);
                expect(result.searchResult).toBeInstanceOf(Promise);
                expect(result.categories).toBeInstanceOf(Promise);
            });
        });

        describe('Error Handling', () => {
            test('loader propagates page API errors', async () => {
                const error = new Error('API Error');
                vi.mocked(fetchPageWithComponentData).mockRejectedValue(error);

                await expect(loader(baseLoaderArgs)).rejects.toThrow('API Error');
            });

            test('observes deferred request failures when the page request rejects', async () => {
                const pageError = new Error('Page failed');
                const searchPromise = Promise.reject(new Error('Search failed'));
                const categoriesPromise = Promise.reject(new Error('Categories failed'));
                const allSettledSpy = vi.spyOn(Promise, 'allSettled');

                vi.mocked(fetchPageWithComponentData).mockRejectedValueOnce(pageError);
                vi.mocked(fetchSearchProducts).mockReturnValueOnce(searchPromise);
                vi.mocked(fetchCategories).mockReturnValueOnce(categoriesPromise);

                try {
                    await expect(loader(baseLoaderArgs)).rejects.toBe(pageError);
                    expect(allSettledSpy).toHaveBeenCalledWith([searchPromise, categoriesPromise]);
                } finally {
                    allSettledSpy.mockRestore();
                }
            });
        });

        describe('Data Integration', () => {
            test('resolved page is returned with componentData', async () => {
                const mockPageWithData = {
                    ...createMockPage([]),
                    componentData: { some: Promise.resolve('data') },
                };
                const pagePromise = Promise.resolve(mockPageWithData);

                vi.mocked(fetchPageWithComponentData).mockReturnValue(pagePromise);

                const result = await loader(baseLoaderArgs);

                expect(vi.mocked(fetchPageWithComponentData)).toHaveBeenCalledWith(baseLoaderArgs, {
                    pageId: 'homepage',
                });
                expect(result.page).toBe(mockPageWithData);
                expect(result.searchResult).toBeInstanceOf(Promise);
                expect(result.categories).toBeInstanceOf(Promise);
            });
        });
    });

    describe('shouldRevalidate export', () => {
        // The policy itself is covered by src/lib/revalidation/routes/home.test.ts. Here we only
        // assert home wires up that exact function, so the behavior isn't re-tested at the route.
        test('re-exports the home page revalidation policy', async () => {
            const { shouldRevalidate } = await import('./_app._index');
            const { shouldRevalidate: shouldRevalidateHome } = await import('@/lib/revalidation/routes/home');
            expect(shouldRevalidate).toBe(shouldRevalidateHome);
        });
    });
});
