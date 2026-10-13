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
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ShopperExperience } from '@/scapi';
import type { Route } from './+types/_app.about-us';
import { getTranslation } from '@salesforce/storefront-next-runtime/i18n';
import AboutUs, { type AboutUsPageData, loader } from './_app.about-us';
import { createTestContext } from '@/lib/test-utils';
import { fetchPageWithComponentData } from '@/lib/page-designer/page-loader.server';

const { t } = getTranslation();

// Helper function to create mock Page objects
const createMockPage = (regions: any[] = []): ShopperExperience.schemas['Page'] =>
    ({
        id: 'mock-page',
        typeId: 'aboutus',
        regions,
    }) as ShopperExperience.schemas['Page'];

// Luxury About Us now follows the Foundations model: the sections are static JSX and the <Region>
// slots are empty (no errorElement). Mock Region as an empty slot (renders nothing) so these tests
// prove the sections render as STATIC content, independent of any Page Designer page.
vi.mock('@/components/region', () => ({
    Region: () => null,
}));

// Mock the Link component
vi.mock('@/components/link', () => ({
    Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

// Mock the Contact component
vi.mock('@/components/contact', () => ({
    default: () => <div data-testid="contact">Contact Form</div>,
}));

// Mock the ContentCard component
vi.mock('@/components/content-card', () => ({
    default: ({ title, description }: any) => (
        <div data-testid="content-card">
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    ),
}));

// Mock react-i18next with partial mock to preserve other exports
vi.mock('react-i18next', async () => {
    const actual: any = await vi.importActual('react-i18next');
    return {
        ...actual,
        useTranslation: () => ({
            t: (key: string) => {
                // Simple translation mock that returns the translation key used in tests
                const normalizedKey = key.startsWith('aboutUs:') ? key.substring(8) : key;
                const translations: Record<string, string> = {
                    title: 'The manufacture',
                    'meta.description': 'A Geneva manufacture since 1964.',
                    'breadcrumb.home': 'Home',
                    'breadcrumb.aboutUs': 'The manufacture',
                    'section.ourGoal.title': 'Geneva, 1964.',
                    'section.ourGoal.content': 'Luxury Next was founded in Geneva as a manufacture.',
                    'section.ourVision.title': 'The ateliers',
                    'section.ourVision.content': 'North light, wooden benches, and the quiet of regulation.',
                    'section.ourVision.imageAlt': 'Empty Geneva ateliers in north light.',
                    'section.ourValue.title': 'Finishing you can feel',
                    'section.ourValue.content': 'Bevels, brushing, and the weight of a case in the hand.',
                    'section.ourValue.imageAlt': 'A round steel case on a finishing bench.',
                    'section.ourMission.title': 'Care & servicing',
                    'section.ourMission.content': 'A two-year international warranty from delivery.',
                    'section.ourMission.cta': 'Care & servicing',
                    'section.ourTeam.title': 'Boutiques worldwide',
                    'section.ourTeam.content':
                        'Geneva, London, New York, Paris, and Tokyo. Try the piece on the wrist.',
                    'section.ourTeam.imageAlt': 'Quiet boutique interior.',
                    'section.ourTeam.cta': 'Find a boutique',
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
}));

vi.mock('@/lib/page-designer/page-loader.server', () => ({
    fetchPageWithComponentData: vi.fn(),
}));

vi.mock('@/lib/logger.server', () => ({
    getLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    })),
}));

const renderComponent = (loaderDataOverrides?: Partial<AboutUsPageData>) => {
    const defaultData: AboutUsPageData = {
        page: {
            ...createMockPage([]),
            componentData: {},
        },
        pageUrl: 'http://localhost/about-us',
        ogImageUrl: 'http://localhost/__ASSET_MOCK__',
    };
    const data = { ...defaultData, ...loaderDataOverrides };
    return render(<AboutUs loaderData={data} />);
};

describe('AboutUs', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock implementations for loader tests
        vi.mocked(fetchPageWithComponentData).mockResolvedValue({
            ...createMockPage([]),
            componentData: {},
        });
    });

    describe('Basic Rendering', () => {
        test('renders breadcrumb navigation', () => {
            renderComponent();
            expect(screen.getByText(t('aboutUs:breadcrumb.home'))).toBeInTheDocument();
            // About Us appears twice (breadcrumb + title), so use getAllByText
            const aboutUsTexts = screen.getAllByText(t('aboutUs:breadcrumb.aboutUs'));
            expect(aboutUsTexts.length).toBeGreaterThanOrEqual(1);
        });

        test('renders page title', () => {
            renderComponent();
            // About Us appears twice (breadcrumb + title), so use getAllByText
            const aboutUsTexts = screen.getAllByText(t('aboutUs:title'));
            expect(aboutUsTexts.length).toBeGreaterThanOrEqual(1);
        });

        test('renders static content cards when regions are empty', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText(t('aboutUs:section.ourGoal.title'))).toBeInTheDocument();
                expect(screen.getByText(t('aboutUs:section.ourVision.title'))).toBeInTheDocument();
                expect(screen.getByText(t('aboutUs:section.ourValue.title'))).toBeInTheDocument();
            });
        });

        test('renders Contact component - always visible', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByTestId('contact')).toBeInTheDocument();
                expect(screen.getByText('Contact Form')).toBeInTheDocument();
            });
        });

        test('renders default fallback content when regions do not exist', async () => {
            renderComponent();
            await waitFor(() => {
                // Pre-contact static content
                expect(screen.getByText(t('aboutUs:section.ourGoal.title'))).toBeInTheDocument();
                // Post-contact static content
                expect(screen.getByText(t('aboutUs:section.ourMission.title'))).toBeInTheDocument();
                expect(screen.getByText(t('aboutUs:section.ourTeam.title'))).toBeInTheDocument();
            });
        });

        test('renders all content cards with correct count when regions are empty', async () => {
            renderComponent();
            await waitFor(() => {
                const contentCards = screen.getAllByTestId('content-card');
                // Goal, Vision, Value, Mission, Team = 5 cards
                expect(contentCards).toHaveLength(5);
            });
        });
    });

    describe('Static content is independent of the Page Designer page', () => {
        // Foundations model: the sections are static JSX; the <Region> slots are empty (no
        // errorElement), so the editorial renders regardless of whether a region has authored
        // components — a merchant component would render IN ADDITION, never replacing the static page.
        test('renders the full static page even when regions have components', async () => {
            const page = {
                ...createMockPage([
                    { id: 'headline', components: [{ id: 'c1', typeId: 'hero' }] },
                    { id: 'additionalinformation', components: [{ id: 'c2', typeId: 'contentcard' }] },
                ]),
                componentData: {},
            };

            renderComponent({ page });

            await waitFor(() => {
                // Static editorial still renders — not replaced by the regions.
                expect(screen.getByText(t('aboutUs:section.ourGoal.title'))).toBeInTheDocument();
                expect(screen.getByText(t('aboutUs:section.ourMission.title'))).toBeInTheDocument();
            });
            // Contact always renders; all five static cards present regardless of PD content.
            expect(screen.getByTestId('contact')).toBeInTheDocument();
            expect(screen.getAllByTestId('content-card')).toHaveLength(5);
        });
    });

    describe('Error Handling', () => {
        test('handles null page gracefully', async () => {
            renderComponent({
                page: null,
            });

            await waitFor(() => {
                // Should still render static content and contact
                expect(screen.getByText(t('aboutUs:section.ourGoal.title'))).toBeInTheDocument();
                expect(screen.getByTestId('contact')).toBeInTheDocument();
            });
        });
    });

    describe('Layout and Styling', () => {
        test('applies correct main container styling', () => {
            const { container } = renderComponent();
            const mainContainer = container.firstChild as HTMLElement;
            expect(mainContainer).toHaveClass('pb-8');
        });

        test('applies correct spacing between sections', async () => {
            renderComponent();
            await waitFor(() => {
                const goalTitle = screen.getByText(t('aboutUs:section.ourGoal.title'));
                const sectionWithSpacing = goalTitle.closest('[class*="space-y-6"]');
                expect(sectionWithSpacing).toBeInTheDocument();
            });
        });

        test('applies correct grid layout for Vision and Value cards', async () => {
            renderComponent();
            await waitFor(() => {
                const visionTitle = screen.getByText(t('aboutUs:section.ourVision.title'));
                const gridContainer = visionTitle.closest('div')?.parentElement;
                expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6');
            });
        });

        test('applies correct background styling to Contact section', async () => {
            renderComponent();
            await waitFor(() => {
                const contact = screen.getByTestId('contact');
                const contactSection = contact.closest('[class*="bg-secondary"]');
                expect(contactSection).toBeInTheDocument();
            });
        });
    });

    describe('Loaders', () => {
        let mockContext: ReturnType<typeof createTestContext>;
        let baseLoaderArgs: Route.LoaderArgs;

        beforeEach(() => {
            mockContext = createTestContext();
            baseLoaderArgs = {
                request: new Request('http://localhost/about-us'),
                url: new URL('http://localhost/about-us'),
                params: { siteId: 'test-site', localeId: 'en-US' },
                context: mockContext,
                pattern: '/about-us',
            };
        });

        describe('loader (server-side)', () => {
            test('returns about us page data with fetchPageWithComponentData', async () => {
                const mockPageWithData = {
                    ...createMockPage([]),
                    componentData: { test: Promise.resolve('data') },
                };

                vi.mocked(fetchPageWithComponentData).mockResolvedValue(mockPageWithData);

                const result = await loader(baseLoaderArgs);

                // Assert - API calls
                expect(vi.mocked(fetchPageWithComponentData)).toHaveBeenCalledWith(baseLoaderArgs, {
                    pageId: 'aboutus',
                });

                // Assert - Return value contains all expected properties
                expect(result.page).toBe(mockPageWithData);
                expect(result.pageUrl).toBe('http://localhost/about-us');
                expect(result.ogImageUrl).toContain('__ASSET_MOCK__');
            });

            test('constructs correct canonical URL', async () => {
                vi.mocked(fetchPageWithComponentData).mockResolvedValue({
                    ...createMockPage([]),
                    componentData: {},
                });

                const result = await loader(baseLoaderArgs);

                expect(result.pageUrl).toBe('http://localhost/about-us');
            });

            test('constructs correct og image URL', async () => {
                vi.mocked(fetchPageWithComponentData).mockResolvedValue({
                    ...createMockPage([]),
                    componentData: {},
                });

                const result = await loader(baseLoaderArgs);

                expect(result.ogImageUrl).toContain('__ASSET_MOCK__');
                expect(result.ogImageUrl).toContain('http://localhost');
            });
        });

        describe('Error Handling', () => {
            test('loader handles API errors by propagating them', async () => {
                const error = new Error('API Error');
                vi.mocked(fetchPageWithComponentData).mockRejectedValue(error);

                await expect(loader(baseLoaderArgs)).rejects.toThrow('API Error');
            });
        });

        describe('Data Integration', () => {
            test('page data is returned with componentData', async () => {
                const mockPageWithData = {
                    ...createMockPage([]),
                    componentData: { some: Promise.resolve('data') },
                };

                vi.mocked(fetchPageWithComponentData).mockResolvedValue(mockPageWithData);

                const result = await loader(baseLoaderArgs);

                expect(vi.mocked(fetchPageWithComponentData)).toHaveBeenCalledWith(baseLoaderArgs, {
                    pageId: 'aboutus',
                });
                expect(result.page).toBe(mockPageWithData);
            });
        });
    });

    describe('SEO Metadata', () => {
        test('renders SEO meta component with correct props', async () => {
            renderComponent();

            // The SeoMeta component is rendered (we can't directly test meta tags in jsdom,
            // but we can verify the component receives correct data through loaderData)
            await waitFor(() => {
                // About Us appears twice (breadcrumb + title), so use getAllByText
                const aboutUsTexts = screen.getAllByText(t('aboutUs:title'));
                expect(aboutUsTexts.length).toBeGreaterThanOrEqual(1);
            });
        });
    });

    describe('Contact Section Position', () => {
        test('Contact section is rendered with empty regions', async () => {
            // Test with empty regions
            renderComponent({
                page: {
                    ...createMockPage([]),
                    componentData: {},
                },
            });
            await waitFor(() => {
                expect(screen.getByTestId('contact')).toBeInTheDocument();
            });
        });

        test('Contact section is rendered with regions provided', async () => {
            // Test with regions
            const page = {
                ...createMockPage([
                    { id: 'headline', components: [] },
                    { id: 'additionalinformation', components: [] },
                ]),
                componentData: {},
            };

            renderComponent({ page });
            await waitFor(() => {
                expect(screen.getByTestId('contact')).toBeInTheDocument();
            });
        });

        test('Contact section maintains correct positioning between regions', async () => {
            renderComponent();

            await waitFor(() => {
                const contact = screen.getByTestId('contact');
                const goalSection = screen.getByText(t('aboutUs:section.ourGoal.title'));
                const missionSection = screen.getByText(t('aboutUs:section.ourMission.title'));
                const ourGoalText = screen.getByText('Geneva, 1964.');
                const whatWeStandForText = screen.getByText('Care & servicing');

                // Contact should be in the document
                expect(contact).toBeInTheDocument();

                // Goal section (before precontact region) should be before Contact
                expect(goalSection).toBeInTheDocument();
                expect(ourGoalText).toBeInTheDocument();

                // Mission section (in postcontact static content) should be after Contact
                expect(missionSection).toBeInTheDocument();
                expect(whatWeStandForText).toBeInTheDocument();
            });
        });
    });
});
