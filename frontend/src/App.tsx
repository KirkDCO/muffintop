import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './providers/UserProvider';
import { Layout } from './components/Layout';
import { SelectUser } from './pages/SelectUser';
import { Foods } from './pages/Foods';
import { Dashboard } from './pages/Dashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/select-user" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
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
        <Route path="recipes" element={<div>Recipes page coming soon...</div>} />
        <Route path="trends" element={<div>Trends page coming soon...</div>} />
        <Route path="settings" element={<div>Settings page coming soon...</div>} />
      </Route>
    </Routes>
  );
}

export default App;
