
import { supabase } from "./supabase.js";

async function connectCompanyPortal() {
    const adminLabel = document.querySelector(".admin");

    try {
        // Check the logged-in user
        const { data: userData, error: userError } =
            await supabase.auth.getUser();

        if (userError || !userData.user) {
            window.location.href = "./login.html";
            return;
        }

        // Verify administrator role
        const { data: profile, error: profileError } =
            await supabase
                .from("profiles")
                .select("role, full_name")
                .eq("id", userData.user.id)
                .single();

        if (profileError || !profile || profile.role !== "admin") {
            await supabase.auth.signOut();
            window.location.href = "./login.html";
            return;
        }

        // Show the actual administrator
        adminLabel.textContent =
            "● " + profile.full_name + " | Administrator";

        // Load company settings
        const { data: settings, error: settingsError } =
            await supabase
                .from("company_settings")
                .select("company_name, farmer_rate_per_litre")
                .limit(1)
                .maybeSingle();

        if (settingsError) {
            console.error("Settings error:", settingsError.message);
            return;
        }

        if (settings) {
            document.getElementById("companyName").value =
                settings.company_name;

            document.getElementById("rateInput").value =
                settings.farmer_rate_per_litre;

            document.getElementById("dashRate").textContent =
                "NPR " + settings.farmer_rate_per_litre + "/L";

            document.getElementById("paymentRate").textContent =
                "NPR " + settings.farmer_rate_per_litre;
        }

        console.log("DAIRY CONNECT COMPANY PORTAL CONNECTED!");
        console.log("Administrator:", profile.full_name);
        console.log("Company settings:", settings);

    } catch (error) {
        console.error("Company connection error:", error);
        adminLabel.textContent = "Connection error";
    }
}

connectCompanyPortal();
