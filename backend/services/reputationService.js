const User = require('../models/User');
const Review = require('../models/Review');

/**
 * Recalculate and update a user's reputation score.
 * reputation = (avgRating × 0.6) + (completedTasks × 0.3) + (responseRate × 0.1)
 */
exports.updateReputation = async (userId) => {
  const reviews = await Review.find({ targetUser: userId });

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const user = await User.findById(userId);
  if (!user) return;

  user.avgRating = parseFloat(avgRating.toFixed(2));
  user.reputationScore = parseFloat(
    (avgRating * 0.6 + user.completedTasks * 0.3 + user.responseRate * 0.1).toFixed(2)
  );

  await user.save();
  return user.reputationScore;
};
