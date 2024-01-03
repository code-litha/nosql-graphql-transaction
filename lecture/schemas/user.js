const { GraphQLError } = require("graphql");
const { register, findOneUser } = require("../models/user");
const { comparePassword } = require("../utils/bcrypt");
const { generateToken } = require("../utils/jwt");

const typeDefs = `#graphql
  type User {
    _id: ID
    username: String
    email: String
    password: String
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  type ResUserLoginNew {
    token: String!
  }
  
  type Mutation {
    register(input: RegisterInput): ResponseUser
    login(email: String!, password: String!):  ResUserLoginNew
  }
`;

const resolvers = {
  Mutation: {
    register: async (_, args) => {
      try {
        const { username, email, password } = args.input;

        const user = await register({
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
    login: async (_, args) => {
      try {
        const { email, password } = args;

        const user = await findOneUser({ email });

        if (!user || !comparePassword(password, user.password)) {
          throw new GraphQLError("Invalid username or password", {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 401 },
            },
          });
        }

        const payload = {
          id: user._id,
          email: user.email,
        };

        const token = generateToken(payload);

        return {
          token,
        };
      } catch (error) {
        throw error;
      }
    },
  },
};

module.exports = {
  userTypeDefs: typeDefs,
  userResolvers: resolvers,
};
