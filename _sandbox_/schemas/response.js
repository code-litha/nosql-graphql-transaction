const typeDefs = `#graphql
  interface Response {
    statusCode: Int!
    message: String
    error: String
  }

  type ResponseProductList implements Response {
    statusCode: Int!
    message: String
    error: String
    data: [Product]
  }

  type ResponseProduct implements Response {
    statusCode: Int!
    message: String
    error: String
    data: Product
  }

  type UserLoginData {
    token: String
  }

  type ResponseUserLogin implements Response {
    statusCode: Int!
    message: String
    error: String
    data: UserLoginData
  }

  type ResponseUser implements Response {
    statusCode: Int!
    message: String
    error: String
    data: User
  }

  type ResponseOrderList implements Response {
    statusCode: Int!
    message: String
    error: String
    data: [Order]
  }

  type ResponseOrder implements Response {
    statusCode: Int!
    message: String
    error: String
    data: Order
  }
`;

module.exports = {
  responseTypeDefs: typeDefs,
};
