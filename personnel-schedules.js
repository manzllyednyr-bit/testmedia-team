console.log("PERSONNEL SCHEDULES SCRIPT LOADED");


const myScheduleList =
    document.getElementById("myScheduleList");

const profileName =
    document.getElementById("profileName");

const profileInitial =
    document.getElementById("profileInitial");


async function loadMySchedules() {

    if (!myScheduleList) {
        return;
    }


    /* GET CURRENT USER */

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        alert("You are not logged in.");

        window.location.href = "index.html";

        return;
    }


    /* GET PROFILE */

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single();


    if (profileError || !profile) {

        console.error(
            "Profile error:",
            profileError
        );

        alert("Could not load your profile.");

        return;
    }


    /* VERIFY PERSONNEL */

    if (profile.role !== "personnel") {

        window.location.href = "admin.html";

        return;
    }


    /* PROFILE */

    profileName.textContent =
        profile.full_name;

    profileInitial.textContent =
        profile.full_name
            .charAt(0)
            .toUpperCase();


    /* GET ASSIGNMENTS */

    const {
        data: assignments,
        error: assignmentError
    } = await supabaseClient
        .from("assignments")
        .select("schedule_id")
        .eq("personnel_id", profile.id);


    if (assignmentError) {

        console.error(
            "Assignment error:",
            assignmentError
        );

        myScheduleList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Could not load schedules
                </h3>

                <p>
                    ${assignmentError.message}
                </p>

            </div>
        `;

        return;
    }


    if (!assignments || assignments.length === 0) {

        myScheduleList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📅
                </div>

                <h3>
                    No schedules assigned
                </h3>

                <p>
                    You currently have no assigned schedules.
                </p>

            </div>
        `;

        return;
    }


    /* GET SCHEDULE IDS */

    const scheduleIds =
        assignments.map(function (assignment) {

            return assignment.schedule_id;

        });


    /* GET SCHEDULES */

    const {
        data: schedules,
        error: scheduleError
    } = await supabaseClient
        .from("schedules")
        .select("*")
        .in("id", scheduleIds)
        .order("event_date", {
            ascending: true
        })
        .order("start_time", {
            ascending: true
        });


    if (scheduleError) {

        console.error(
            "Schedule error:",
            scheduleError
        );

        return;
    }


    /* DISPLAY */

    myScheduleList.innerHTML = "";


    schedules.forEach(function (schedule) {

        const row =
            document.createElement("div");

        row.className =
            "schedule-row";


        row.innerHTML = `

            <div>
                ${schedule.title}
            </div>

            <div>
                ${schedule.event_date}
            </div>

            <div>
                ${formatTime(schedule.start_time)}
                -
                ${formatTime(schedule.end_time)}
            </div>

            <div>
                ${schedule.location}
            </div>

            <div>
                ${schedule.description || "No description"}
            </div>

        `;


        myScheduleList.appendChild(row);

    });

}


/* FORMAT TIME */

function formatTime(time) {

    if (!time) {
        return "";
    }


    const parts =
        time.split(":");


    let hour =
        parseInt(parts[0]);


    const minute =
        parts[1];


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12;


    if (hour === 0) {
        hour = 12;
    }


    return `${hour}:${minute} ${period}`;

}


/* START */

loadMySchedules();
