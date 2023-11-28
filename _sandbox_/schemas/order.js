const { GraphQLError } = require("graphql");
const Order = require("../models/order");

const typeDefs = `#graphql
  type Order {
    _id: ID
    productId: ID
    userId: ID
    quantity: Int
    price: Int
    products: [Product]
  }

  type Query {
    orders: ResponseOrderList
  }

  input OrderCreateInput {
    productId: ID!
    quantity: Int!
  }

  type Mutation {
    orderCreate(input: OrderCreateInput): ResponseOrder
  }
`;

const resolvers = {
  Query: {
    orders: async (_parent, _args, context) => {
      try {
        const { id: userId } = await context.doAuthentication();

        const orders = await Order.findAll(userId);

        return {
          statusCode: 200,
          data: orders,
        };
      } catch (error) {
        // console.log(error);
        throw new GraphQLError("An error while retrieved data orders");
      }
    },
  },
  Mutation: {
    orderCreate: async (_, args, context) => {
      const { id: userId } = await context.doAuthentication();
      const { productId, quantity } = args.input;

      const payload = {
        userId,
        productId,
        quantity,
      };

      const order = await Order.create(payload);

      return {
        statusCode: 200,
        data: order,
      };
    },
  },
};

module.exports = {
  orderTypeDefs: typeDefs,
  orderResolvers: resolvers,
};
