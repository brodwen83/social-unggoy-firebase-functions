/**
 * @description returns true if value is empty null or undefined.
 * @param {any} value typeof any
 * @returns true or false
 */
const isEmpty = value =>
  !value ||
  (typeof value === 'object' && Object.keys(value).length === 0) ||
  (typeof value === 'string' && value.trim().length === 0);

/**
 * @description returns true if it is a valid email.
 * @param {any} email typeof string
 * @returns true or false
 */
const isEmail = email => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (email.match(regex)) return true;
  else return false;
};

const reduceUserDetails = ({ bio, website, location }) => {
  let userDetails = {};

  if (!isEmpty(bio)) userDetails.bio = bio;
  if (!isEmpty(website)) {
    if (website.trim().substring(0, 4) !== 'http') {
      userDetails.website = `http://${website.trim()}`;
    } else userDetails.website = website;
  }
  if (!isEmpty(location)) userDetails.location = location;

  return userDetails;
};

module.exports = {
  isEmpty,
  isEmail,
  reduceUserDetails,
};
