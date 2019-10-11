const { db } = require('../../util/admin');

const createScream = async (request, response) => {
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

module.exports = createScream;
