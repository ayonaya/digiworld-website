async function getFirebaseConfig() {
    try {
        const response = await fetch('/.netlify/functions/get-firebase-config');
        if (!response.ok) throw new Error('Could not load Firebase configuration.');
        return await response.json();
    } catch (error) {
        console.error('Firebase configuration fetch failed:', error);
        document.body.innerHTML = '<h1>Error: Could not initialize the application. Please try again later.</h1>';
        return null;
    }
}

async function initializeAuth() {
    const firebaseConfig = await getFirebaseConfig();
    if (!firebaseConfig) return;

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    const setupAuthListeners = () => {
        const accountControl = document.getElementById('accountControl');
        const authDropdownContent = document.getElementById('authDropdownContent');

        if (!accountControl || !authDropdownContent) return;
        
        const openAuthModal = () => {
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.classList.add('show');
        };

        function renderLoggedOutMenu() {
            authDropdownContent.innerHTML = `
                <button class="auth-dropdown-signin-btn" id="dropdownSignInBtn">Sign In</button>
                <a href="signup.html" class="register-link" id="dropdownRegisterBtn">Register</a>
            `;
            document.getElementById('dropdownSignInBtn').addEventListener('click', openAuthModal);
        }

        function renderLoggedInMenu(user) {
            authDropdownContent.innerHTML = `
                <a href="profile.html"><i class="fas fa-user-circle"></i> Profile</a>
                <a href="orders.html"><i class="fas fa-box"></i> My Orders</a>
                <a href="downloads.html"><i class="fas fa-download"></i> My Downloads</a>
                <a href="#" id="dropdownLogoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a>
            `;
            document.getElementById('dropdownLogoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut();
            });
        }

        auth.onAuthStateChanged(user => {
            const welcomeText = accountControl.querySelector('.welcome-text');
            const authAction = accountControl.querySelector('.auth-action');
            if (user) {
                welcomeText.textContent = 'Welcome Back';
                authAction.textContent = user.displayName || user.email.split('@')[0];
                renderLoggedInMenu(user);
            } else {
                welcomeText.textContent = 'Welcome';
                authAction.textContent = 'Sign In / Register';
                renderLoggedOutMenu();
            }
        });
    };

    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        const observer = new MutationObserver((mutations, obs) => {
            if (document.getElementById('accountControl')) {
                setupAuthListeners();
                obs.disconnect();
            }
        });
        observer.observe(headerPlaceholder, { childList: true, subtree: true });
    }
}

document.addEventListener('DOMContentLoaded', initializeAuth);