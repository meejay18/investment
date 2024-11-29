import { Application } from "express";
import user from "./router/authRouter";
import transfer from "./router/transactionRouter";

export const mainApp = (app: Application) => {
  try {
    app.use("/api", user);
    app.use("/api", transfer);
  } catch (error) {
    return error;
  }
};
user;
