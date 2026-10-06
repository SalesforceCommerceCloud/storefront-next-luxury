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
import type { ShopperProducts } from '@/scapi';
import { collectionDisplayName, getCollection, getReferenceNumber } from './luxury-product';

/** Watch identity carried from the PDP into a boutique appointment. */
export type AppointmentPiece = {
    id: string;
    name: string;
    reference?: string;
    image?: string;
    collection?: string;
};

function firstImage(product: ShopperProducts.schemas['Product']): string | undefined {
    return (
        product.imageGroups?.find((group) => group.viewType === 'large')?.images?.[0]?.link ??
        product.imageGroups?.[0]?.images?.[0]?.link
    );
}

export function toAppointmentPiece(product: ShopperProducts.schemas['Product']): AppointmentPiece {
    const collection = collectionDisplayName(getCollection(product));
    return {
        id: product.master?.masterId ?? product.id ?? '',
        name: product.name ?? '',
        reference: getReferenceNumber(product),
        image: firstImage(product),
        collection: collection || undefined,
    };
}
