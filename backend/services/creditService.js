const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Reserve credits from requester when creating a request.
 */
exports.reserveCredits = async (userId, amount, session) => {
  const opts = session ? { session } : {};
  const user = await User.findById(userId).session(session || null);
  if (!user) throw new Error('User not found');
  if (user.skillCreditBalance < amount) throw new Error('Insufficient credits');

  user.skillCreditBalance -= amount;
  await user.save(opts);

  await Transaction.create([{
    fromUser: userId,
    toUser: userId,
    credits: amount,
    type: 'reserve',
    note: 'Credits reserved for request',
  }], opts);
};

/**
 * Release reserved credits back to requester (on cancel).
 */
exports.releaseCredits = async (userId, amount, session) => {
  const opts = session ? { session } : {};
  const user = await User.findById(userId).session(session || null);
  if (!user) throw new Error('User not found');

  user.skillCreditBalance += amount;
  await user.save(opts);

  await Transaction.create([{
    fromUser: userId,
    toUser: userId,
    credits: amount,
    type: 'release',
    note: 'Reserved credits released',
  }], opts);
};

/**
 * Match a request's escrow to the accepted agreement amount.
 */
exports.adjustReservedCredits = async (userId, currentAmount, targetAmount, session) => {
  const current = Number(currentAmount) || 0;
  const target = Number(targetAmount) || 0;

  if (target > current) {
    await exports.reserveCredits(userId, target - current, session);
  } else if (current > target) {
    await exports.releaseCredits(userId, current - target, session);
  }
};

/**
 * Transfer credits from requester to provider on completion.
 * Credits were already reserved (deducted from requester), just credit the provider.
 */
exports.transferCredits = async (fromUserId, toUserId, amount, agreementId, session) => {
  const opts = session ? { session } : {};
  const toUser = await User.findById(toUserId).session(session || null);
  if (!toUser) throw new Error('Provider not found');

  toUser.skillCreditBalance += amount;
  await toUser.save(opts);

  await Transaction.create([{
    fromUser: fromUserId,
    toUser: toUserId,
    credits: amount,
    type: 'transfer',
    agreement: agreementId,
    note: 'Payment for completed task',
  }], opts);
};

/**
 * Run operation — uses MongoDB session/transaction if replica set is available,
 * otherwise falls back to running without a transaction (safe for single-node dev).
 */
exports.withSession = async (fn) => {
  const mongoose = require('mongoose');
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    // If error is because replica set isn't available, retry without session
    if (session && err.message && (
      err.message.includes('Transaction numbers') ||
      err.message.includes('replica set') ||
      err.message.includes('not a primary') ||
      err.codeName === 'IllegalOperation'
    )) {
      try { await session.abortTransaction(); } catch (_) {}
      session.endSession();
      // Retry without transaction
      return await fn(null);
    }
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
    }
    throw err;
  } finally {
    if (session) session.endSession();
  }
};
