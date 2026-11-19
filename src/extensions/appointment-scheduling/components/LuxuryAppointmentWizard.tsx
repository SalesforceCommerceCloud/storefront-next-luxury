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
/** @sfdc-extension-file SFDC_EXT_APPOINTMENT_SCHEDULING */
import type { ReactElement } from 'react';
import CanonicalAppointmentWizard, {
    type AppointmentWizardProps,
} from '@/extensions/appointment-scheduling/components/AppointmentWizard';
import BoutiqueDirectory from '../../../components/boutique-directory';
import StoreStill from '../../../components/store-still';

/**
 * Luxury shadow of AppointmentWizard — adds the two-column split layout
 * (geo map left panel, step content right) across all non-location steps,
 * and replaces the plain store list with BoutiqueDirectory (image cards + map).
 */
export default function LuxuryAppointmentWizard(props: AppointmentWizardProps): ReactElement {
    return (
        // data-slot persists across all wizard steps — drives the CSS viewport-lock rules
        // in theme/base.css that lock html/body to 100dvh and hide the footer.
        <div data-slot="luxury-boutique-locator" className="flex h-full min-h-0 flex-1 flex-col">
            <CanonicalAppointmentWizard
                {...props}
                noPadding
                renderLocationStep={({ stores, selectedId, onSelect, chrome }) => (
                    <BoutiqueDirectory
                        stores={stores}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        chrome={chrome as ReactElement | null}
                    />
                )}
                renderStepSidebar={({ store }) => (store ? <StoreStill store={store} /> : null)}
            />
        </div>
    );
}

export type { AppointmentWizardProps };
