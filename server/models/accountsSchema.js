const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  account_id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const AccountSchema = new mongoose.Schema({
  clerk_id: {
    type: String,
    required: true
  },
  account_ids: {
    type: [String],
    required: true
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }]
});

module.exports = {
  Account: mongoose.model('Account', AccountSchema),
  Transaction: mongoose.model('Transaction', TransactionSchema),
};