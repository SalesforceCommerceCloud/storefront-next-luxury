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
import { type FormEvent, type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type WaitlistSignupProps = {
    productId?: string;
    onSubmit?: (email: string) => void;
};

export default function WaitlistSignup({ productId, onSubmit }: WaitlistSignupProps): ReactElement {
    const { t } = useTranslation('watch');
    const [email, setEmail] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!email.trim()) return;
        const key = `luxury-waitlist:${productId ?? 'unknown'}`;
        const existing = sessionStorage.getItem(key);
        const list = existing ? (JSON.parse(existing) as string[]) : [];
        sessionStorage.setItem(key, JSON.stringify([...list, email.trim()]));
        onSubmit?.(email.trim());
        setDone(true);
    };

    if (done) {
        return (
            <p role="status" data-testid="waitlist-success">
                {t('waitlist.success')}
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" data-testid="waitlist-signup">
            <h3 className="font-serif text-xl">{t('waitlist.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('waitlist.body')}</p>
            <label className="text-sm" htmlFor="waitlist-email">
                {t('waitlist.email')}
            </label>
            <Input
                id="waitlist-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit">{t('waitlist.submit')}</Button>
        </form>
    );
}
