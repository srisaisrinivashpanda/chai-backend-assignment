import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { count } from "console";
import { channel } from "diagnostics_channel";
import { lookup } from "dns";
import { pipeline } from "stream";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  //More optimized version
  //since A doesnt depend on B and vice vers
  const ownerId = new mongoose.Types.ObjectId(req.user._id);

  const [videoStats, totalSubscribers] = await Promise.all([
    Video.aggregate([
      {
        $match: {
          owner: ownerId,
        },
      },
      {
        $lookup: {
          from: "likes",

          //Variable that stores the current video's _id
          let: {
            videoId: "$_id",
          },

          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$video", "$$videoId"], // likes.video == video._id
                },
              },
            },
            {
              $count: "totalLikes", //total like of that video
            },
          ],

          as: "likesAggregate",
        },
      },
      {
        $addFields: {
          likesCount: {
            $ifNull: [
              {
                $first: "$likesAggregate.totalLikes",
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          likesAggregate: 0,
        },
      },
      {
        $group: {
          _id: null,

          totalViews: {
            $sum: "$views",
          },

          totalVideos: {
            $sum: 1,
          },

          totalLikes: {
            $sum: "$likesCount",
          },
        },
      },
    ]),
    Subscription.countDocuments({
      channel: ownerId,
    }),
  ]);

  const stats = videoStats[0] || {
    totalViews: 0,
    totalVideos: 0,
    totalLikes: 0,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...stats,
        totalSubscribers,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const channelVideos = await Video.find({
    owner: req.user._id,
  })
    .select("title thumbnail views createdAt isPublished")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return res
    .status(200)
    .json(new ApiResponse(200, channelVideos, "Videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
