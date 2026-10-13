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
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/link';
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import { isCimulateEnabled, openAgentWidgetAndSendMessage, validateCimulateConfig } from '@/components/cimulate';

type WatchFinderCtaProps = {
    children: ReactNode;
    className?: string;
    variant?: ComponentProps<typeof Button>['variant'];
};

export default function WatchFinderCta({ children, className, variant }: WatchFinderCtaProps): ReactElement {
    const config = useConfig();
    const { t } = useTranslation('watch');
    const agentEnabled =
        isCimulateEnabled(config.cimulateAgent?.enabled) && validateCimulateConfig(config.cimulateAgent);

    if (agentEnabled) {
        return (
            <Button
                type="button"
                variant={variant}
                className={className}
                onClick={() => openAgentWidgetAndSendMessage(t('finder.agentSeed'))}>
                {children}
            </Button>
        );
    }

    return (
        <Button asChild variant={variant} className={className}>
            <Link to={'/find-your-watch' as '/'}>{children}</Link>
        </Button>
    );
}
