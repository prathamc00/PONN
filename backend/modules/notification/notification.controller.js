const Notification = require('./notification.model');
const { sendNotificationToUser } = require('../../socketManager');

// Helper to create & send a real-time notification
exports.createNotification = async (userId, title, message, type = 'info', link = null) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link
    });

    // Fire the websocket event if the user is currently online
    sendNotificationToUser(userId, notification);

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

exports.getMyNotifications = async (req, res, next) => {
  try {
    // Fetch last 50 notifications, latest first
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (err) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(error);
  }
};
