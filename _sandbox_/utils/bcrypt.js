const bcrypt = require("bcryptjs");

const hashPassword = (plainPassword = "") => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(plainPassword, salt);

  return hash;
};

const comparePassword = (plainPassword = "", hashedPassword = "") => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
