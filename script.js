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


        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");


        if (!emailInput || !passwordInput) {
            console.error("Login fields were not found.");
            return;
        }


        const email = emailInput.value.trim();
        const password = passwordInput.value;


        if (!email || !password) {

            alert("Please enter your email and password.");

            return;
        }


        /* LOGIN */

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({

            email: email,
            password: password

        });


        if (error) {

            alert("Login failed: " + error.message);

            console.error("Login error:", error);

            return;
        }


        const user = data.user;


        if (!user) {

            alert("Login failed. User account was not found.");

            return;
        }


        /* GET PROFILE */

        const {
            data: profile,
            error: profileError
        } = await supabaseClient

            .from("profiles")

            .select("full_name, role")

            .eq("id", user.id)

            .single();


        if (profileError) {

            alert(
                "Login worked, but your profile could not be found."
            );

            console.error(
                "Profile error:",
                profileError
            );

            return;
        }


        console.log("Logged in user:", profile);


        /* REDIRECT BASED ON ROLE */

        if (profile.role === "admin") {

            window.location.href = "admin.html";

        }

        else if (profile.role === "personnel") {

            window.location.href =
                "personnel-dashboard.html";

        }

        else {

            alert(
                "Your account does not have a valid role."
            );

        }

    });

}
