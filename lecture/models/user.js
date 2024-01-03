const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/db");
const { hashPassword } = require("../utils/bcrypt");

const getCollection = () => {
  const database = getDatabase();
  const userCollection = database.collection("users");

  return userCollection;
};

const register = async (payload = {}) => {
  try {
    payload.password = hashPassword(payload.password);

    const newUser = await getCollection().insertOne(payload);

    const user = await findUserById(newUser.insertedId, true);

    return user;
  } catch (error) {
    throw error;
  }
};

const findUserById = async (id, hidePassword) => {
  const options = {};

  if (hidePassword) {
    options.projection = {
      password: 0,
    };
  }
  const user = await getCollection().findOne(
    {
      _id: new ObjectId(id),
    },
    // {
    //   projection: {
    //     // _id: 1,
    //     password: 0
    //   }
    // }
    options
  );

  return user;
};

const findOneUser = async (filterQuery = {}, hidePassword = false) => {
  const options = {};

  if (hidePassword) {
    options.projection = {
      password: 0,
    };
  }

  const user = await getCollection().findOne(filterQuery, options);

  return user;
};

module.exports = {
  register,
  findUserById,
  findOneUser,
};
