import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { View } from "../models/views.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Post } from "../models/post.model.js";
import { Challenge } from "../models/challenge.model.js";

const handleViewEvent = asyncHandler(async (req, res) => {
  const { id, contentType } = req.params;
  // id here is the id of the challenge or post for which we want to record a view.

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "user id is required");
  }
  const onModel = contentType === "Post" ? "Post" : "Challenge"; //if error occurs come here

  //check if the user already viewed the post
  const alreadyViewed = await View.findOne({
    viewer: userId,
    target: id, //target mean post or challenge
    onModel,
  });

  if (!alreadyViewed) {
    const newView = new View({
      viewer: userId,
      target: id,
      onModel,
    });

    await newView.save();

    //checking which view contentType we get from use
    const Model = contentType === "Post" ? Post : Challenge;

    await Model.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    return res.status(200).json(new ApiResponse(200, "view recorded"));
  } else {
    return res.status(200).json(new ApiResponse(200, "view already recorded"));
  }
});

//get all views count of a post or challenge

const getViewCount = asyncHandler(async (req, res) => {
  const { contentType, id } = req.params;
  // id here is the id of the challenge or post for which we want to record a view.
  let viewCount;
  if (contentType === "Post") {
    const post = await Post.findById(id).select("viewCount");

    if (!post) throw new ApiError(404, "Post not found");
    viewCount = post.viewCount;
  } else if (contentType === "Challenge") {
    const challenge = await Challenge.findById(id).select("viewCount");
    if (!challenge) throw new ApiError(404, "Post not found");
  } else {
    throw new ApiError(400, "Invalid content type");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { viewCount }, "views fetch successfully"));
});

export { handleViewEvent, getViewCount };
