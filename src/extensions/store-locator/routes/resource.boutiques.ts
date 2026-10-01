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
/** @sfdc-extension-file SFDC_EXT_STORE_LOCATOR */
import { data, type LoaderFunctionArgs } from 'react-router';
import type { ShopperStores } from '@/scapi';
import { fetchBoutiques } from '../../../lib/stores.server';
import { getLogger } from '@/lib/logger.server';
import { extractResponseError } from '@/lib/utils';

/**
 * Result of fetchBoutiques API
 */
export interface FetchBoutiquesResult {
    success: boolean;
    stores?: ShopperStores.schemas['Store'][];
    error?: string;
}

/**
 * Server-side loader to fetch luxury boutiques.
 *
 * Returns all 5 luxury boutique stores from SCAPI for the store locator.
 * Client-side filtering by country/postal is handled in the UI layer.
 *
 * @param args - Loader function arguments containing request and context
 * @returns JSON response with boutique data or error
 */
export async function loader({ context }: LoaderFunctionArgs): Promise<ReturnType<typeof data<FetchBoutiquesResult>>> {
    const logger = getLogger(context);
    logger.debug('Boutiques: loader starting');
    try {
        const stores = await fetchBoutiques(context);

        return data({
            success: true,
            stores,
        });
    } catch (error) {
        logger.error('Boutiques: fetch failed', { error });
        const { responseMessage, status_code } = await extractResponseError(error as Error);
        return data(
            {
                success: false,
                error: responseMessage,
            },
            { status: Number(status_code) }
        );
    }
}
