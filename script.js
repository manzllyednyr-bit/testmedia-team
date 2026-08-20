const SUPABASE_URL = "https://mvoetibxiqazxbkbxguf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Apqxwb14MZ74RMnKlZLdjg_e_ZnURIF";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
console.log("NEW SCRIPT LOADED");
const loginForm = document.querySelector("form");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            alert("Login failed: " + error.message);
            console.error(error);
            return;
        }

        const user = data.user;

        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("full_name, role")
                .eq("id", user.id)
                .single();

        if (profileError) {
            alert("Login worked, but your profile could not be found.");
            console.error(profileError);
            return;
        }

        console.log("Logged in user:", profile);

        if (profile.role === "admin") {
            window.location.href = "admin.html";
        } else if (profile.role === "personnel") {
            window.location.href = "personnel.html";
        } else {
            alert("Your account does not have a valid role.");
        }
        /* =========================================
   ADMIN DASHBOARD
   ========================================= */

.dashboard {
    display: flex;
    min-height: 100vh;
    background: #f4f7fb;
}

/* Sidebar */

.sidebar {
    width: 250px;
    background: #123f6d;
    color: white;
    padding: 28px 18px;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
}

.sidebar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 5px 10px 30px;
}

.sidebar-logo h2 {
    margin: 0;
    font-size: 19px;
}

.sidebar-logo p {
    margin: 4px 0 0;
    font-size: 12px;
    opacity: 0.75;
}

.logo {
    width: 48px;
    height: 48px;
    background: white;
    color: #123f6d;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

/* Navigation */

.navigation {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.nav-item {
    display: block;
    padding: 13px 15px;
    border-radius: 8px;
    color: white;
    text-decoration: none;
    font-size: 14px;
    transition: 0.2s;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.12);
}

.nav-item.active {
    background: white;
    color: #123f6d;
    font-weight: bold;
}

.sidebar-bottom {
    margin-top: auto;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 15px;
}

/* Main Content */

.main-content {
    margin-left: 250px;
    width: calc(100% - 250px);
    padding: 35px 45px;
}

/* Header */

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.dashboard-header h1 {
    margin: 0;
    color: #123f6d;
    font-size: 30px;
}

.dashboard-header p {
    margin: 6px 0 0;
    color: #6b7280;
}

.admin-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    padding: 9px 14px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.admin-profile strong {
    display: block;
    color: #172b4d;
}

.admin-profile small {
    color: #777;
}

.profile-circle {
    width: 38px;
    height: 38px;
    background: #123f6d;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

/* Statistics */

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    margin-bottom: 30px;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 22px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: #e8f1fa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
}

.stat-card p {
    margin: 0 0 5px;
    color: #6b7280;
    font-size: 13px;
}

.stat-card h2 {
    margin: 0;
    color: #123f6d;
    font-size: 25px;
}

/* Dashboard Section */

.dashboard-section {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
}

.section-header h2 {
    margin: 0;
    color: #172b4d;
}

.section-header p {
    margin: 5px 0 0;
    color: #777;
    font-size: 13px;
}

/* Buttons */

.primary-button {
    border: none;
    background: #123f6d;
    color: white;
    padding: 11px 18px;
    border-radius: 7px;
    cursor: pointer;
    font-weight: bold;
    transition: 0.2s;
}

.primary-button:hover {
    background: #0d3155;
}

/* Schedule Table */

.schedule-table {
    border: 1px solid #e5e7eb;
    border-radius: 9px;
    overflow: hidden;
}

.table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1.3fr 1.5fr 1fr;
    padding: 15px 18px;
    background: #f8fafc;
    color: #667085;
    font-size: 12px;
    font-weight: bold;
}

.empty-state {
    text-align: center;
    padding: 55px 20px;
}

.empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
}

.empty-state h3 {
    margin: 0 0 7px;
    color: #172b4d;
}

.empty-state p {
    color: #777;
    margin-bottom: 20px;
}

/* Responsive */

@media (max-width: 1000px) {

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

}

@media (max-width: 700px) {

    .sidebar {
        width: 200px;
    }

    .main-content {
        margin-left: 200px;
        width: calc(100% - 200px);
        padding: 25px;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .dashboard-header {
        align-items: flex-start;
        gap: 20px;
        flex-direction: column;
    }

});
}
