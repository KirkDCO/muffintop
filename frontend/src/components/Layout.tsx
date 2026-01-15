import { Outlet, NavLink } from 'react-router-dom';
import { useUser } from '../providers/UserProvider';

export function Layout() {
  const { currentUser, setCurrentUser } = useUser();

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="header" role="banner">
        <h1>MuffinTop</h1>
        <nav className="nav" role="navigation" aria-label="Main navigation">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/foods">Foods</NavLink>
          <NavLink to="/recipes">Recipes</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="user-info">
          <span aria-label={`Logged in as ${currentUser?.name}`}>{currentUser?.name}</span>
          <button onClick={handleLogout} aria-label="Switch to different user">
            Switch User
          </button>
        </div>
      </header>
      <main id="main-content" className="main" role="main">
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
          flex-wrap: wrap;
        }
        .header h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        .nav {
          display: flex;
          gap: 0.5rem;
          flex: 1;
          flex-wrap: wrap;
        }
        .nav a {
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          text-decoration: none;
          white-space: nowrap;
        }
        .nav a:hover {
          background-color: #333;
        }
        .nav a.active {
          background-color: #646cff;
          color: white;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .main {
          flex: 1;
          padding: 1rem;
        }
        @media (max-width: 768px) {
          .header {
            gap: 1rem;
            padding: 0.75rem;
          }
          .header h1 {
            font-size: 1.25rem;
            width: 100%;
          }
          .nav {
            order: 3;
            width: 100%;
            justify-content: center;
          }
          .nav a {
            padding: 0.5rem;
            font-size: 0.9rem;
          }
          .user-info {
            margin-left: auto;
          }
          .user-info span {
            display: none;
          }
          .main {
            padding: 0.5rem;
          }
        }
        @media (max-width: 480px) {
          .nav a {
            padding: 0.4rem 0.5rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}
