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
import type { ShopperStores } from '@/scapi';
import type { AppointmentPiece } from '@/lib/appointment';
import BoutiqueAppointment from '../boutique-appointment';

type BoutiqueLocatorProps = {
    stores: ShopperStores.schemas['Store'][];
    productId?: string;
    productName?: string;
    piece?: AppointmentPiece | null;
    catalog?: AppointmentPiece[];
};

export default function BoutiqueLocator({
    stores,
    productId,
    productName,
    piece,
    catalog,
}: BoutiqueLocatorProps): ReactElement {
    return (
        <div
            className="flex h-full min-h-0 flex-1 flex-col"
            data-testid="boutique-locator"
            data-slot="luxury-boutique-locator">
            <BoutiqueAppointment
                stores={stores}
                productId={productId}
                productName={productName}
                piece={piece}
                catalog={catalog}
            />
        </div>
    );
}
