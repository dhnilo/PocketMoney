const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const mongoose = require("mongoose");
const User = require("./models/userSchema");
const { Accounts, Account, Transaction } = require("./models/accountsSchema");

const MONGO_URI = "mongodb+srv://dhnilodev:RoccoH23@pocketmoney.wq8p0jd.mongodb.net/?retryWrites=true&w=majority&appName=pocketMoney";

const connectDB = async () => { 
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
connectDB();

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": "65f365cc93aa04001bf53f76",
      "PLAID-SECRET": "53c75855c83ef5c5fd27fe32f9443f",
    },
  },
});

const plaidClient = new PlaidApi(configuration);

const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const date = new Date();


const app = express();
app.use(cors());
app.use(bodyParser.json({limit : "50mb"}));
app.use(bodyParser.urlencoded({limit : "50mb", extended: true}));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json("Something broke!");
});

app.post('/store_user_data', async (req, res) => {
  const { clerk_id, access_token, items } = req.body;

  const user = new User({
    clerk_id,
    access_token,
    items,
  });

  try {
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post('/update_user_data', async (req, res) => {
  const { clerk_id, access_token, items } = req.body;

  // Check if clerk_id is null
  if (clerk_id === null) {
    return res.status(400).send({ message: 'clerk_id cannot be null' });
  }

  try {
    let user = await User.findOne({ clerk_id });

    if (!user) {
      user = new User({
        clerk_id: clerk_id,
        access_token: access_token,
        items: items,
      });
      console.log('New user created:', user);
    } else {
      user.access_token.push(access_token);
      user.items.push(items);
    }
    await user.save();

    res.status(200).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});


app.post('/store_transactions', async (req, res) => {
  const { accounts, transactions } = req.body;
  const clerk_id = req.body.clerk_id;

  try {
    // Find or create the Clerk document
    let clerk = await Account.findOne({ clerk_id });
    if (!clerk) {
      clerk = new Account({ clerk_id, account_ids: [], transactions: [] });
    }
  
    await Promise.all(accounts.map(async account => {
      // Skip if the account_id already exists
      if (clerk.account_ids.includes(account.account_id)) {
        return;
      }
  
      const accountTransactions = transactions.filter(transaction => transaction.account_id === account.account_id);
  
      const transactionDocuments = await Promise.all(accountTransactions.map(async transaction => {
        // Check if a transaction with the same id already exists
        let existingTransaction = await Transaction.findOne({ id: transaction.id });
      
        if (existingTransaction) {
          // If the transaction already exists, return the existing transaction
          return existingTransaction;
        } else {
          // If the transaction does not exist, create a new one
          const newTransaction = new Transaction(transaction);
          const savedTransaction = await newTransaction.save();
          return savedTransaction;
        }
      }));
  
      clerk.account_ids.push(account.account_id);
      clerk.transactions.push(...transactionDocuments.map(transaction => transaction._id));
    }));
  
    await clerk.save();
  
    res.status(200).send(clerk);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.post('/get_transactions', async (req, res) => {
  const { clerk_id } = req.body;

  try {
    const data = await Account.findOne({ clerk_id }).populate('transactions');
    res.status(200).send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.post('/check_clerk_id', async (req, res) => {
  const { clerk_id } = req.body;
  try {
    const user = await User.findOne({ clerk_id });
    if (user) {
      res.json({ exists: true, user });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post("/create_link_token", async function (request, response) {
  const plaidRequest = {
    user: {
      client_user_id: "user",
    },
    client_name: "Pocket Money",
    products: ["auth"],
    language: "en",
    redirect_uri: "http://localhost:8081/",
    country_codes: ["US"],
  };
  try {
    const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
    response.json(createTokenResponse.data);
  } catch (error) {
    console.log(error);
    response.status(500).send("failure");
    // handle error
  }
});

app.post("/auth", async function (request, response) {
  try {
    const access_token = request.body.access_token;
    const plaidRequest = {
      access_token: access_token,
    };
    const plaidResponse = await plaidClient.authGet(plaidRequest);
    response.json(plaidResponse.data);
  } catch (e) {
    response.status(500).send("failed");
  }
});

// Fetches balance data using the Node client library for Plaid
app.post("/get_balance", async function (request, response) {
  try {
    const access_token = request.body.access_token;
    const plaidRequest = {
      access_token: access_token,
    };

    const balanceResponse = await plaidClient.accountsBalanceGet(plaidRequest);
    response.json(balanceResponse.data);
  } catch (error) {
    console.log(error);
    response.status(500).send("failure");
  }
});

app.post("/exchange_public_token", async function (request, response, next) {
  const publicToken = request.body.public_token;
  try {
    const plaidResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    // These values should be saved to a persistent database and
    // associated with the currently signed-in user
    const accessToken = plaidResponse.data.access_token;
    const itemId = plaidResponse.data.item_id;
    response.json({ accessToken, itemId });
  } catch (error) {
    response.status(500).send("failed");
  }
});

// Syncs transactions automatically when an account is created
app.post("/sync_transactions", async function (request, response) {
  try {
    const access_token = request.body.access_token;

    const plaidRequest = {
      access_token: access_token,
      count: 250,
    };

    const transactionsResponse = await plaidClient.transactionsSync(plaidRequest);
    response.json(transactionsResponse.data);
  } catch (error) {
    console.log(error);
    response.status(500).send("failed");
  }
});

app.listen(8000, () => {
  console.log("server has started");
});
