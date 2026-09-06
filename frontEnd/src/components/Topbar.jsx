import { FiBell, FiSearch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-search">
        <FiSearch size={18} />
        <input
          placeholder="Search projects, tasks, bugs..."
          onKeyDown={(event) => {
            if (event.key === 'Enter') navigate('/tasks');
          }}
        />
      </div>

      <div className="topbar-right">
        <button className="icon-button" onClick={() => navigate('/notifications')} title="Notifications">
          <FiBell size={19} />
        </button>

        <div className="topbar-user">
          <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
