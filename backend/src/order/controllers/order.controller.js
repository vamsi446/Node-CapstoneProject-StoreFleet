// Please don't change the pre-written code
// Import the necessary modules here

import { createNewOrderRepo } from "../model/order.repository.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";
import {
  getProductDetailsRepo,
  reduceStockRepo,
} from "../../product/model/product.repository.js";

export const createNewOrder = async (req, res, next) => {
  // Write your code here for placing a new order
  try {
    const { orderedItems } = req.body;
    // Get the products list from the req.body
    let getProducts = {};
    orderedItems.forEach((element) => {
      return (getProducts = element);
    });
    // verify the product in DB
    const verifyProduct = await getProductDetailsRepo({
      _id: getProducts.product,
    });
    if (!verifyProduct) {
      return next(new ErrorHandler(404, "Product not found"));
    }
    // Check the stock
    if (verifyProduct.stock >= getProducts.quantity) {
      req.body.user = req.user; //added user details to the req.body
      // place the order
      const newOrder = await createNewOrderRepo(req.body);
      res.status(201).json({
        status: "success",
        msg: "Order has been placed successfully",
        response: newOrder,
      });
      // reduce the stock
      await reduceStockRepo(getProducts.product, getProducts.quantity);
    } else {
      return next(new ErrorHandler(500, "Product has no stock."));
    }
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(500, "Something went wrong"));
  }
};
