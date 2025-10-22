import { Link, useLocation } from 'react-router-dom';
import '../styles/components/Header.css';

const Header: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header" role="banner">
      <div className="header-container">
        {/* Logo */}
        <div className="logo-section">
          <Link to="/" className="logo-link" aria-label="TriVium Home">
            <img src="/src/assets/logo.png" alt="TriVium Logo" className="logo" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="navigation" role="navigation" aria-label="Main navigation">
          <ul className="nav-list">
            <li>
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                aria-current={isActive('/') ? 'page' : undefined}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/test" 
                className={`nav-link ${isActive('/test') ? 'active' : ''}`}
                aria-current={isActive('/test') ? 'page' : undefined}
              >
                Test
              </Link>
            </li>
            <li>
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                aria-current={isActive('/dashboard') ? 'page' : undefined}
              >
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
