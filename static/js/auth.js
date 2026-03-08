
console.log("--- auth.js: Script loading started ---");
// 
/* ============================ */
/* SUPABASE CONFIG              */
/* ============================ */

// const SUPABASE_URL = "https://aiykvnhtbljlphncqzmr.supabase.co";
// const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

let supabaseClient = null;

/* ============================ */
/* INITIALIZE SUPABASE          */
/* ============================ */

function initSupabase() {

    if (!window.supabase) {
        console.error("❌ Supabase library not loaded");
        return;
    }

     // Safety check
    if (typeof SUPABASE_URL === "undefined" || typeof SUPABASE_ANON_KEY === "undefined") {
        console.error("❌ Supabase keys not found. Make sure index.html injects them.");
        return;
    }


    if (!supabaseClient) {

        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        console.log("✅ Supabase Client Initialized");
    }
}

initSupabase();

/* ============================ */
/* AUTH MODAL FUNCTIONS         */
/* ============================ */

window.openAuthModal = function (type) {

    const modal = document.getElementById("authModal");

    if (!modal) {
        console.error("❌ authModal not found");
        return;
    }

    modal.classList.add("active");
    switchAuthTab(type);
};

window.closeAuthModal = function () {

    const modal = document.getElementById("authModal");

    if (modal) {
        modal.classList.remove("active");
    }
};

window.switchAuthTab = function (type) {

    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    loginTab.classList.toggle("active", type === "login");
    signupTab.classList.toggle("active", type === "signup");

    loginForm.classList.toggle("active", type === "login");
    signupForm.classList.toggle("active", type === "signup");
};



/* ============================ */
/* SIGNUP                       */
/* ============================ */

window.handleSignup = async function (e) {

    e.preventDefault();

    initSupabase();

    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const { data, error } = await supabaseClient.auth.signUp({

        email: email,
        password: password,

        options: {
            data: {
                full_name: name
            }
        }

    });

    if (error) {
        alert(error.message);
        return;
    }

    alert("Signup successful! Please login.");

    closeAuthModal();
};

/* ============================ */
/* HERO GREETING UPDATE         */
/* ============================ */

function updateHeroGreeting() {

    const storedUser = JSON.parse(localStorage.getItem("safarUser"));

    if (!storedUser) return;

    const heroTitle = document.querySelector(".hero-title");
    const heroMessage = document.querySelector(".hero-message");

    if (!heroTitle) return;

    const hour = new Date().getHours();

    let greeting;

    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";
    else greeting = "Good evening";

    heroTitle.innerHTML = `${greeting}, ${storedUser.name} 👋`;

    if (heroMessage) {

        const messages = [
            "Planning your next adventure?",
            "Tell me your destination and I’ll build the perfect trip.",
            "Where would you like to travel today?",
            "Mountains, beaches, or cities?"
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        heroMessage.innerText = randomMessage;
    }
}


/* ============================ */
/* LOGIN                        */
/* ============================ */

window.handleLogin = async function (e) {

    e.preventDefault();

    initSupabase();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert(error.message);
        return;
    }

    const user = data.user;

    localStorage.setItem("safarUser", JSON.stringify({
        id: user.id,
        name: user.user_metadata.full_name
    }));

    // showUserProfile({
    //     name: user.user_metadata.full_name
    // });

    // closeAuthModal();
    showUserProfile({
    name: user.user_metadata.full_name
});

updateHeroGreeting();   // ⭐ THIS FIXES THE PROBLEM

closeAuthModal();

    if (window.location.pathname.includes("/chat")) {
        window.location.reload();
    }
};

/* ============================ */
/* SHOW USER PROFILE            */
/* ============================ */

window.showUserProfile = function (user) {

    const authButtons = document.getElementById("authButtons");
    const userProfile = document.getElementById("userProfile");

    const userName = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");

    if (authButtons) authButtons.style.display = "none";
    if (userProfile) userProfile.style.display = "flex";

    if (userName) userName.textContent = user.name;

    if (userAvatar) userAvatar.textContent = user.name[0].toUpperCase();
};

/* ============================ */
/* LOGOUT                       */
/* ============================ */

window.logout = async function () {

    initSupabase();

    await supabaseClient.auth.signOut();

    localStorage.removeItem("safarUser");

    location.reload();
};

/* ============================ */
/* SESSION RESTORE              */
/* ============================ */

window.addEventListener("load", async () => {

    initSupabase();

    const { data } = await supabaseClient.auth.getUser();

    if (data && data.user) {

        const name = data.user.user_metadata.full_name;

        localStorage.setItem("safarUser", JSON.stringify({
            id: data.user.id,
            name: name
        }));


        showUserProfile({ name });
        updateHeroGreeting();
    }
});

console.log("--- auth.js: Script loading finished ---");