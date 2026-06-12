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

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  //Since all of them uses video combine them
  /*   const viewsStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: "$views",
        },
      },
    },
  ]);

  const totalViews = viewsStats[0]?.totalViews || 0; */

  /*   const totalVideos = await Video.countDocuments({
    owner: req.user._id,
  }); */

  /*   const totalLikes = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: "$likesCount",
        },
      },
    },
  ]); */

  const channelStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
      },
    },
    {
      $project: {
        views: 1,
        likesCount: 1,
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
  ]);

  const stats = channelStats[0] || {};

  const totalViews = stats.totalViews || 0;
  const totalVideos = stats.totalVideos || 0;
  const totalLikes = stats.totalLikes || 0;

  //Use aggregate for multiple stages this ao works but mehh

  // const subscribersStats = await Subscription.aggregate([
  //   {
  //     $match: {
  //       channel: new mongoose.Types.ObjectId(req.user._id),
  //     },
  //   },
  //   {
  //     $count: "totalSubscribers",
  //   },
  // ]);

  const totalSubscribers = await Subscription.countDocuments({
    channel: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalViews, totalVideos, totalSubscribers, totalLikes },
        "Channel stats fetched successfully"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
});

export { getChannelStats, getChannelVideos };
