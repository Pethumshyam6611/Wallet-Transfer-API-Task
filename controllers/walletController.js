const mongoose = require('mongoose');

const Transaction = require('../models/Transaction');
const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        balance: req.user.balance,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile',
    });
  }
};

const transfer = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { receiverId, amount } = req.body;
    const senderId = req.user._id;
    const transferAmount = Number(amount);

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid receiverId is required',
      });
    }

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    if (senderId.equals(receiverId)) {
      return res.status(400).json({
        success: false,
        message: 'Sender and receiver cannot be the same user',
      });
    }

    let transactionRecord;
    let senderBalance;

    await session.withTransaction(async () => {
      const receiver = await User.findById(receiverId).session(session);

      if (!receiver) {
        const error = new Error('Receiver does not exist');
        error.statusCode = 404;
        throw error;
      }

      const senderUpdate = await User.findOneAndUpdate(
        {
          _id: senderId,
          balance: { $gte: transferAmount },
        },
        {
          $inc: { balance: -transferAmount },
        },
        {
          new: true,
          session,
        }
      );

      if (!senderUpdate) {
        const error = new Error('Insufficient balance');
        error.statusCode = 400;
        throw error;
      }

      await User.updateOne(
        { _id: receiverId },
        { $inc: { balance: transferAmount } },
        { session }
      );

      const [createdTransaction] = await Transaction.create(
        [
          {
            senderId,
            receiverId,
            amount: transferAmount,
          },
        ],
        { session }
      );

      transactionRecord = createdTransaction;
      senderBalance = senderUpdate.balance;
    });

    return res.status(200).json({
      success: true,
      message: 'Transfer completed successfully',
      transaction: transactionRecord,
      balance: senderBalance,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Transfer failed',
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getProfile,
  transfer,
};

const getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    })
    .sort({ createdAt: -1 }) 
    .populate('senderId', 'name email') 
    .populate('receiverId', 'name email');

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transactions'
    });
  }
};

module.exports = {
  getProfile,
  transfer,
  getTransactions, 
};