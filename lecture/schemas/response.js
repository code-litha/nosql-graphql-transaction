const typeDefs = `#graphql
  interface Response {
    statusCode: Int!
    message: String
    error: String
  }

  type ResponseProduct implements Response {
    statusCode: Int!
    message: String
    error: String
    data: [Product]
  }

  type ResponseProductMutation implements Response {
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
`;

module.exports = {
  responseTypeDefs: typeDefs,
};
