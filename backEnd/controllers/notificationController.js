import Notification from '../models/Notification.js';

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);

    return res.status(500).json({
      message: 'Server error while fetching notifications'
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification error:', error);

    return res.status(500).json({
      message: 'Server error while updating notification'
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      {
        $set: {
          isRead: true
        }
      }
    );

    return res.status(200).json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications error:', error);

    return res.status(500).json({
      message: 'Server error while updating notifications'
    });
  }
};