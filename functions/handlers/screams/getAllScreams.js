const { db } = require('../../util/admin');

const getAllScreams = async (request, response) => {
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

module.exports = getAllScreams;
