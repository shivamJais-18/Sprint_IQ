import { Outlet } from 'react-router-dom';

import Sidebar from '../components/Sidebar.jsx';
// import Topbar from '../components/Topbar.jsx';

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
 
      <div className="app-main">

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}