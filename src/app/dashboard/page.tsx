import { getUserProfile } from '@/utils/getUser';
import AdminView from '@/components/dashboard/AdminView';
import AnalystView from '@/components/dashboard/AnalystView';
import EmployeeView from '@/components/dashboard/EmployeeView';

const DashboardPage = async () => {
  const { profile } = await getUserProfile();

  if (profile.role === 'ADMIN') {
    return <AdminView profile={profile} />;
  }

  if (profile.role === 'ANALYST') {
    return <AnalystView profile={profile} />;
  }

  return <EmployeeView profile={profile} />;
};

export default DashboardPage;