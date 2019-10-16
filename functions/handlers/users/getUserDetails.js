const { db } = require('../../util/admin');

const getUserDetails = async (req, res) => {
  const { userHandle } = req.params;
  const userData = {};

  try {
    const userDoc = await db.doc(`/users/${userHandle}`).get();

    if (!userDoc.exists)
      return res.status(404).json({ error: 'User not found' });

    userData.user = { ...userDoc.data() };
    const userScreams = await db
      .collection('screams')
      .where('userHandle', '==', userHandle)
      .orderBy('createdAt', 'desc')
      .get();

    userData.screams = [];
    userScreams.forEach(scream => {
      userData.screams.push({ ...scream.data(), screamId: scream.id });
    });

    return res.status(200).json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.code });
  }
};

module.exports = getUserDetails;
