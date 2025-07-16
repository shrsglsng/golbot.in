import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../utils/errors.js";
import ItemModel from "../models/itemModel.js";
import reportIssueModel from "../models/reportIssueModel.js";

export const updateItem = async (req, res) => {
  const { id, name, desc, imgUrl, price, gst } = req.body;

  if (!id) throw new BadRequestError("Enter all fields");

  await ItemModel.updateOne({ id }, { name, desc, imgUrl, price, gst });

  res.status(StatusCodes.OK).json({ result: "success" });
};

export const getReportIssues = async (req, res) => {
  const { oid, phone, reportedDate, machineId } = req.query;

  const queryObject = {};

  if (oid) queryObject.oid = mongoose.Types.ObjectId(oid);
  if (machineId) queryObject.machineId = { $regex: machineId, $options: "i" };
  if (reportedDate) {
    queryObject.createdAt = {
      $gte: new Date(`${reportedDate}T00:00:00.000Z`),
      $lte: new Date(`${reportedDate}T23:59:59.999Z`),
    };
  }

  if (oid && oid.length !== 24 && oid.length !== 0)
    throw new BadRequestError("Invalid Order ID");

  // pagination
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const issues = await reportIssueModel.aggregate([
    {
      $lookup: {
        from: "users", // The name of the User collection
        localField: "uid", // The field in the Post model that references User model
        foreignField: "_id", // The field in the User model to match against
        as: "userData", // The name of the field to populate with User data
      },
    },
    { $skip: skip },
    { $limit: limit },
    { $sort: { createdAt: -1 } },
    {
      $match: {
        ...queryObject,
        "userData.phone": { $regex: phone || "", $options: "i" },
      },
    },
    {
      $project: {
        _id: 0,
        oid: "$oid",
        phone: { $first: "$userData.phone" },
        machineId: 1,
        description: 1,
        imgUrl: 1,
        reportedDate: "$createdAt",
      },
    },
  ]);

  res.status(StatusCodes.OK).json({ result: { issues } });
};
