const { db } = require('../../util/admin');

// getAuthenticatedUser
const getAuthenticatedUser = async (req, res) => {
  let userData = {};

  try {
    const doc = await db.doc(`users/${req.user.handle}`).get();

    if (doc.exists) userData.credentials = doc.data();

    const likesData = await db
      .collection('likes')
      .where('userHandle', '==', req.user.handle)
      .get();

    userData.likes = [];
    likesData.forEach(like => {
      userData.likes.push(like.data());
    });

    const notificationData = await db
      .collection('notifications')
      .where('recipient', '==', req.user.handle)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    userData.notifications = [];

    notificationData.forEach(notification => {
      userData.notifications.push({
        ...notification.data(),
        notificationId: notification.id,
        createdAt: notification.data().createdAt.toDate(),
      });
    });

    return res.status(200).json(userData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.code });
  }
};

module.exports = getAuthenticatedUser;
