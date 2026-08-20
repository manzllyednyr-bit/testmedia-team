console.log("PERSONNEL SCRIPT LOADED");

const personnelList = document.getElementById("personnelList");


async function loadPersonnel() {

    if (!personnelList) {
        return;
    }


    const { data: personnel, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "personnel")
        .order("full_name", { ascending: true });


    if (error) {

        console.error("Personnel loading error:", error);

        personnelList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Could not load personnel
                </h3>

                <p>
                    ${error.message}
                </p>

            </div>
        `;

        return;
    }


    if (!personnel || personnel.length === 0) {

        personnelList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    👥
                </div>

                <h3>
                    No personnel yet
                </h3>

                <p>
                    There are currently no personnel accounts.
                </p>

            </div>
        `;

        return;
    }


    personnelList.innerHTML = "";


    personnel.forEach(function (person) {

        const card = document.createElement("div");

        card.className = "personnel-card";

        card.innerHTML = `
            <div class="profile-circle">
                ${person.full_name.charAt(0).toUpperCase()}
            </div>

            <div>
                <strong>${person.full_name}</strong>
                <small>Media Personnel</small>
            </div>
        `;

        personnelList.appendChild(card);

    });

}


loadPersonnel();
