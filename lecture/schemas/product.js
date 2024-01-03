const { GraphQLError } = require("graphql");
const {
  findAllProduct,
  findOneProduct,
  createOneProduct,
  updateOneProduct,
  deleteOneProduct,
} = require("../models/product");
const { getDatabase, client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Config redis
const Redis = require("ioredis");
const redis = new Redis();

const typeDefs = `#graphql
  type Product {
    _id: ID
    name: String
    stock: Int
    price: Int
    authorId: ID
    likes: [ProductLikes]
  }

  type ProductLikes {
    userId: ID
    username: String
  }

  type Order {
    _id: ID
    productId: ID
    userId: ID
    quantity: Int
    totalPrice: Int
  }

  input ProductCreateInput {
    name: String!
    stock: Int!
    price: Int!
  }

  type Query {
    products: ResponseProduct
    product(id: ID!): Product
  }

  type Mutation {
    productCreate(input: ProductCreateInput): ResponseProductMutation
    productUpdate(input: ProductCreateInput, id: ID!): ResponseProductMutation
    productDelete(id: ID!): ResponseProductMutation
    addOrder (productId: ID!, quantity: Int!): Order
    addLikes (productId: ID!): Product
  }
`;

const resolvers = {
  Query: {
    products: async (_, _args, contextValue) => {
      const resContext = await contextValue.doAuthentication();
      console.log(resContext, "<<< res context");
      try {
        // 1. check dulu apakah kita sudah punya cache yang disimpan ?
        // 2. jika ada, maka dia yang di return
        // 3. jika tidak, maka kita akan ambil data ke database, lalu nanti disimpan ke dalam cache

        const productCache = await redis.get("products");

        // console.log(typeof productCache, "<<< product cache");
        if (productCache) {
          return {
            statusCode: 200,
            message: `Successfully retrieved products data`,
            data: JSON.parse(productCache),
          };
        }

        const products = await findAllProduct();

        await redis.set("products", JSON.stringify(products));

        return {
          statusCode: 200,
          message: `Successfully retrieved products data`,
          data: products,
        };
      } catch (error) {
        throw new GraphQLError("An error while retrieved data products");
      }
    },
    product: async (_, { id }) => {
      try {
        const product = await findOneProduct(id);

        return product;
      } catch (error) {
        throw new GraphQLError("An error while retrieved data product");
      }
    },
  },
  Mutation: {
    productCreate: async (_, args, contextValue) => {
      const userLogin = await contextValue.doAuthentication();

      try {
        const product = await createOneProduct({
          name: args.input.name,
          stock: args.input.stock,
          price: args.input.price,
          authorId: userLogin.id,
        });

        await redis.del("products");

        return {
          statusCode: 200,
          message: `Successfully create new product`,
          data: product,
        };
      } catch (error) {
        throw new GraphQLError("An error while create data product");
      }
    },
    productUpdate: async (_, args) => {
      try {
        const payload = {
          name: args.input.name,
          stock: args.input.stock,
          price: args.input.price,
        };

        const product = await updateOneProduct(args.id, payload);

        return {
          statusCode: 200,
          message: `Successfully update product`,
          data: product,
        };
      } catch (error) {
        throw new GraphQLError("An error while update data product");
      }
    },
    productDelete: async (_, args) => {
      try {
        await deleteOneProduct(args.id);

        return {
          statusCode: 200,
          message: `Successfully delete product with id ${args.id}`,
        };
      } catch (error) {
        throw new GraphQLError("An error while delete data product");
      }
    },
    addOrder: async (_, args, contextValue) => {
      const session = client.startSession();
      try {
        session.startTransaction();
        const userLogin = await contextValue.doAuthentication();

        const database = getDatabase();
        const productCollection = database.collection("products");
        const orderCollection = database.collection("orders");

        const product = await productCollection.findOne(
          {
            _id: new ObjectId(args.productId),
          },
          {
            session,
          }
        );

        if (!product) {
          throw new GraphQLError("Product Not Found", {
            extensions: {
              code: "NOTFOUND",
              http: { status: 404 },
            },
          });
        }

        if (Number(product.stock) < Number(args.quantity)) {
          throw new GraphQLError("Stock ga cukup", {
            extensions: {
              code: "BADREQUEST",
              http: { status: 400 },
            },
          });
        }

        const payloadOrder = {
          productId: product._id,
          userId: userLogin.id,
          quantity: args.quantity,
          totalPrice: Number(args.quantity) * product.price,
        };

        const newOrder = await orderCollection.insertOne(payloadOrder, {
          session,
        });

        await productCollection.updateOne(
          {
            _id: product._id,
          },
          {
            $set: {
              stock: Number(product.stock) - Number(args.quantity),
            },
          },
          {
            session,
          }
        );

        await session.commitTransaction();

        const order = await orderCollection.findOne({
          _id: newOrder.insertedId,
        });

        return order;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    },
    addLikes: async (_, args, contextValue) => {
      const userLogin = await contextValue.doAuthentication();

      const database = getDatabase();
      const productCollection = database.collection("products");

      const product = await productCollection.findOne({
        _id: new ObjectId(args.productId),
      });

      if (!product) {
        throw new GraphQLError("Product Not Found", {
          extensions: {
            code: "NOTFOUND",
            http: { status: 404 },
          },
        });
      }

      await productCollection.updateOne(
        {
          _id: product._id,
        },
        {
          $addToSet: {
            // no duplicate
            likes: {
              userId: userLogin.id,
              username: userLogin.username,
            },
          },
          // $push: {
          //   // duplicate
          //   likes: {
          //     userId: userLogin.id,
          //     username: userLogin.username,
          //   },
          // },
        }
      );

      const updatedProduct = await productCollection.findOne({
        _id: new ObjectId(args.productId),
      });

      return updatedProduct;
    },
  },
};

module.exports = {
  productTypeDefs: typeDefs,
  productResolvers: resolvers,
};
