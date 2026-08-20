console.log("ADMIN SCRIPT LOADED");


// ==========================================
// DASHBOARD ELEMENTS
// ==========================================

const totalSchedulesElement =
    document.querySelector(".stat-card:nth-child(1) h2");

const totalPersonnelElement =
    document.querySelector(".stat-card:nth-child(2) h2");

const assignedHoursElement =
    document.querySelector(".stat-card:nth-child(3) h2");

const upcomingElement =
    document.querySelector(".stat-card:nth-child(4) h2");

const scheduleTable =
    document.querySelector(".schedule-table");


// ==========================================
// LOAD ADMIN DASHBOARD
// ==========================================

async function loadAdminDashboard() {

    console.log("Loading admin dashboard...");


    // --------------------------------------
    // GET SCHEDULES
    // --------------------------------------

    const {
        data: schedules,
        error: scheduleError
    } = await supabaseClient
        .from("schedules")
        .select("*")
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


    console.log(
        "Schedules:",
        schedules
    );


    // --------------------------------------
    // TOTAL SCHEDULES
    // --------------------------------------

    if (totalSchedulesElement) {

        totalSchedulesElement.textContent =
            schedules.length;

    }


    // --------------------------------------
    // GET PERSONNEL
    // --------------------------------------

    const {
        data: personnel,
        error: personnelError
    } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "personnel");


    if (personnelError) {

        console.error(
            "Personnel error:",
            personnelError
        );

    } else {

        console.log(
            "Personnel:",
            personnel
        );


        if (totalPersonnelElement) {

            totalPersonnelElement.textContent =
                personnel.length;

        }

    }


    // --------------------------------------
    // GET ASSIGNMENTS
    // --------------------------------------

    const {
        data: assignments,
        error: assignmentError
    } = await supabaseClient
        .from("assignments")
        .select("schedule_id, personnel_id");


    if (assignmentError) {

        console.error(
            "Assignment error:",
            assignmentError
        );

        return;
    }


    console.log(
        "Assignments:",
        assignments
    );


    // ======================================
    // ASSIGNED HOURS
    // ======================================

    let assignedHours = 0;


    // Prevent counting the same schedule
    // multiple times if several personnel
    // are assigned to it.

    const countedSchedules = new Set();


    assignments.forEach(function (assignment) {

        const schedule =
            schedules.find(function (item) {

                return item.id ===
                    assignment.schedule_id;

            });


        if (!schedule) {
            return;
        }


        if (
            countedSchedules.has(
                schedule.id
            )
        ) {
            return;
        }


        countedSchedules.add(
            schedule.id
        );


        const start =
            convertTimeToMinutes(
                schedule.start_time
            );

        const end =
            convertTimeToMinutes(
                schedule.end_time
            );


        if (
            start !== null &&
            end !== null &&
            end > start
        ) {

            const minutes =
                end - start;


            assignedHours +=
                minutes / 60;

        }

    });


    if (assignedHoursElement) {

        assignedHoursElement.textContent =
            formatHours(assignedHours) + " hrs";

    }


    // ======================================
    // UPCOMING SCHEDULES
    // ======================================

    const today =
        getLocalDate();


    const upcomingSchedules =
        schedules.filter(function (schedule) {

            return schedule.event_date >= today;

        });


    if (upcomingElement) {

        upcomingElement.textContent =
            upcomingSchedules.length;

    }


    // ======================================
    // DISPLAY UPCOMING SCHEDULES
    // ======================================

    displayUpcomingSchedules(
        upcomingSchedules,
        assignments,
        personnel
    );

}


// ==========================================
// DISPLAY UPCOMING SCHEDULES
// ==========================================

function displayUpcomingSchedules(
    schedules,
    assignments,
    personnel
) {

    if (!scheduleTable) {
        return;
    }


    // Remove old schedule rows

    const oldRows =
        scheduleTable.querySelectorAll(
            ".schedule-row"
        );


    oldRows.forEach(function (row) {

        row.remove();

    });


    // Remove empty state

    const emptyState =
        scheduleTable.querySelector(
            ".empty-state"
        );


    if (emptyState) {

        emptyState.remove();

    }


    // No schedules

    if (schedules.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "empty-state";

        empty.innerHTML = `

            <div class="empty-icon">
                📅
            </div>

            <h3>
                No schedules yet
            </h3>

            <p>
                Create your first media schedule
                to get started.
            </p>

            <button
                type="button"
                class="primary-button"
                onclick="window.location.href='schedules.html'">

                Create Schedule

            </button>

        `;


        scheduleTable.appendChild(
            empty
        );

        return;
    }


    // --------------------------------------
    // DISPLAY EACH SCHEDULE
    // --------------------------------------

    schedules.forEach(function (schedule) {

        const row =
            document.createElement("div");


        row.className =
            "schedule-row";


        // Find personnel assigned to this schedule

        const assignedPersonnel =
            assignments.filter(function (assignment) {

                return assignment.schedule_id ===
                    schedule.id;

            });


        const personnelNames =
            assignedPersonnel.map(function (assignment) {

                const person =
                    personnel.find(function (item) {

                        return item.id ===
                            assignment.personnel_id;

                    });


                if (person) {

                    return person.full_name;

                }


                return "Unknown";

            });


        let personnelText =
            "Unassigned";


        if (personnelNames.length > 0) {

            personnelText =
                personnelNames.join(", ");

        }


        // Create row

        row.innerHTML = `

            <div>
                ${escapeHTML(schedule.title)}
            </div>

            <div>
                ${escapeHTML(schedule.event_date)}
            </div>

            <div>
                ${formatTime(schedule.start_time)}
                -
                ${formatTime(schedule.end_time)}
            </div>

            <div>
                ${escapeHTML(schedule.location)}
            </div>

            <div>
                ${escapeHTML(personnelText)}
            </div>

        `;


        scheduleTable.appendChild(
            row
        );

    });

}


// ==========================================
// CONVERT TIME TO MINUTES
// ==========================================

function convertTimeToMinutes(time) {

    if (!time) {
        return null;
    }


    const parts =
        time.split(":");


    if (parts.length < 2) {
        return null;
    }


    const hours =
        parseInt(parts[0], 10);

    const minutes =
        parseInt(parts[1], 10);


    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {

        return null;

    }


    return (
        hours * 60
    ) + minutes;

}


// ==========================================
// FORMAT HOURS
// ==========================================

function formatHours(hours) {

    return Number(
        hours.toFixed(1)
    );

}


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(time) {

    if (!time) {
        return "";
    }


    const parts =
        time.split(":");


    let hour =
        parseInt(
            parts[0],
            10
        );


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


// ==========================================
// GET LOCAL DATE
// ==========================================

function getLocalDate() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


// ==========================================
// BASIC HTML SAFETY
// ==========================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// START DASHBOARD
// ==========================================

loadAdminDashboard();
