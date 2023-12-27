require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SK);
const endpointSecret = process.env.STRIPE_END_POINT_SK;

const cors = require("cors");
const express = require("express");
const User = require("./models/user");
const { default: mongoose } = require("mongoose");
const app = express();
const port = process.env.PORT || "3000";
const listen = () => {
  console.log(`listening on http://localhost:${port}`);
};

//dbURI
const dbURI = process.env.DB_URI;
const dbURIoptions = {};
//connection function
(async () => {
  await mongoose.connect(dbURI, dbURIoptions);
  console.log(`DB connected!`);

  app.listen(port, listen);
})();

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON data in incoming requests
app.use(express.json());

// Define your webhook endpoint (e.g., '/webhook')
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    console.log("line 76: ", req.body.type);

    //when a subscribtion success detect a customer and update DB
    if (req.body.type == "checkout.session.completed") {
      const { subscription, customer_details } = req.body.data.object;

      console.log(subscription, customer_details);

      await User.findOneAndUpdate(
        { email: customer_details.email },
        {
          "subscriptionInfo.subID": subscription,
          "subscriptionInfo.isSubscribed": true,
          "subscriptionInfo.lastSubscribed": new Date(),
        }
      );
    }

    //when a subscribtion canceled detect a customer and update DB
    if (req.body.type == "customer.subscription.updated") {
      const { object, previous_attributes } = req.body.data;
      const { id, cancellation_details } = object;
      const { cancellation_details: moreD } = previous_attributes;

      console.log(id, cancellation_details, moreD);

      let data = await User.findOne({ "subscriptionInfo.subID": id });
      if (data) {
        if (data.subscriptionInfo.isSubscribed) {
          await User.findOneAndUpdate(
            { "subscriptionInfo.subID": id },
            {
              "subscriptionInfo.subID": "",
              "subscriptionInfo.isSubscribed": false,
            }
          );
        }
      }
    }

    try {
      let event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the specific event type, such as 'checkout.session.completed'

    res.status(200).end();
  }
);

app.get("/info/:email", async (req, res) => {
  let { email } = req.params;

  let data = await User.findOne({ email });
  res.status(200).json(data);
});
app.get("/", (req, res) => {
  res.status(200).json({ done: 1 });
});
