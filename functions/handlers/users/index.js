const signUp = require('./signUp');
const login = require('./login');
const getAuthenticatedUser = require('./getAuthenticatedUser');
const addUserDetails = require('./addUserDetails');
const uploadImage = require('./uploadImage');
const getUserDetails = require('./getUserDetails');
const markNotificationsRead = require('./markNotificationsRead');

module.exports = {
  signUp,
  login,
  getAuthenticatedUser,
  addUserDetails,
  uploadImage,
  getUserDetails,
  markNotificationsRead,
};
