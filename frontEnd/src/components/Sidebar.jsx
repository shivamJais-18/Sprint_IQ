import { NavLink } from 'react-router-dom';
import {
  FiBell,
  FiBug,
  FiCalendar,
  FiCheckSquare,
  FiFolder,
  FiGrid,
  FiLogOut,
  FiUsers
} from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';

const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: FiGrid
  },
  {
    label: 'Projects',
    path: '/projects',
    icon: FiFolder
  },
  {
    label: 'Sprints',
    path: '/sprints',
    icon: FiCalendar
  },
  {
    label: 'Tasks',
    path: '/tasks',
    icon: FiCheckSquare
  },
  {
    label: 'Bugs',
    path: '/bugs',
    icon: FiBug
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: FiBell
  }
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">S</div>

        <div>
          <div className="sidebar-brand-name">SprintIQ</div>
          <div className="sidebar-brand-subtitle">
            Software Management
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems?.map((item) => {
          console.log('item', item);
          const Icon = item?.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              {Icon && <Icon size={18} />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {user?.role === 'Admin' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <FiUsers size={18} />
            <span>User Management</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div className="sidebar-user-info">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          <FiLogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;