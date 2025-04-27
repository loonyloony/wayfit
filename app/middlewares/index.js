const authJwt = require("./authJwt");
const zkLogin = require("./zkLogin.middleware");

module.exports = {
  authJwt,
  zkLogin
};