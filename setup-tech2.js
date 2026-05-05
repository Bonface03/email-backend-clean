const apiKey = "AIzaSyABUZ00nHSbhp0FA4WQ_plnb3sXHfhSoZQ";
const projectId = "equipmentserviceapp-31e43";
const email = "technician@user.com";
const password = "TechPassword123!";

async function provision() {
  try {
    // 1. Create User via REST API
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const authData = await authRes.json();
    
    if (authData.error) {
      if (authData.error.message === 'EMAIL_EXISTS') {
        console.log("Technician user already exists!");
        // We could authenticate to get idToken and do further things, but if it exists, it's fine.
        return;
      }
      throw new Error(authData.error.message);
    }
    
    const localId = authData.localId;
    console.log("Successfully created user with ID:", localId);

    // 2. Set Firestore rule using the generated secure token
    // Actually, setting Firestore directly via REST without admin privileges or user token is subject to security rules.
    // Assuming the user's token has write access to their own 'users' doc.
    const idToken = authData.idToken;
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${localId}`;
    
    const fsRes = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        fields: {
          email: { stringValue: email },
          role: { stringValue: "technician" }
        }
      })
    });
    
    const fsData = await fsRes.json();
    if (fsData.error) throw new Error(fsData.error.message);
    
    console.log("Successfully set technician role in Firestore!");
    
  } catch (err) {
    console.error("Provisioning failed:", err.message);
  }
}

provision();
