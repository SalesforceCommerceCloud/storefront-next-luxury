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
import { redirect, type LoaderFunctionArgs } from 'react-router';
import { createCategoryUrlFromLegacyPath } from '@/route-paths';
import { buildUrlFromContext } from '@/lib/url.server';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import { siteContext } from '@salesforce/storefront-next-runtime/site-context';

export function loader(args: LoaderFunctionArgs): Response {
    const collection = args.params.collection;
    if (!collection) {
        return redirect(buildUrlFromContext('/collections', args.context));
    }
    const config = getConfig(args.context);
    const site = args.context.get(siteContext);
    const destination = createCategoryUrlFromLegacyPath(`/category/${encodeURIComponent(collection)}`, {
        siteId: site?.site.id ?? '',
        seoRoutes: config.url?.seoRoutes,
    });
    return redirect(buildUrlFromContext(destination, args.context));
}

export default function CollectionRedirect(): null {
    return null;
}
