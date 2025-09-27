
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';
import MobileDebugger from './MobileDebugger';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import EmailVerificationRequired from './EmailVerificationRequired';

const Layout = () => {
  const { user, loading, isEmailVerified } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If user is logged in but email is not verified, show verification required
  if (user && !isEmailVerified && window.location.pathname !== '/verify') {
    return <EmailVerificationRequired />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Outlet />
      </main>
      <Footer />
      <MobileDebugger />
    </div>
  );
};

export default Layout;
