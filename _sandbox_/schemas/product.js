const { GraphQLError } = require("graphql");
const Product = require("../models/product");
const redis = require("../config/redis");
const REDIS_PRODUCT_KEY = "data:products";

const typeDefs = `#graphql
  type Product {
    _id: ID
    name: String
    stock: Int
    price: Int
    wishlists: [ProductWishList]
  }

  type ProductWishList {
    userId: ID
  }

  input ProductCreateInput {
    name: String!
    stock: Int!
    price: Int!
  }

  type Query {
    products: ResponseProductList
    product(id: ID!): Product
  }

  type Mutation {
    productCreate(input: ProductCreateInput): ResponseProduct
    productUpdate(input: ProductCreateInput, id: ID!): ResponseProduct
    productDelete(id: ID!): ResponseProduct
    addWishList(id: ID!): ResponseProduct
  }
`;

const resolvers = {
  Query: {
    products: async () => {
      try {
        const productCache = await redis.get(REDIS_PRODUCT_KEY);

        if (productCache) {
          return {
            statusCode: 200,
            message: `Successfully retrieved products data`,
            data: JSON.parse(productCache),
          };
        }

        const products = await Product.findAll();

        await redis.set(REDIS_PRODUCT_KEY, JSON.stringify(products));

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

        // Invalidate Cache
        redis.del(REDIS_PRODUCT_KEY);

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
    addWishList: async (_, args, context) => {
      try {
        const { id: userId } = await context.doAuthentication();
        const { id } = args;

        const product = await Product.addWishlist(userId, id);

        return {
          statusCode: 200,
          message: `Successfully add product wishlist`,
          data: product,
        };
      } catch (error) {
        throw new GraphQLError("An error while add data product wishlist");
      }
    },
  },
};

module.exports = {
  productTypeDefs: typeDefs,
  productResolvers: resolvers,
};
