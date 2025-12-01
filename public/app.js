import { 
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import { auth } from "./firebase-config.js";

async function signUp(email, password) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Firebase sends the verification email automatically
    await sendEmailVerification(user);

    alert("Verification email sent! Check your inbox.");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}
