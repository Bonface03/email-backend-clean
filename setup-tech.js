const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "equipmentserviceapp-31e43"
});
const db = admin.firestore();

async function createTech() {
  const email = "technician@user.com";
  const password = "TechPassword123!";
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true,
    });
    console.log("Successfully created new user:", userRecord.uid);
    
    // Set role to technician in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      email: email,
      role: "technician"
    });
    console.log("Successfully set user role to technician in Firestore!");
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log("User already exists. Attempting to update password and role...");
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, { password: password });
        await db.collection("users").doc(user.uid).set({ email, role: "technician" });
        console.log("User updated successfully.");
        process.exit(0);
      } catch (innerError) {
        console.error("Update failed:", innerError);
      }
    } else {
      console.error("Error creating new user:", error);
    }
    process.exit(1);
  }
}

createTech();
