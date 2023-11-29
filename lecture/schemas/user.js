const { GraphQLError } = require("graphql");
const User = require("../models/user");
const { comparePassword } = require("../utils/bcrypt");
const { generateToken } = require("../utils/jwt");

const typeDefs = `#graphql
  type User {
    _id: ID
    username: String
    email: String
    password: String
    wishlists: [ProductWishlist]
  }

  type ProductWishlist {
    name: String
    createdAt: String
    productId: ID
    productDetail: Product
  }

  type Query {
    login(email: String!, password: String!): ResponseUserLogin 
    getWishlist: ResponseUser
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }
  
  type Mutation {
    register(input: RegisterInput): ResponseUser
    addWishlist(productId: ID!): ResponseUser
  }
`;

const resolvers = {
  Query: {
    login: async (_, args) => {
      try {
        const { email, password } = args;

        const user = await User.findOne({ email });

        if (!user || !comparePassword(password, user.password)) {
          throw new GraphQLError("Invalid username or password");
        }

        const payload = {
          id: user._id,
          email: user.email,
        };

        const token = generateToken(payload);

        return {
          statusCode: 200,
          message: `Successfully to login`,
          data: {
            token,
          },
        };
      } catch (error) {
        throw error;
      }
    },
    getWishlist: async (_, _args, context) => {
      const { id: userId } = await context.doAuthentication();

      const user = await User.findDetailWishlist(userId);

      return {
        statusCode: 200,
        data: user[0] || null,
      };
    },
  },
  Mutation: {
    register: async (_, args) => {
      try {
        const { username, email, password } = args.input;

        const user = await User.createOne({
          username,
          email,
          password,
        });

        return {
          statusCode: 200,
          message: `Successfully to register`,
          data: user,
        };
      } catch (error) {
        throw new GraphQLError("Failed to Register");
      }
    },
    addWishlist: async (_, args, contextValue) => {
      const { id: userId } = await contextValue.doAuthentication();
      const { productId } = args;

      const user = await User.addWishlist(productId, userId);

      return {
        statusCode: 200,
        data: user,
      };
    },
  },
};

module.exports = {
  userTypeDefs: typeDefs,
  userResolvers: resolvers,
};
