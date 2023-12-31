const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/db");

class Product {
  static collection() {
    const database = getDatabase();
    const productCollection = database.collection("products");

    return productCollection;
  }

  static async findAll() {
    const products = await this.collection().find({}).toArray();

    return products;
  }

  static async findOne(id) {
    const product = await this.collection().findOne({
      _id: new ObjectId(id),
    });

    return product;
  }

  static async createOne(payload) {
    try {
      const newProduct = await this.collection().insertOne(payload);

      const product = await this.collection().findOne({
        _id: new ObjectId(newProduct.insertedId),
      });

      return product;
    } catch (error) {
      throw error;
    }
  }

  static async updateOne(id, payload) {
    try {
      const filterQuery = {
        _id: new ObjectId(id),
      };

      await this.collection().updateOne(filterQuery, {
        $set: payload,
      });

      const product = await this.findOne(id);

      return product;
    } catch (error) {
      throw error;
    }
  }

  static async deleteOne(id) {
    return await this.collection().deleteOne({
      _id: new ObjectId(id),
    });
  }

  static async addWishlist(userId, productId) {
    try {
      await this.collection().updateOne(
        {
          _id: new ObjectId(productId),
        },
        {
          $addToSet: {
            wishlists: {
              userId: new ObjectId(userId),
            },
          },
        }
      );

      const product = await this.collection().findOne(
        {
          ["wishlists.userId"]: new ObjectId(userId),
          _id: new ObjectId(productId),
        }
        // { projection: { wishlists: 0 } }
      );

      return product;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Product;
