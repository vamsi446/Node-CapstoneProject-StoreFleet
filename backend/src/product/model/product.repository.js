import ProductModel from "./product.schema.js";

export const addNewProductRepo = async (product) => {
  return await new ProductModel(product).save();
};

export const getAllProductsRepo = async () => {
  return await ProductModel.find({});
};

export const updateProductRepo = async (_id, updatedData) => {
  return await ProductModel.findByIdAndUpdate(_id, updatedData, {
    new: true,
    runValidators: true,
    useFindAndModify: true,
  });
};

export const deleProductRepo = async (_id) => {
  return await ProductModel.findByIdAndDelete(_id);
};

export const getProductDetailsRepo = async (_id) => {
  return await ProductModel.findById(_id);
};

export const getTotalCountsOfProduct = async () => {
  return await ProductModel.countDocuments();
};

export const findProductRepo = async (productId) => {
  return await ProductModel.findById(productId);
};

// This function is responsible for the keyword search and pagination limit
export const findProductByFilter = async (keyword, page, pageLimit) => {
  const products = await ProductModel.find({
    $or: [{ name: { $regex: keyword, $options: "i" } }],
  })
    .skip((page - 1) * pageLimit)
    .limit(pageLimit);
  return products;
};

// Reduce the stock after placing the order
export const reduceStockRepo = async (productID, orderQty) => {
  try {
    const reduceQty = await findProductRepo(productID);
    reduceQty.stock -= orderQty;
    reduceQty.save();
    return;
  } catch (error) {
    return new ErrorHandler(500, "Something went wrong with database");
  }
};
