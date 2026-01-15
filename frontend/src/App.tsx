import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './providers/UserProvider';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SelectUser } from './pages/SelectUser';
import { Foods } from './pages/Foods';
import { Recipes } from './pages/Recipes';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useUser();

  if (isLoading) {
    return <LoadingSpinner message="Loading user..." />;
  }

  if (!currentUser) {
    return <Navigate to="/select-user" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/select-user" element={<SelectUser />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="foods" element={<Foods />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="trends" element={<div>Trends page coming soon...</div>} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
