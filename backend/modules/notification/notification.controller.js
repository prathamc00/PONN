const { Notification } = require('../../models');
const { sendNotificationToUser } = require('../../socketManager');

// Helper to create & send a real-time notification
exports.createNotification = async (userId, title, message, type = 'info', link = null) => {
  try {
    const notification = await Notification.create({
      user: userId, // Match association alias 'user' in index.js, wait it's foreignKey userId, but let's see. In index.js Notification.belongsTo(User, { foreignKey: 'user' }); so the field is 'user'
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
    const notifications = await Notification.findAll({
      where: { user: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    const unreadCount = await Notification.count({
      where: { user: req.user.id, isRead: false }
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user: req.user.id }
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { user: req.user.id, isRead: false } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
