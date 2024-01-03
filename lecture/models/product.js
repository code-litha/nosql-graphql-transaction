const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/db");

// class Product {
//   static collection() {
//     const database = getDatabase();
//     const productCollection = database.collection("products");

//     return productCollection;
//   }

//   static async findAll() {
//     const products = await this.collection().find({}).toArray();

//     return products;
//   }

//   static async findOne(id) {
//     const product = await this.collection().findOne({
//       _id: new ObjectId(id),
//     });

//     return product;
//   }

//   static async createOne(payload) {
//     try {
//       const newProduct = await this.collection().insertOne(payload);

//       const product = await this.collection().findOne({
//         _id: new ObjectId(newProduct.insertedId),
//       });

//       return product;
//     } catch (error) {
//       throw error;
//     }
//   }

//   static async updateOne(id, payload) {
//     try {
//       const filterQuery = {
//         _id: new ObjectId(id),
//       };

//       await this.collection().updateOne(filterQuery, {
//         $set: payload,
//       });

//       const product = await this.findOne(id);

//       return product;
//     } catch (error) {
//       throw error;
//     }
//   }

//   static async deleteOne(id) {
//     return await this.collection().deleteOne({
//       _id: new ObjectId(id),
//     });
//   }
// }

// module.exports = Product;

const getCollection = () => {
  const database = getDatabase();
  const productCollection = database.collection("products");

  return productCollection;
};

const findAllProduct = async () => {
  const products = await getCollection().find({}).toArray();

  return products;
};

const findOneProduct = async (id) => {
  const product = await getCollection().findOne({
    _id: new ObjectId(id),
  });

  return product;
};

const createOneProduct = async (payload) => {
  try {
    const newProduct = await getCollection().insertOne(payload);

    const product = await getCollection().findOne({
      _id: new ObjectId(newProduct.insertedId),
    });

    return product;
  } catch (error) {
    throw error;
  }
};

const updateOneProduct = async (id, payload) => {
  try {
    const filterQuery = {
      _id: new ObjectId(id),
    };

    await getCollection().updateOne(filterQuery, {
      $set: payload,
    });

    const product = await findOneProduct(id);

    return product;
  } catch (error) {
    throw error;
  }
};

const deleteOneProduct = async (id) => {
  return await getCollection().deleteOne({
    _id: new ObjectId(id),
  });
};

module.exports = {
  findAllProduct,
  findOneProduct,
  createOneProduct,
  updateOneProduct,
  deleteOneProduct,
};
