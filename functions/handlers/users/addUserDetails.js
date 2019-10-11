const { db } = require('../../util/admin');
const { reduceUserDetails } = require('../../util/helpers');

// Add User Details
const addUserDetails = async (request, response) => {
  let userDetails = reduceUserDetails({ ...request.body });

  try {
    await db.doc(`/users/${request.user.handle}`).update(userDetails);

    return response.status(201).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.code });
  }
};

module.exports = addUserDetails;
