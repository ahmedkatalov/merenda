import { PageHeader } from '@/components/ui';
import { ProfileCard } from '../components/ProfileCard';
import { PasswordCard } from '../components/PasswordCard';
import { SessionsCard } from '../components/SessionsCard';

export default function SecurityPage() {
  return (
    <>
      <PageHeader title="Безопасность" description="Профиль администратора, пароль и активные сессии." />
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <ProfileCard />
        <PasswordCard />
        <SessionsCard className="lg:col-span-2" />
      </div>
    </>
  );
}
