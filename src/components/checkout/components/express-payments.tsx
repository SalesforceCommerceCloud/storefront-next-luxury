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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import StaticPayPalButton from '@/components/checkout/components/static-paypal-button';
import StaticVenmoButton from '@/components/checkout/components/static-venmo-button';
import ApplePayLogo from '@/components/checkout/components/apple-pay-logo';
import GooglePayLogo from '@/components/checkout/components/google-pay-logo';
import AmazonPayLogo from '@/components/checkout/components/amazon-pay-logo';
import { useTranslation } from 'react-i18next';

interface ExpressPaymentsProps {
    disabled?: boolean;
    /**
     * Layout orientation for the payment buttons
     * - 'horizontal': Responsive grid (2 cols mobile/tablet, 5 cols desktop)
     * - 'vertical': Compact 3-column grid — five buttons across two rows (3 + 2)
     * @default 'horizontal'
     */
    layout?: 'horizontal' | 'vertical';
    /**
     * Position of the separator divider
     * - 'top': Displays separator above the payment buttons
     * - 'bottom': Displays separator below the payment buttons
     * @default 'bottom'
     */
    separatorPosition?: 'top' | 'bottom';
    /**
     * Custom text for the separator divider
     * @default 'Or'
     */
    separatorText?: string;
    /**
     * When false, render the button grid without the bordered Card shell
     * (PDP — buttons sit flush on the page background).
     * Defaults to false for `vertical` (PDP) and true for `horizontal` (checkout).
     */
    framed?: boolean;
}

/**
 * @feature-stub Express checkout buttons
 * @status stub — no backend integration
 *
 * Luxury overlay of the shared stub: PDP (`layout="vertical"`) uses a compact
 * 3-column / 2-row grid without the Card shell, matching furniture.
 */
export default function ExpressPayments({
    disabled = false,
    layout = 'horizontal',
    separatorPosition = 'bottom',
    separatorText = 'or continue below',
    framed: framedProp,
}: ExpressPaymentsProps) {
    const framed = framedProp ?? layout !== 'vertical';
    const { t } = useTranslation('checkout');
    const applePayLabel = t('expressPayments.applePayLabel');
    const googlePayLabel = t('expressPayments.googlePayLabel');
    const amazonPayLabel = t('expressPayments.amazonPayLabel');
    const handleApplePayClick = () => {
        if (!disabled) {
            // oxlint-disable-next-line no-alert
            alert(
                'Apple Pay express checkout would be processed here. This would skip all form steps and go directly to payment confirmation.'
            );
        }
    };

    const handleGooglePayClick = () => {
        if (!disabled) {
            // oxlint-disable-next-line no-alert
            alert(
                'Google Pay express checkout would be processed here. This would skip all form steps and go directly to payment confirmation.'
            );
        }
    };

    const handleAmazonPayClick = () => {
        if (!disabled) {
            // oxlint-disable-next-line no-alert
            alert(
                'Amazon Pay express checkout would be processed here. This would skip all form steps and go directly to payment confirmation.'
            );
        }
    };

    const handleVenmoClick = () => {
        if (!disabled) {
            // oxlint-disable-next-line no-alert
            alert(
                'Venmo express checkout would be processed here. This would skip all form steps and go directly to payment confirmation.'
            );
        }
    };

    const handlePayPalClick = () => {
        if (!disabled) {
            // oxlint-disable-next-line no-alert
            alert(
                'PayPal express checkout would be processed here. This would skip all form steps and go directly to payment confirmation.'
            );
        }
    };

    // vertical = compact 2-row grid for narrow surfaces (PDP): 3 buttons + 2 buttons
    const gridClasses = layout === 'vertical' ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 lg:grid-cols-5 gap-2';

    const buttons = (
        <>
            <p className="text-sm font-normal text-card-foreground">{t('expressPayments.title')}</p>
            <div className={`${gridClasses} w-full`}>
                <Button
                    onClick={handleGooglePayClick}
                    disabled={disabled}
                    className="w-full h-9 bg-foreground hover:bg-foreground/90 text-background border-0 flex items-center justify-center transition-colors"
                    aria-label={googlePayLabel}>
                    <GooglePayLogo className="flex-shrink-0" decorative />
                </Button>

                <Button
                    onClick={handleApplePayClick}
                    disabled={disabled}
                    className="w-full h-9 bg-foreground hover:bg-foreground/90 text-background border-0 flex items-center justify-center transition-colors"
                    aria-label={applePayLabel}>
                    <ApplePayLogo className="flex-shrink-0" decorative />
                </Button>

                <StaticPayPalButton onClick={handlePayPalClick} disabled={disabled} />
                <StaticVenmoButton onClick={handleVenmoClick} disabled={disabled} />

                <Button
                    onClick={handleAmazonPayClick}
                    disabled={disabled}
                    className={cn(
                        'w-full h-9 bg-muted hover:bg-muted-hover border-0 flex items-center justify-center transition-colors',
                        layout === 'horizontal' && 'max-lg:col-span-2'
                    )}
                    aria-label={amazonPayLabel}>
                    <AmazonPayLogo className="flex-shrink-0" decorative />
                </Button>
            </div>
        </>
    );

    const separator = (
        <div className="relative flex items-center gap-[15px]">
            <div className="flex-1 h-px bg-separator" />
            <span
                className="text-sm font-normal leading-5 text-muted-foreground whitespace-nowrap"
                data-express-payments-separator-label="">
                {separatorText}
            </span>
            <div className="flex-1 h-px bg-separator" />
        </div>
    );

    return (
        <div className="space-y-6" data-testid="express-payments" data-framed={framed || undefined}>
            {separatorPosition === 'top' && separator}

            {framed ? (
                <Card className="flex flex-col items-center gap-3 p-6">{buttons}</Card>
            ) : (
                <div className="flex flex-col items-center gap-3">{buttons}</div>
            )}

            {separatorPosition === 'bottom' && separator}
        </div>
    );
}
