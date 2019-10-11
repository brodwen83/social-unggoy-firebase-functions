const { db } = require('../../util/admin');

// getAuthenticatedUser
const getAuthenticatedUser = async (request, response) => {
  let userData = {};

  try {
    const doc = await db.doc(`users/${request.user.handle}`).get();

    if (doc.exists) userData.credentials = doc.data();

    const likesData = await db
      .collection('likes')
      .where('userHandle', '==', request.user.handle)
      .get();

    userData.likes = [];
    likesData.forEach(like => {
      userData.likes.push(like.data());
    });

    return response.status(200).json(userData);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.code });
  }
};

module.exports = getAuthenticatedUser;
