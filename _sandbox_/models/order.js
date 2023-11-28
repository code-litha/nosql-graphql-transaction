const { ObjectId } = require("mongodb");
const { getDatabase, client } = require("../config/db");
const Product = require("./product");
const { GraphQLError } = require("graphql");

class Order {
  static collection() {
    const database = getDatabase();
    const orderCollection = database.collection("orders");

    return orderCollection;
  }

  static async findAll(userId) {
    const orders = await this.collection()
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "products",
          },
        },
      ])
      .toArray();

    return orders;
  }

  static async create(payload) {
    const session = client.startSession();
    try {
      session.startTransaction();

      const findProduct = await Product.collection().findOne(
        {
          _id: new ObjectId(payload.productId),
        },
        { session }
      );

      if (!findProduct) {
        throw new GraphQLError("Product Not Found");
      }

      if (findProduct.stock < payload.quantity) {
        throw new GraphQLError("Out of stock");
      }

      const newOrder = await this.collection().insertOne(
        {
          ...payload,
          productId: new ObjectId(findProduct._id),
          price: findProduct.price * payload.quantity || 0,
        },
        { session }
      );

      await Product.collection().updateOne(
        {
          _id: new ObjectId(findProduct._id),
        },
        {
          $set: {
            stock: findProduct.stock - payload.quantity,
          },
        },
        {
          session,
        }
      );

      const order = await this.collection().findOne(
        {
          _id: new ObjectId(newOrder.insertedId),
        },
        { session }
      );

      await session.commitTransaction();

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }
}

module.exports = Order;
