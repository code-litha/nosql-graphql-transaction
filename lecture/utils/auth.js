const { GraphQLError } = require("graphql");
const { verifyToken } = require("./jwt");
const User = require("../models/user");

const authentication = async (req) => {
  const headerAuthorization = req.headers.authorization;

  if (!headerAuthorization) {
    throw new GraphQLError("You are not authenticated", {
      extensions: {
        http: "401",
        code: "UNAUTHENTICATED",
      },
    });
  }

  const token = headerAuthorization.split(" ")[1];

  const payload = verifyToken(token);

  const user = await User.findOne({ email: payload.email }, true);

  if (!user) {
    throw new GraphQLError("You are not authenticated", {
      extensions: {
        http: "401",
        code: "UNAUTHENTICATED",
      },
    });
  }

  return {
    id: user._id,
    email: user.email,
  };
};

module.exports = authentication;
