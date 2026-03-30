const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sgMail = require("@sendgrid/mail");
const cron = require("node-cron");
const admin = require("firebase-admin");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Firebase Admin SDK setup
// Make sure you have your Firebase service account key JSON file
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

app.use(cors());
app.use(bodyParser.json());

// ✅ API endpoint for manual email sending
app.post("/send-email", async (req, res) => {
  const { email, subject, htmlBody } = req.body;

  const msg = {
    to: email,
    from: "mrbonface02@gmail.com", // Replace with your verified sender
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

// ✅ CRON JOB — runs every day at 8 AM (Africa/Harare time)
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running daily service reminder job...");

  const recipients = [
    "service@utanoafrica.com",
    "learnmorebmusikiri@gmail.com",
    "service1@utanoafrica.com",
  ];

  try {
    const today = new Date();
    const snapshot = await db.collection("equipment").get();

    snapshot.forEach(async (doc) => {
      const data = doc.data();
      if (!data.nextServiceDate) return;

      const nextService = new Date(data.nextServiceDate);
      nextService.setHours(0, 0, 0, 0);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const daysLeft = Math.round((nextService - todayStart) / (1000 * 60 * 60 * 24));

      // Send reminders exactly on these specific intervals to prevent consecutive day spam
      const reminderIntervals = [60, 30, 14, 7, 3, 1, 0];
      const overdueIntervals = [-1, -3, -7, -14, -30, -60];

      // Helper function to dispatch to all recipients
      const notifyRecipients = async (subject, htmlBody) => {
        for (const email of recipients) {
          const msg = {
            to: email,
            from: "mrbonface02@gmail.com",
            subject,
            html: htmlBody,
          };
          try {
            await sgMail.send(msg);
            console.log(`✅ Alert sent to ${email} for ${data.name}`);
          } catch (error) {
            console.error(`❌ Error sending to ${email}:`, error.message);
          }
        }
      };

      if (reminderIntervals.includes(daysLeft)) {
        const subject = `Reminder: Service for ${data.name}`;
        const htmlBody = `<p>Hey Leigh-Anne, your Equipment <strong>${data.name}</strong> is due for service on <strong>${data.nextServiceDate}</strong>.</p>`;
        await notifyRecipients(subject, htmlBody);
        
      } else if (overdueIntervals.includes(daysLeft)) {
        const subject = `🚨 OVERDUE: Service for ${data.name}`;
        const htmlBody = `
          <h2 style="color: #E53935;">⚠️ URGENT ACTION REQUIRED</h2>
          <p>Hey Leigh-Anne,</p>
          <p>The equipment <strong>${data.name}</strong> was due for service on <strong>${data.nextServiceDate}</strong>.</p>
          <p>It is currently <strong style="color: #E53935;">${Math.abs(daysLeft)} days OVERDUE</strong> for maintenance.</p>
          <p>Please service the equipment immediately and update the system schedule.</p>
        `;
        await notifyRecipients(subject, htmlBody);
      }
    });

    console.log("✅ Daily reminder job completed.");
  } catch (err) {
    console.error("🔥 Error running reminder job:", err);
  }
}, {
  timezone: "Africa/Harare",
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
