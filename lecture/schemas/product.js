const { GraphQLError } = require("graphql");
const Product = require("../models/product");
const { getDatabase, client } = require("../config/db");
const { ObjectId } = require("mongodb");
const redis = require("../config/redis");

const typeDefs = `#graphql
  type Product {
    _id: ID
    name: String
    stock: Int
    price: Int
  }

  input ProductCreateInput {
    name: String!
    stock: Int!
    price: Int!
  }

  type Order {
    _id: ID
    productId: ID
    userId: ID
    quantity: Int
    price: Int
  }

  type Query {
    products: ResponseProduct
    product(id: ID!): Product
  }

  type Mutation {
    productCreate(input: ProductCreateInput): ResponseProductMutation
    productUpdate(input: ProductCreateInput, id: ID!): ResponseProductMutation
    productDelete(id: ID!): ResponseProductMutation
    orderProduct(productId: ID!, quantity: Int!): ResponseOrder 
  }
`;

const resolvers = {
  Query: {
    products: async () => {
      try {
        const productCache = await redis.get("data:products");

        if (productCache) {
          return {
            statusCode: 200,
            message: `Successfully retrieved products data`,
            data: JSON.parse(productCache),
          };
        }

        const products = await Product.findAll();

        await redis.set("data:products", JSON.stringify(products));

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
        const product = await Product.findOne(id);

        return product;
      } catch (error) {
        throw new GraphQLError("An error while retrieved data product");
      }
    },
  },
  Mutation: {
    productCreate: async (_, args) => {
      try {
        const product = await Product.createOne({
          name: args.input.name,
          stock: args.input.stock,
          price: args.input.price,
        });

        await redis.del("data:products"); // Invalidate Cache

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

        const product = await Product.updateOne(args.id, payload);

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
        await Product.deleteOne(args.id);

        return {
          statusCode: 200,
          message: `Successfully delete product with id ${args.id}`,
        };
      } catch (error) {
        throw new GraphQLError("An error while delete data product");
      }
    },
    orderProduct: async (_, args, contextValue) => {
      const session = client.startSession();
      try {
        session.startTransaction();
        const { productId, quantity } = args;
        const { id: userId } = await contextValue.doAuthentication();

        const database = getDatabase();
        const productCollection = database.collection("products");
        const orderCollection = database.collection("orders");

        // 1. Order insertOne
        // 2. Product di update stock yang sudah dikurangin dengan quantity

        const findProduct = await productCollection.findOne(
          {
            _id: new ObjectId(productId),
          },
          {
            session: session,
          }
        );

        if (!findProduct) {
          throw new GraphQLError("Product Not Found");
        }

        if (findProduct.stock < quantity) {
          throw new GraphQLError("Out of stock");
        }

        const newOrder = await orderCollection.insertOne(
          {
            productId: findProduct._id,
            userId,
            quantity,
            price: findProduct.price * quantity,
          },
          {
            session,
          }
        );

        await productCollection.updateOne(
          {
            _id: findProduct._id,
          },
          {
            $set: {
              stock: findProduct.stock - quantity,
            },
          },
          {
            session,
          }
        );

        await session.commitTransaction();
        const order = await orderCollection.findOne({
          _id: new ObjectId(newOrder.insertedId),
        });

        return {
          statusCode: 200,
          message: `Successfully create order`,
          data: order,
        };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    },
  },
};

module.exports = {
  productTypeDefs: typeDefs,
  productResolvers: resolvers,
};
