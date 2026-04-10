const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require('./notification.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', getMyNotifications);
router.put('/read/:id', markAsRead);
router.put('/read-all', markAllAsRead);

module.exports = router;
