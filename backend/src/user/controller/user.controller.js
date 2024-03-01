// Please don't change the pre-written code
// Import the necessary modules here
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../../utils/emails/passwordReset.js";
import { sendWelcomeEmail } from "../../../utils/emails/welcomeMail.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";
import { sendToken } from "../../../utils/sendToken.js";
import {
  createNewUserRepo,
  deleteUserRepo,
  findUserForPasswordResetRepo,
  findUserRepo,
  getAllUsersRepo,
  updateUserProfileRepo,
  updateUserRoleAndProfileRepo,
} from "../models/user.repository.js";
import { error } from "console";


export const createNewUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    const newUser = await createNewUserRepo(req.body);
    await sendToken(newUser, res, 200);

    // Implement sendWelcomeEmail function to send welcome message
    await sendWelcomeEmail(newUser);
  } catch (err) {
    //  handle error for duplicate email
    if (err.code == 11000 && err.keyPattern && err.keyPattern.email) {
      res
        .status(400)
        .send({ success: false, error: "email already registered" });
    } else {
      return next(new ErrorHandler(400, err));
    }
  }
};

export const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler(400, "please enter email/password"));
    }
    const user = await findUserRepo({ email }, true);
    if (!user) {
      return next(
        new ErrorHandler(401, "user not found! register yourself now!!")
      );
    }
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Invalid email or passsword!"));
    }
    await sendToken(user, res, 200);
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const logoutUser = async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({ success: true, msg: "logout successful" });
};

export const forgetPassword = async (req, res, next) => {
  // Implement feature for forget password
  const { email } = req.body;
  const user = await findUserRepo({ email: email });
  if (!user) {
    return next(
      new ErrorHandler(
        404,
        "User Not found. Please enter the correct email address"
      )
    );
  }
  const resetToken = await user.getResetPasswordToken();
  await sendPasswordResetEmail(user, resetToken);
  return res.status(200).json({
    status: "success",
    message: `Reset password mail has been sent to ${user.email}`,
  });
};

export const resetUserPassword = async (req, res, next) => {
  // Implement feature for reset password
  try {
    const resetToken = req.params.token;
    const { password, confirmPassword } = req.body;
    if (!resetToken) {
      return next(
        new ErrorHandler(400, "Please provide the token to reset the password")
      );
    }
    if (!password || !confirmPassword) {
      return next(new ErrorHandler(400, "Please provide the password"));
    }
    if (password !== confirmPassword) {
      return next(new ErrorHandler(400, "The password is not matching"));
    }
    const hashToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const user = await findUserForPasswordResetRepo(hashToken);
    if (!user) {
      return next(new ErrorHandler(400, "Invalid or expired reset token"));
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    return next(new ErrorHandler(500, "Internal server error"));
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const userDetails = await findUserRepo({ _id: req.user._id });
    res.status(200).json({ success: true, userDetails });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const updatePassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  try {
    if (!currentPassword) {
      return next(new ErrorHandler(401, "pls enter current password"));
    }

    const user = await findUserRepo({ _id: req.user._id }, true);
    const passwordMatch = await user.comparePassword(currentPassword);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Incorrect current password!"));
    }

    if (!newPassword || newPassword !== confirmPassword) {
      return next(
        new ErrorHandler(401, "mismatch new password and confirm password!")
      );
    }

    user.password = newPassword;
    await user.save();
    await sendToken(user, res, 200);
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const updateUserProfile = async (req, res, next) => {
  const { name, email } = req.body;
  try {
    const updatedUserDetails = await updateUserProfileRepo(req.user._id, {
      name,
      email,
    });
    res.status(201).json({ success: true, updatedUserDetails });
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

// admin controllers
export const getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await getAllUsersRepo();
    res.status(200).json({ success: true, allUsers });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const getUserDetailsForAdmin = async (req, res, next) => {
  try {
    const userDetails = await findUserRepo({ _id: req.params.id });
    if (!userDetails) {
      return res
        .status(400)
        .json({ success: false, msg: "no user found with provided id" });
    }
    res.status(200).json({ success: true, userDetails });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await deleteUserRepo(req.params.id);
    if (!deletedUser) {
      return res
        .status(400)
        .json({ success: false, msg: "no user found with provided id" });
    }

    res
      .status(200)
      .json({ success: true, msg: "user deleted successfully", deletedUser });
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const updateUserProfileAndRole = async (req, res, next) => {
  // Write your code here for updating the roles of other users by admin
  try {
    //const { id } = req.params.id;
    const { name, email, role } = req.body;

    const user = await findUserRepo({ _id: req.params.id }, true);
    if (!user) {
      return next(
        new ErrorHandler(404, "User not found. Please enter a valid user ID")
      );
    }
    const userUpdate = await updateUserRoleAndProfileRepo(
      { _id: req.params.id },
      req.body
    );
    if (!userUpdate) {
      return next(new ErrorHandler(500, error));
    } else {
      return res.status(200).json({
        status: "Success",
        result: "Updated user details",
        response: userUpdate,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};
