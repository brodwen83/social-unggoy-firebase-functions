const { db } = require('../../util/admin');

const markNotificationsRead = async (req, res) => {
  // Batch write
  let batch = db.batch();

  try {
    req.body.forEach(notificationId => {
      const notificationRef = db.doc(`/notifications/${notificationId}`);

      batch.update(notificationRef, { read: true });
    });

    await batch.commit();

    return res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.code });
  }
};

module.exports = markNotificationsRead;
