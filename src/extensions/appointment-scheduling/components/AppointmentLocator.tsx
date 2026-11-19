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
import { useAppointment } from '@/extensions/appointment-scheduling/context/appointment-context';
import LuxuryAppointmentWizard from './LuxuryAppointmentWizard';

/**
 * Luxury overlay — renders AppointmentWizard with territory data and loader-enriched
 * work types / slots from AppointmentProvider context set by the appointments page loader.
 *
 * Work types are always dataset-provisioned (via enrichFromCatalog in the loader) so they
 * serve as the fallback even when schedulerEnabled=false.
 */
export default function AppointmentLocator(): ReactElement | null {
    const appointment = useAppointment();
    if (!appointment) return null;

    return (
        <LuxuryAppointmentWizard
            stores={appointment.territories}
            workTypes={appointment.workTypes}
            slots={appointment.slots}
            isNavigating={appointment.isNavigating}
            advanceNoticeMinutes={appointment.advanceNoticeMinutes}
            onBook={appointment.onBook}
            bookingSubmitting={appointment.bookingSubmitting}
            bookingResult={appointment.bookingResult}
            schedulerEnabled={appointment.schedulerEnabled}
            fallbackServices={appointment.workTypes}
            shopperName={appointment.shopperName}
            shopperEmail={appointment.shopperEmail}
        />
    );
}
