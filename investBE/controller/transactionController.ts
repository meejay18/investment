import { Request, Response } from "express";
import crypto from "crypto";
import transactionModel from "../model/transactionModel";
import authModel from "../model/authModel";
import { Types } from "mongoose";

export const fundWallet = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;
    const { amount } = req.body;

    const getUser = await authModel.findById(userID);
    if (getUser) {
      const ID = crypto.randomBytes(3).toString("hex");

      await authModel.findByIdAndUpdate(
        userID,
        {
          wallet: getUser?.wallet + parseInt(amount),
        },
        { new: true }
      );

      const credit: any = await transactionModel.create({
        transactionID: ID,
        amount,
        status: "credit",
        sentBy: "self",
        sentTo: "self",
        balance: getUser?.wallet + parseInt(amount),
        user: getUser?._id,
      });

      getUser?.transactionHistory.push(new Types.ObjectId(credit._id));
      getUser?.save();

      return res.status(201).json({
        message: "User account credited successfully",
        data: credit,
        status: 201,
      });
    } else {
      return res.status(404).json({ error: "user not found", status: 404 });
    }
  } catch (error) {
    return res.status(404).json({ error: error, status: 404 });
  }
};

export const fundTransfer = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;
    const { accNumber, amount, description } = req.body;

    const getUser: any = await authModel.findById(userID);

    const getWhomUser: any = await authModel.findOne({ accNumber });

    if (getUser) {
      const ID = crypto.randomBytes(3).toString("hex");
      if (getUser?.wallet > amount) {
        await authModel.findByIdAndUpdate(
          userID,
          {
            wallet: getUser?.wallet - parseInt(amount),
          },
          { new: true }
        );

        await authModel.findByIdAndUpdate(
          getWhomUser?._id,
          {
            wallet: getWhomUser?.wallet + parseInt(amount),
          },
          { new: true }
        );

        const debit: any = await transactionModel.create({
          transactionID: ID,
          amount,
          status: "debit",
          sentBy: `${
            getUser?.lastName
              ? `${getUser?.lastName} ${getUser?.firstName}`
              : `${getUser?.email}`
          }`,
          sentTo: `${
            getWhomUser?.lastName
              ? `${getWhomUser?.lastName} ${getWhomUser?.firstName}`
              : `${getWhomUser?.email}`
          }`,
          description,
          balance: getUser?.wallet - parseInt(amount),
          user: getUser?._id,
        });

        const credit: any = await transactionModel.create({
          transactionID: ID,
          amount,
          status: "credit",
          sentTo: `${
            getUser?.lastName
              ? `${getUser?.lastName} ${getUser?.firstName}`
              : `${getUser?.email}`
          }`,
          sentBy: `${
            getWhomUser?.lastName
              ? `${getWhomUser?.lastName} ${getWhomUser?.firstName}`
              : `${getWhomUser?.email}`
          }`,
          description,
          balance: getUser?.wallet + parseInt(amount),
          user: getUser?._id,
        });

        getUser?.transactionHistory.push(new Types.ObjectId(debit._id));
        getUser?.save();

        getWhomUser?.transactionHistory.push(new Types.ObjectId(credit._id));
        getWhomUser?.save();

        return res.status(201).json({
          message: "amount credit to account successfully",
          data: debit,
          status: 201,
        });
      } else {
        return res
          .status(404)
          .json({ error: "insufficient Funds", status: 404 });
      }
    } else {
      return res.status(404).json({ error: "user not found", status: 404 });
    }
  } catch (error) {
    return res.status(404).json({ error: error, status: 404 });
  }
};

export const viewTransactionHistory = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;

    const history = await authModel.findById(userID).populate({
      path: "transactionHistory",
      options: {
        sort: {
          createdAt: -1,
        },
      },
    });

    return res.status(200).json({
      message: "history found successfully",
      data: history,
      status: 200,
    });
  } catch (error) {
    return res.status(404).json({ error: error, status: 404 });
  }
};
