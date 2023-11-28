const { GraphQLError } = require("graphql");
const Product = require("../models/product");

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

  type Query {
    products: ResponseProduct
    product(id: ID!): Product
  }

  type Mutation {
    productCreate(input: ProductCreateInput): ResponseProductMutation
    productUpdate(input: ProductCreateInput, id: ID!): ResponseProductMutation
    productDelete(id: ID!): ResponseProductMutation
  }
`;

const resolvers = {
  Query: {
    products: async () => {
      try {
        const products = await Product.findAll();
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
  },
};

module.exports = {
  productTypeDefs: typeDefs,
  productResolvers: resolvers,
};
