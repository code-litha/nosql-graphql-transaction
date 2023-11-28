require("dotenv").config();
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { productTypeDefs, productResolvers } = require("./schemas/product");
const { responseTypeDefs } = require("./schemas/response");
const PORT = process.env.PORT || 4000;
const mongoConnection = require("./config/db");
const { userTypeDefs, userResolvers } = require("./schemas/user");
const { orderTypeDefs, orderResolvers } = require("./schemas/order");
const authentication = require("./utils/auth");

const server = new ApolloServer({
  typeDefs: [productTypeDefs, responseTypeDefs, userTypeDefs, orderTypeDefs],
  resolvers: [productResolvers, userResolvers, orderResolvers],
  // introspection: true, // ini buat nanti pas deploy aja
});

(async () => {
  try {
    await mongoConnection.connect();
    const { url } = await startStandaloneServer(server, {
      listen: {
        port: PORT,
      },
      context: async ({ req }) => {
        // console.log("this console will be triggered on every request");

        return {
          doAuthentication: async () => await authentication(req),
        };
      },
    });
    console.log(`🚀  Server ready at: ${url}`);
  } catch (error) {
    console.log(error);
  }
})();
