import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
        <div className="modal-spinner w-8 h-8 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
