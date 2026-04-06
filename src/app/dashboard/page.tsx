import { getUserProfile } from '@/utils/getUser';
import AdminView from '@/components/dashboard/AdminView';
import AnalystView from '@/components/dashboard/AnalystView';
import EmployeeView from '@/components/dashboard/EmployeeView';

const DashboardPage = async () => {
  // Securely fetch the user's role from the database
  const { profile } = await getUserProfile();

  // Render a completely different UI depending on their role
  if (profile.role === 'ADMIN') {
    return <AdminView profile={profile} />;
  }

  if (profile.role === 'ANALYST') {
    return <AnalystView profile={profile} />;
  }

  // Default to the Employee view
  return <EmployeeView profile={profile} />;
};

export default DashboardPage;