import { useEffect, useState } from 'react';
import { FiBell, FiCheck } from 'react-icons/fi';
import API from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const response = await API.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { loadNotifications(); }, []);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (error) { console.error(error); }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      await loadNotifications();
    } catch (error) { console.error(error); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Notifications</h1><p>Stay updated with your project activity.</p></div>
        {notifications.some((notification) => !notification.isRead) && <button className="secondary-button" onClick={markAllAsRead}><FiCheck size={16} />Mark all as read</button>}
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state panel"><FiBell size={34} /><h2>No notifications</h2><p>You're all caught up.</p></div>
        ) : (
          notifications.map((notification) => (
            <article className={`notification-card ${notification.isRead ? '' : 'unread'}`} key={notification._id}>
              <div className="notification-icon"><FiBell size={18} /></div>
              <div className="notification-main">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <span>{new Date(notification.createdAt).toLocaleString()}</span>
              </div>
              {!notification.isRead && <button className="secondary-button small" onClick={() => markAsRead(notification._id)}>Mark read</button>}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
