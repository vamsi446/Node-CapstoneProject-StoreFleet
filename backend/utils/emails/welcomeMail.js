// Import the necessary modules here
import nodemailer from "nodemailer";
export const sendWelcomeEmail = async (user) => {
  // Write your code here
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.SMPT_SERVICE,
      auth: {
        user: process.env.STORFLEET_SMPT_MAIL,
        pass: process.env.STORFLEET_SMPT_MAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.STORFLEET_SMPT_MAIL,
      to: user.email,
      subject: "Welcome to StoreFleet",
      html: `
      <div style="display: flex; justify-content: center; align-items: center;">
      <img src="https://files.codingninjas.in/logo1-32230.png?_ga=2.34662757.598281949.1707544318-1301688177.1702552570"
           style="text-align: center; height: 200px; width: 200px;">
  </div>
  <center>
      <p><h1>Welcome to Storefleet</h1></p>
      <p><b>Hello, ${user.name}</b></p>
      <p><b>Thank you for registering with Storefleet. We're excited to have you as a new member of our community.</b></p>
      <button style="display: inline-block; border-radius: 4px; background-color: #3d405b; border: none; color: #FFFFFF; text-align: center; font-size: 17px; padding: 16px; width: 130px; transition: all 0.5s; cursor: pointer; margin: 5px;">
          <span style="cursor: pointer; display: inline-block; position: relative; transition: 0.5s;">Get Started</span>
      </button>
  </center>  
    `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
    });
  } catch (error) {
    console.log("Error occurred while sending welcome email :" + error);
  }
};
