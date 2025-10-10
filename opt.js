const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Twilio credentials (replace with yours)
const accountSid = "YOUR_TWILIO_SID";
const authToken = "YOUR_TWILIO_AUTH_TOKEN";
const client = twilio(accountSid, authToken);
const twilioPhone = "+1234567890"; // Your Twilio phone number

// Store OTP temporarily (use DB/Redis in production)
const otpStore = {};

// Send OTP
app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if(!phone) return res.json({ success: false, message: "Phone required" });

  const otp = Math.floor(100000 + Math.random() * 900000);

  try {
    await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: twilioPhone,
      to: "+91" + phone   // Change country code if needed
    });

    otpStore[phone] = otp;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "SMS failed" });
  }
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  if(otpStore[phone] && otpStore[phone] == otp){
    delete otpStore[phone];
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Invalid OTP" });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
