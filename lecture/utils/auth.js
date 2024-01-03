const { GraphQLError } = require("graphql");
const { verifyToken } = require("./jwt");
const { findOneUser } = require("../models/user");
const { ObjectId } = require("mongodb");

const authentication = async (req) => {
  console.log("authentication function kepanggil");
  // throw new GraphQLError("Ga boleh masukkk");

  const headerAuthorization = req.headers.authorization;

  // console.log(headerAuthorization, "<<< header auth");

  if (!headerAuthorization) {
    throw new GraphQLError("Invalid token", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    });
  }

  const token = headerAuthorization.split(" ")[1];

  const decodedToken = verifyToken(token);

  // console.log(decodedToken, "<<< decoded token");

  const user = await findOneUser({
    _id: new ObjectId(decodedToken.id),
    email: decodedToken.email,
  });

  if (!user) {
    throw new GraphQLError("Invalid token", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    });
  }

  return {
    id: user._id,
    email: user.email,
    username: user.username,
  };
};

module.exports = authentication;
