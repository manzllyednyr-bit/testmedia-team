console.log("PERSONNEL DASHBOARD SCRIPT LOADED");


const myScheduleList =
    document.getElementById("myScheduleList");

const totalSchedules =
    document.getElementById("totalSchedules");

const upcomingSchedules =
    document.getElementById("upcomingSchedules");

const assignedHours =
    document.getElementById("assignedHours");

const profileName =
    document.getElementById("profileName");

const profileInitial =
    document.getElementById("profileInitial");

const welcomeMessage =
    document.getElementById("welcomeMessage");


async function loadPersonnelDashboard() {

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

        alert(
            "Your personnel profile could not be found."
        );

        return;

    }


    /* VERIFY PERSONNEL ROLE */

    if (profile.role !== "personnel") {

        alert(
            "This page is for personnel accounts."
        );

        window.location.href = "admin.html";

        return;

    }


    /* DISPLAY PROFILE */

    profileName.textContent =
        profile.full_name;

    welcomeMessage.textContent =
        "Welcome back, " + profile.full_name + ".";

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
        .select("id, schedule_id")
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

        totalSchedules.textContent = "0";

        upcomingSchedules.textContent = "0";

        assignedHours.textContent = "0 hrs";


        myScheduleList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📅
                </div>

                <h3>
                    No schedules assigned
                </h3>

                <p>
                    You currently have no assigned media duties.
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


    /* TODAY */

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    /* UPCOMING */

    const upcoming =
        schedules.filter(function (schedule) {

            return schedule.event_date >= today;

        });


    /* TOTAL SCHEDULES */

    totalSchedules.textContent =
        schedules.length;


    /* UPCOMING */

    upcomingSchedules.textContent =
        upcoming.length;


    /* ASSIGNED HOURS */

    let totalHours = 0;


    schedules.forEach(function (schedule) {

        const start =
            timeToMinutes(
                schedule.start_time
            );

        const end =
            timeToMinutes(
                schedule.end_time
            );


        if (end > start) {

            totalHours +=
                (end - start) / 60;

        }

    });


    assignedHours.textContent =
        `${totalHours.toFixed(1)} hrs`;


    /* DISPLAY SCHEDULES */

    myScheduleList.innerHTML = "";


    upcoming.forEach(function (schedule) {

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


    if (upcoming.length === 0) {

        myScheduleList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📅
                </div>

                <h3>
                    No upcoming schedules
                </h3>

                <p>
                    Your assigned schedules are in the past.
                </p>

            </div>
        `;

    }

}


/* ==========================================
   TIME FUNCTIONS
   ========================================== */

function timeToMinutes(time) {

    if (!time) {
        return 0;
    }


    const parts =
        time.split(":");


    const hours =
        parseInt(parts[0]);


    const minutes =
        parseInt(parts[1]);


    return (
        hours * 60 +
        minutes
    );

}


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


/* ==========================================
   START
   ========================================== */

loadPersonnelDashboard();
