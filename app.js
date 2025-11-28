import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCDGnvIzzPBXBlA2R7EnoNJBqn6dtnOjIE",
  authDomain: "iconnect-54a24.firebaseapp.com",
  projectId: "iconnect-54a24",
  storageBucket: "iconnect-54a24.firebasestorage.app",
  messagingSenderId: "511444033288",
  appId: "1:511444033288:web:bf41ff65fc4f32772256bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const toggleToSignup = document.getElementById("toggle-to-signup");
const googleLoginBtn = document.getElementById("google-login");
const githubLoginBtn = document.getElementById("github-login");
const forgotPasswordLink = document.querySelector(".forgot-password");

// Form Toggle
toggleToSignup.addEventListener("click", (e) => {
  e.preventDefault();
  toggleForms();
});

function toggleForms() {
  const isLoginActive = loginForm.classList.contains("active");
  
  if (isLoginActive) {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
    toggleToSignup.textContent = "Sign in to your account";
    document.querySelector(".form-header h2").textContent = "Create your account";
    document.querySelector(".form-header p").innerHTML = 'Already have an account? <a href="#" id="toggle-to-signup">Sign in</a>';
  } else {
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
    toggleToSignup.textContent = "Create an account";
    document.querySelector(".form-header h2").textContent = "Sign in to iConnect";
    document.querySelector(".form-header p").innerHTML = 'New user? <a href="#" id="toggle-to-signup">Create an account</a>';
  }
  
  document.getElementById("toggle-to-signup").addEventListener("click", (e) => {
    e.preventDefault();
    toggleForms();
  });
}

// Utility Functions
function showError(input, message) {
  const inputGroup = input.parentElement;
  const errorElement = inputGroup.querySelector('.error-message');
  input.classList.add('error');
  errorElement.textContent = message;
}

function clearError(input) {
  const inputGroup = input.parentElement;
  const errorElement = inputGroup.querySelector('.error-message');
  input.classList.remove('error');
  errorElement.textContent = '';
}

function showModal(message, type = 'success') {
  const modal = document.createElement('div');
  modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
  `;
  
  modal.innerHTML = `
      <div style="
          background: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          max-width: 400px;
          width: 90%;
      ">
          <h3 style="color: ${type === 'success' ? 'var(--success)' : 'var(--error)'}; margin-bottom: 15px;">
              ${type === 'success' ? 'Success' : 'Error'}
          </h3>
          <p style="margin-bottom: 20px;">${message}</p>
          <button onclick="this.closest('.modal').remove()" style="
              background: var(--primary);
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
          ">OK</button>
      </div>
  `;
  
  modal.className = 'modal';
  document.body.appendChild(modal);
}

function setLoading(button, isLoading) {
  const btnText = button.querySelector('.btn-text');
  const btnLoader = button.querySelector('.btn-loader');
  
  if (isLoading) {
    btnText.textContent = 'Loading...';
    btnLoader.style.display = 'block';
    button.disabled = true;
  } else {
    btnText.textContent = button.closest('form').id === 'login-form' ? 'Sign in' : 'Create account';
    btnLoader.style.display = 'none';
    button.disabled = false;
  }
}

// Resend Email Verification Function
async function sendVerificationEmail(user, userName) {
  try {
    // Generate a unique verification token (you can use Firebase ID token)
    const idToken = await user.getIdToken();
    
    // Create verification link - you'll need to set up an API endpoint
    const verificationLink = `https://your-backend-domain.com/api/verify-email?token=${idToken}&uid=${user.uid}`;
    
    // Send email via Resend API
    const response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        userName: userName,
        verificationLink: verificationLink
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send verification email');
    }

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

// Enhanced Signup with Resend Email Verification
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const name = document.getElementById("signup-name").value;
  const submitBtn = signupForm.querySelector('.submit-btn');
  
  clearError(document.getElementById("signup-name"));
  clearError(document.getElementById("signup-email"));
  clearError(document.getElementById("signup-password"));
  
  if (!name || !email || !password) {
    showError(document.getElementById("signup-name"), "Please fill in all fields");
    return;
  }
  
  if (password.length < 6) {
    showError(document.getElementById("signup-password"), "Password must be at least 6 characters");
    return;
  }

  setLoading(submitBtn, true);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, {
      displayName: name
    });
    
    // Create user profile in Firestore (initially unverified)
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      createdAt: new Date(),
      lastLogin: new Date(),
      authProvider: 'email',
      emailVerified: false
    });
    
    console.log("Signup successful:", user.email);
    
    // Send verification email via Resend
    await sendVerificationEmail(user, name);
    
    submitBtn.style.background = 'var(--success)';
    
    setTimeout(() => {
      setLoading(submitBtn, false);
      submitBtn.style.background = '';
      signupForm.reset();
      showModal(`Verification email sent to ${email}. Please check your inbox and click the verification link to activate your account.`);
      toggleForms(); // Switch back to login
    }, 1500);
    
  } catch (err) {
    console.error("Signup error:", err);
    setLoading(submitBtn, false);
    
    switch (err.code) {
      case 'auth/email-already-in-use':
        showError(document.getElementById("signup-email"), "An account with this email already exists");
        break;
      case 'auth/invalid-email':
        showError(document.getElementById("signup-email"), "Invalid email address");
        break;
      case 'auth/weak-password':
        showError(document.getElementById("signup-password"), "Password is too weak. Use at least 6 characters");
        break;
      case 'auth/operation-not-allowed':
        showError(document.getElementById("signup-email"), "Email/password accounts are not enabled");
        break;
      default:
        showError(document.getElementById("signup-email"), "Signup failed. Please try again");
    }
  }
});

// Enhanced Login - Require email verification
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const submitBtn = loginForm.querySelector('.submit-btn');
  
  clearError(document.getElementById("login-email"));
  clearError(document.getElementById("login-password"));
  
  if (!email || !password) {
    showError(document.getElementById("login-email"), "Please fill in all fields");
    return;
  }

  setLoading(submitBtn, true);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if email is verified by checking Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    
    if (userData && !userData.emailVerified) {
      setLoading(submitBtn, false);
      showModal("Please verify your email address before signing in. Check your inbox for the verification link.", 'error');
      return;
    }
    
    console.log("Login successful:", user.email);
    
    submitBtn.style.background = 'var(--success)';
    showModal(`Welcome back, ${user.displayName || user.email}! You are now logged in.`);
    
    setTimeout(() => {
      setLoading(submitBtn, false);
      submitBtn.style.background = '';
    }, 2000);
    
  } catch (err) {
    console.error("Login error:", err);
    setLoading(submitBtn, false);
    
    switch (err.code) {
      case 'auth/invalid-email':
        showError(document.getElementById("login-email"), "Invalid email address");
        break;
      case 'auth/user-not-found':
        showError(document.getElementById("login-email"), "No account found with this email");
        break;
      case 'auth/wrong-password':
        showError(document.getElementById("login-password"), "Incorrect password");
        break;
      case 'auth/too-many-requests':
        showError(document.getElementById("login-email"), "Too many attempts. Account temporarily disabled");
        break;
      case 'auth/user-disabled':
        showError(document.getElementById("login-email"), "This account has been disabled");
        break;
      default:
        showError(document.getElementById("login-email"), "Login failed. Please try again");
    }
  }
});

// Forgot Password Handler
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    
    if (!email) {
      showError(document.getElementById("login-email"), "Please enter your email address to reset password");
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      showModal(`Password reset email sent to ${email}. Check your inbox for the 6-digit code.`);
      
      // Add click handler to redirect to code verification
      setTimeout(() => {
        const modal = document.querySelector('.modal');
        if (modal) {
          const okButton = modal.querySelector('button');
          okButton.onclick = () => {
            modal.remove();
            window.location.href = 'code-verification.html';
          };
        }
      }, 100);
      
    } catch (error) {
      console.error("Password reset error:", error);
      let errorMessage = "Failed to send reset email";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many attempts. Please try again later";
          break;
      }
      
      showError(document.getElementById("login-email"), errorMessage);
    }
  });
}

// Social Login Functions
async function handleSocialLogin(provider, providerName) {
  try {
    console.log(`Starting ${providerName} login...`);
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    console.log(`${providerName} login successful:`, user.email);
    
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || `User-${user.uid.slice(0, 8)}`,
        email: user.email,
        profilePicture: user.photoURL || '',
        createdAt: new Date(),
        lastLogin: new Date(),
        authProvider: providerName,
        emailVerified: true // Social logins are automatically verified
      });
      console.log("New user profile created");
    } else {
      await setDoc(userRef, { 
        lastLogin: new Date(),
        emailVerified: true 
      }, { merge: true });
    }
    
    showModal(`Welcome to iConnect, ${user.displayName || user.email}!`);
    
  } catch (error) {
    console.error(`${providerName} login failed:`, error);
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        console.log('Login popup was closed by user');
        break;
      case 'auth/popup-blocked':
        showModal('Popup was blocked by browser. Please allow popups for this site.', 'error');
        break;
      case 'auth/unauthorized-domain':
        showModal('This domain is not authorized for social login. Please check Firebase configuration.', 'error');
        break;
      case 'auth/operation-not-allowed':
        showModal('Social login is not enabled. Please check Firebase Auth settings.', 'error');
        break;
      case 'auth/network-request-failed':
        showModal('Network error. Please check your connection and try again.', 'error');
        break;
      default:
        showModal(`${providerName} login failed. Please try again. Error: ${error.message}`, 'error');
    }
  }
}

// Google Login
googleLoginBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  await handleSocialLogin(provider, 'Google');
});

// GitHub Login
githubLoginBtn.addEventListener("click", async () => {
  const provider = new GithubAuthProvider();
  provider.addScope('user:email');
  await handleSocialLogin(provider, 'GitHub');
});

// Handle email verification success (when user clicks verification link)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Check if this is a new verification (you might want to add additional logic)
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && !userDoc.data().emailVerified) {
      // Update Firestore to mark email as verified
      await setDoc(doc(db, "users", user.uid), {
        emailVerified: true,
        lastLogin: new Date()
      }, { merge: true });
      
      console.log("Email verification completed for:", user.email);
    }
  }
});

// Input validation listeners
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', () => {
    clearError(input);
  });
});

// Enter key support
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const form = input.closest('form');
      if (form) {
        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
        }
      }
    }
  });
});

console.log("iConnect Enhanced Auth System Initialized");