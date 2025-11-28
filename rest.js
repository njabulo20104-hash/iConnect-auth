import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth,
    confirmPasswordReset,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCDGnvIzzPBXBlA2R7EnoNJBqn6dtnOjIE",
    authDomain: "iconnect-54a24.firebaseapp.com",
    projectId: "iconnect-54a24",
    storageBucket: "iconnect-54a24.firebasestorage.app",
    messagingSenderId: "511444033288",
    appId: "1:511444033288:web:bf41ff65fc4f32772256bd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const resetForm = document.getElementById('reset-password-form');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');

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

function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (isLoading) {
        btnText.textContent = 'Resetting...';
        btnLoader.style.display = 'block';
        button.disabled = true;
    } else {
        btnText.textContent = 'Reset Password';
        btnLoader.style.display = 'none';
        button.disabled = false;
    }
}

function showSuccessModal(email) {
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
            <h3 style="color: var(--success); margin-bottom: 15px;">✅ Password Reset Successful!</h3>
            <p style="margin-bottom: 10px;">Logged in as ${email}</p>
            <p style="margin-bottom: 20px; font-size: 0.9rem; color: var(--text-secondary);">
                Click OK to continue to login
            </p>
            <button style="
                background: var(--primary);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
            ">OK</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const submitBtn = resetForm.querySelector('.submit-btn');
    
    clearError(newPasswordInput);
    clearError(confirmPasswordInput);
    
    if (newPassword.length < 6) {
        showError(newPasswordInput, "Password must be at least 6 characters");
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError(confirmPasswordInput, "Passwords do not match");
        return;
    }

    const resetCode = sessionStorage.getItem('resetCode');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (!resetCode || !userEmail) {
        showError(newPasswordInput, "Session expired. Please start over.");
        return;
    }

    setLoading(submitBtn, true);

    try {
        await confirmPasswordReset(auth, resetCode, newPassword);
        console.log("Password reset successful for:", userEmail);
        
        // Auto-login with new password
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, newPassword);
        console.log("Auto-login successful");
        
        // Show success modal (no auto-redirect)
        const modal = showSuccessModal(userEmail);
        
        // Add click handler to redirect to login
        setTimeout(() => {
            const okButton = modal.querySelector('button');
            okButton.onclick = () => {
                modal.remove();
                window.location.href = 'login.html';
            };
        }, 100);
        
        // Clean up session storage
        sessionStorage.removeItem('resetCode');
        sessionStorage.removeItem('userEmail');
        
    } catch (error) {
        console.error(" Password reset failed:", error);
        setLoading(submitBtn, false);
        
        switch (error.code) {
            case 'auth/weak-password':
                showError(newPasswordInput, "Password is too weak");
                break;
            case 'auth/expired-action-code':
                showError(newPasswordInput, "Reset session expired. Please start over.");
                break;
            default:
                showError(newPasswordInput, "Password reset failed. Please try again.");
        }
    }
});

// Real-time password confirmation check
confirmPasswordInput.addEventListener('input', () => {
    clearError(confirmPasswordInput);
    if (newPasswordInput.value !== confirmPasswordInput.value && confirmPasswordInput.value.length > 0) {
        showError(confirmPasswordInput, "Passwords do not match");
    }
});