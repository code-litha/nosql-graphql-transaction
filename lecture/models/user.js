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

  static async addWishlist(productId, userId) {
    const updateUser = await this.collection().updateOne(
      {
        _id: new ObjectId(userId),
      },
      {
        $addToSet: {
          // $push
          wishlists: {
            productId: new ObjectId(productId),
            // createdAt: new Date(),
          },
        },
      }
    );

    console.log(updateUser, "<<< update user");

    const user = await this.findOne({ _id: new ObjectId(userId) }, true);

    return user;
  }

  static async findDetailWishlist(userId) {
    const user = await this.collection()
      .aggregate([
        {
          $match: {
            _id: new ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$wishlists",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "wishlists.productId",
            foreignField: "_id",
            as: "wishlists.productDetail",
          },
        },
        {
          $unwind: {
            path: "$wishlists.productDetail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            username: {
              $first: "$username",
            },
            email: {
              $first: "$email",
            },
            wishlists: {
              $push: "$$ROOT.wishlists",
            },
          },
        },
      ])
      .toArray();

    return user;
  }
}

module.exports = User;
