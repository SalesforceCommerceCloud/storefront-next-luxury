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
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/link';
import { boutiqueAppointmentHref } from '../../lib/boutique-href';

type BoutiqueBookingProps = {
    productId?: string;
    intent?: 'browse' | 'appointment';
};

export default function BoutiqueBooking({ productId, intent = 'browse' }: BoutiqueBookingProps): ReactElement {
    const { t } = useTranslation('watch');
    const appointment = intent === 'appointment';
    const boutiquesTo = boutiqueAppointmentHref(productId);

    return (
        <div className="flex flex-col gap-3" data-testid="boutique-booking">
            <p className="text-sm text-muted-foreground">
                {appointment ? t('boutique.appointmentBody') : t('boutique.body')}
            </p>
            <Button variant={appointment ? 'default' : 'outline'} className="w-full" asChild>
                <Link to={boutiquesTo}>{t('bookAppointment')}</Link>
            </Button>
            <Link to={boutiquesTo} className="text-center text-sm text-foreground underline underline-offset-4">
                {t('boutique.findSalon')}
            </Link>
        </div>
    );
}
