import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth,
    confirmPasswordReset,
    verifyPasswordResetCode
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

const verificationForm = document.getElementById('code-verification-form');
const codeInput = document.getElementById('verification-code');

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
        btnText.textContent = 'Verifying...';
        btnLoader.style.display = 'block';
        button.disabled = true;
    } else {
        btnText.textContent = 'Verify Code';
        btnLoader.style.display = 'none';
        button.disabled = false;
    }
}

// Replace the success redirect with modal
verificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = codeInput.value;
    const submitBtn = verificationForm.querySelector('.submit-btn');
    
    clearError(codeInput);
    
    if (!code || code.length !== 6) {
        showError(codeInput, "Please enter a valid 6-digit code");
        return;
    }

    setLoading(submitBtn, true);

    try {
        const email = await verifyPasswordResetCode(auth, code);
        console.log(" Code verified for:", email);
        
        // Store the code for password reset
        sessionStorage.setItem('resetCode', code);
        sessionStorage.setItem('userEmail', email);
        
        // Show success modal instead of auto-redirect
        showModal(`Code verified! Click OK to reset your password for ${email}.`);
        
        // Add click handler to modal button
        setTimeout(() => {
            const modal = document.querySelector('.modal');
            if (modal) {
                const okButton = modal.querySelector('button');
                okButton.onclick = () => {
                    modal.remove();
                    window.location.href = 'reset.html';
                };
            }
        }, 100);
        
    } catch (error) {
        console.error(" Code verification failed:", error);
        setLoading(submitBtn, false);
        
        switch (error.code) {
            case 'auth/expired-action-code':
                showError(codeInput, "Code expired. Please request a new one.");
                break;
            case 'auth/invalid-action-code':
                showError(codeInput, "Invalid code. Please check and try again.");
                break;
            default:
                showError(codeInput, "Verification failed. Please try again.");
        }
    }
});

// Add showModal function to this file too
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
                ${type === 'success' ? ' ' : ' '} ${type === 'success' ? 'Success' : 'Error'}
            </h3>
            <p style="margin-bottom: 20px;">${message}</p>
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
    
    modal.className = 'modal';
    document.body.appendChild(modal);
    
    return modal;
}
// Auto-focus and input formatting
codeInput.addEventListener('input', (e) => {
    clearError(codeInput);
    // Only allow numbers
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
});