const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/db");
const { hashPassword } = require("../utils/bcrypt");

class User {
  static collection() {
    const database = getDatabase();
    const userCollection = database.collection("users");

    return userCollection;
  }

  static async findOne(filterQuery = {}, hidePassword = false) {
    const options = {};

    if (hidePassword) {
      options.projection = {
        password: 0,
      };
    }

    const user = await this.collection().findOne(filterQuery, options);

    return user;
  }

  static async findById(id, hidePassword = false) {
    const options = {};

    if (hidePassword) {
      options.projection = {
        password: 0,
      };
    }
    const user = await this.collection().findOne(
      {
        _id: new ObjectId(id),
      },
      options
    );

    return user;
  }

  static async createOne(payload = {}) {
    try {
      payload.password = hashPassword(payload.password);

      const newUser = await this.collection().insertOne(payload);

      const user = await this.findById(newUser.insertedId, true);

      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
