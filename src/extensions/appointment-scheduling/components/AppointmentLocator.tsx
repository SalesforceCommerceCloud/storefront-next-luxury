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
import BoutiqueLocator from '@/components/boutique-locator';

/**
 * Luxury overlay — renders BoutiqueLocator (map + facade images) using territory data
 * from AppointmentProvider context set by the appointments page loader.
 * Switching from BFF to CAP (provider=scapi) requires no change here.
 */
export default function AppointmentLocator(): ReactElement | null {
    const appointment = useAppointment();
    if (!appointment) return null;

    const { territories, advanceNoticeMinutes, onBook, bookingSubmitting, bookingResult } = appointment;

    return (
        <BoutiqueLocator
            stores={territories}
            advanceNoticeMinutes={advanceNoticeMinutes}
            onBook={onBook}
            bookingSubmitting={bookingSubmitting}
            bookingResult={bookingResult}
        />
    );
}
