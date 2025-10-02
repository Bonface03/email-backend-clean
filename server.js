const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sgMail = require("@sendgrid/mail");

const app = express();
const PORT = process.env.PORT || 3000;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(bodyParser.json());

app.post("/send-email", async (req, res) => {
  const { email, subject, htmlBody } = req.body;

  const msg = {
    to: email,
    from: "mrbonface.02@gmail.com", // Replace with your verified sender
    subject,
    html: htmlBody,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ success: true, message: "Email sent!" });
  } catch (error) {
    console.error("SendGrid error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Email backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

