const { db } = require('../util/admin');

exports.getAllScreams = async (request, response) => {
  try {
    const data = await db
      .collection('screams')
      .orderBy('createdAt', 'desc')
      .get();

    if (data) {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          ...doc.data(),
        });
      });

      return response.json(screams);
    }
    return response.status(404).json({ data: [] });
  } catch (error) {
    console.error(error);
    return response.status(500).json(error);
  }
};

exports.postOneScream = async (request, response) => {
  const { body } = request.body;
  const newScream = {
    body,
    userHandle: request.user.handle,
    createdAt: new Date().toISOString(),
  };

  try {
    const document = await db.collection('screams').add(newScream);

    return response
      .status(200)
      .json({ message: `document ${document.id} created successfully` });
  } catch (error) {
    console.error(err);
    return response.status(500).json({ error: 'something went wrong' });
  }
};
