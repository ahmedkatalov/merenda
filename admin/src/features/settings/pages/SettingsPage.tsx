import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { useBlocker, useSearchParams } from 'react-router-dom';
import { Phone, Search, Store } from 'lucide-react';
import { ConfirmDialog, PageHeader, Tabs, type TabItem } from '@/components/ui';
import { BusinessForm } from '../components/BusinessForm';
import { ContactsForm } from '../components/ContactsForm';
import { SeoForm } from '../components/SeoForm';
import type { SettingsFormProps } from '../components/useSettingsForm';

const TAB_VALUES = ['business', 'contacts', 'seo'] as const;
type SettingsTab = (typeof TAB_VALUES)[number];
const isTab = (v: string | null): v is SettingsTab => TAB_VALUES.includes(v as SettingsTab);

const TABS: TabItem<SettingsTab>[] = [
  { value: 'business', label: 'Заведение', icon: <Store /> },
  { value: 'contacts', label: 'Контакты', icon: <Phone /> },
  { value: 'seo', label: 'SEO', icon: <Search /> },
];

const FORMS: Record<SettingsTab, ComponentType<SettingsFormProps>> = { business: BusinessForm, contacts: ContactsForm, seo: SeoForm };

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: SettingsTab = isTab(raw) ? raw : 'business';
  const [dirty, setDirty] = useState(false);

  const selectTab = (v: SettingsTab) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', v);
      return next;
    });

  // Any in-app navigation (sidebar link or tab switch) while the form is dirty asks first.
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: { pathname: string; search: string }; nextLocation: { pathname: string; search: string } }) =>
        dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
      [dirty],
    ),
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const Form = FORMS[tab];

  return (
    <>
      <PageHeader title="Настройки" description="Данные заведения, контакты и SEO.">
        <Tabs items={TABS} value={tab} onChange={selectTab} />
      </PageHeader>

      <Form key={tab} onDirtyChange={setDirty} />

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => {
          if (blocker.state === 'blocked') blocker.reset();
        }}
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed();
        }}
        tone="danger"
        title="Есть несохранённые изменения"
        description="Если уйти сейчас, изменения на этой вкладке будут потеряны."
        confirmLabel="Уйти без сохранения"
        cancelLabel="Остаться"
      />
    </>
  );
}
