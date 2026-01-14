import { Outlet, NavLink } from 'react-router-dom';
import { useUser } from '../providers/UserProvider';

export function Layout() {
  const { currentUser, setCurrentUser } = useUser();

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="layout">
      <header className="header">
        <h1>MuffinTop</h1>
        <nav className="nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/foods">Foods</NavLink>
          <NavLink to="/recipes">Recipes</NavLink>
          <NavLink to="/trends">Trends</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="user-info">
          <span>{currentUser?.name}</span>
          <button onClick={handleLogout}>Switch User</button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <style>{`
        .layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .header {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding: 1rem;
          border-bottom: 1px solid #444;
          margin-bottom: 1rem;
        }
        .header h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        .nav {
          display: flex;
          gap: 1rem;
          flex: 1;
        }
        .nav a {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          text-decoration: none;
        }
        .nav a.active {
          background-color: #646cff;
          color: white;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .main {
          flex: 1;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
