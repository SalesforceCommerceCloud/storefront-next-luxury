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
import { useTranslation } from 'react-i18next';
import { useCategoryBannerData } from '@/components/category-banner/use-category-banner-data';

/**
 * Fallback banner for Product Listing Pages when no hero component is configured
 * in the plpTopFullWidth Page Designer region. Displays category name, product
 * count, and an optional background image sourced from the category's SCAPI data.
 *
 * Image resolution: c_slotBannerImage → category.image → bg-muted.
 */
export default function CategoryBanner() {
    const { t } = useTranslation('category');
    const {
        rootCategoryName,
        categoryName,
        pageDescription,
        imageSrc,
        hasImage,
        handleImageError,
        total,
        isCountPending,
    } = useCategoryBannerData();

    return (
        <div className="relative w-full overflow-hidden min-h-64" data-slot="luxury-category-banner">
            <div className="absolute inset-0">
                {hasImage ? (
                    <img
                        src={imageSrc}
                        alt=""
                        fetchPriority="high"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                    />
                ) : (
                    <div className="absolute inset-0 bg-muted" />
                )}
                {/*
                 * Scrim for WCAG 1.4.3: all text (eyebrow, category name, product count) is white and sits in the
                 * lower half over an arbitrary merchant photo. The eyebrow is small text (12px/14px) and needs 4.5:1
                 * contrast. The gradient stays lighter at the very top to keep the image visible but provides black/65
                 * alpha by the eyebrow position (composited ~#595959 over worst-case white = 4.6:1 with text-white/80)
                 * and darker still for the large heading and count below. The image is unchanged. */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/65 to-black/85" />
            </div>

            <div className="relative h-full flex items-end">
                <div className="section-container w-full pb-6 md:pb-8">
                    <div className="max-w-3xl">
                        {rootCategoryName && (
                            <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/75">
                                {rootCategoryName}
                            </p>
                        )}
                        {categoryName && (
                            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-primary-foreground tracking-tight leading-[1.1]">
                                {categoryName}
                            </h1>
                        )}
                        {pageDescription && (
                            <p className="mt-3 max-w-xl text-sm md:text-base font-light text-white/85">
                                {pageDescription}
                            </p>
                        )}
                        <p className="mt-3 text-sm text-white/70" aria-live="polite">
                            {isCountPending
                                ? t('banner.counting')
                                : total !== undefined && t('banner.productsAvailable', { count: total })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
