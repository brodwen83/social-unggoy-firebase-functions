const { firebase } = require('../../util/admin');
const { validateLoginCredentials } = require('../../util/validators');

const login = async (request, response) => {
  const { email, password } = request.body;
  const { errors, isInvalid } = validateLoginCredentials({ ...request.body });

  if (isInvalid) return response.status(400).json(errors);

  try {
    const data = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const idToken = await data.user.getIdToken();

    return response.json({ token: `Bearer ${idToken}` });
  } catch (error) {
    console.error(error);
    if (error.code === 'auth/wrong-password') {
      return response
        .status(403)
        .json({ general: 'Wrong credentials, please try again' });
    } else return response.status(500).json({ error: error.code });
  }
};

module.exports = login;
