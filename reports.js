console.log("REPORTS SCRIPT LOADED");


/* ==========================================
   ELEMENTS
========================================== */

const profileName =
    document.getElementById("profileName");

const profileInitial =
    document.getElementById("profileInitial");

const totalSchedules =
    document.getElementById("totalSchedules");

const upcomingSchedules =
    document.getElementById("upcomingSchedules");

const completedSchedules =
    document.getElementById("completedSchedules");

const totalHours =
    document.getElementById("totalHours");

const pendingCount =
    document.getElementById("pendingCount");

const inProgressCount =
    document.getElementById("inProgressCount");

const completedCount =
    document.getElementById("completedCount");

const cancelledCount =
    document.getElementById("cancelledCount");

const personnelReportBody =
    document.getElementById("personnelReportBody");

const upcomingReportBody =
    document.getElementById("upcomingReportBody");

const refreshReports =
    document.getElementById("refreshReports");

const logoutButton =
    document.getElementById("logoutButton");


/* ==========================================
   DATA
========================================== */

let schedules = [];
let personnel = [];
let assignments = [];


/* ==========================================
   HELPERS
========================================== */

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);

    return element.innerHTML;

}


function idsMatch(firstId, secondId) {

    return String(firstId) ===
        String(secondId);

}


function formatTime(time) {

    if (!time) {
        return "";
    }

    const parts =
        time.substring(0, 5).split(":");

    let hours =
        Number(parts[0]);

    const minutes =
        parts[1];

    const suffix =
        hours >= 12
            ? "PM"
            : "AM";

    hours =
        hours % 12 || 12;

    return `${hours}:${minutes} ${suffix}`;

}


function calculateHours(startTime, endTime) {

    if (!startTime || !endTime) {
        return 0;
    }

    const start =
        startTime
            .substring(0, 5)
            .split(":");

    const end =
        endTime
            .substring(0, 5)
            .split(":");

    const startMinutes =
        Number(start[0]) * 60 +
        Number(start[1]);

    const endMinutes =
        Number(end[0]) * 60 +
        Number(end[1]);

    let difference =
        endMinutes - startMinutes;

    if (difference < 0) {
        difference += 1440;
    }

    return difference / 60;

}


function formatHours(hours) {

    const value =
        Number(hours);

    if (Number.isInteger(value)) {

        return `${value} hrs`;

    }

    return `${value.toFixed(1)} hrs`;

}


function getScheduleAssignments(scheduleId) {

    return assignments.filter(
        function (assignment) {

            return idsMatch(
                assignment.schedule_id,
                scheduleId
            );

        }
    );

}


function getPersonnelNames(scheduleId) {

    return getScheduleAssignments(
        scheduleId
    ).map(
        function (assignment) {

            const person =
                personnel.find(
                    function (item) {

                        return idsMatch(
                            item.id,
                            assignment.personnel_id
                        );

                    }
                );

            return person
                ? person.full_name
                : "Unknown";

        }
    );

}


/* ==========================================
   LOAD REPORT DATA
========================================== */

async function loadReports() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        alert(
            "Supabase is not connected."
        );

        return;

    }


    try {

        const {
            data: {
                user
            },
            error: authError
        } =
            await supabaseClient
                .auth
                .getUser();


        if (
            authError ||
            !user
        ) {

            window.location.replace(
                "index.html"
            );

            return;

        }


        /* ==================================
           GET ADMIN PROFILE
        ================================== */

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, role"
                )
                .eq(
                    "id",
                    user.id
                )
                .single();


        if (profileError) {

            throw profileError;

        }


        if (
            profile.role &&
            profile.role.toLowerCase() !==
            "admin"
        ) {

            window.location.replace(
                "personnel-dashboard.html"
            );

            return;

        }


        const name =
            profile.full_name ||
            "Admin";


        if (profileName) {

            profileName.textContent =
                name;

        }


        if (profileInitial) {

            profileInitial.textContent =
                name
                    .charAt(0)
                    .toUpperCase();

        }


        /* ==================================
           LOAD DATABASE DATA
        ================================== */

        const results =
            await Promise.all([

                supabaseClient
                    .from("schedules")
                    .select("*")
                    .order(
                        "event_date",
                        {
                            ascending: true
                        }
                    )
                    .order(
                        "start_time",
                        {
                            ascending: true
                        }
                    ),

                supabaseClient
                    .from("profiles")
                    .select(
                        "id, full_name"
                    )
                    .eq(
                        "role",
                        "personnel"
                    )
                    .order(
                        "full_name",
                        {
                            ascending: true
                        }
                    ),

                supabaseClient
                    .from("assignments")
                    .select(
                        "id, schedule_id, personnel_id"
                    )

            ]);


        const schedulesResult =
            results[0];

        const personnelResult =
            results[1];

        const assignmentsResult =
            results[2];


        if (schedulesResult.error) {
            throw schedulesResult.error;
        }

        if (personnelResult.error) {
            throw personnelResult.error;
        }

        if (assignmentsResult.error) {
            throw assignmentsResult.error;
        }


        schedules =
            schedulesResult.data || [];

        personnel =
            personnelResult.data || [];

        assignments =
            assignmentsResult.data || [];


        renderReports();

    } catch (error) {

        console.error(
            "Reports loading error:",
            error
        );

        alert(
            "Could not load reports: " +
            error.message
        );

    }

}


/* ==========================================
   RENDER REPORTS
========================================== */

function renderReports() {

    renderSummary();

    renderStatus();

    renderPersonnelWorkload();

    renderUpcomingSchedules();

}


/* ==========================================
   SUMMARY
========================================== */

function renderSummary() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const upcoming =
        schedules.filter(
            function (schedule) {

                const date =
                    new Date(
                        `${schedule.event_date}T00:00:00`
                    );

                return date >= today;

            }
        );


    const completed =
        schedules.filter(
            function (schedule) {

                return (
                    schedule.status ===
                    "Completed"
                );

            }
        );


    const hours =
        schedules.reduce(
            function (total, schedule) {

                return total +
                    calculateHours(
                        schedule.start_time,
                        schedule.end_time
                    );

            },
            0
        );


    if (totalSchedules) {

        totalSchedules.textContent =
            schedules.length;

    }


    if (upcomingSchedules) {

        upcomingSchedules.textContent =
            upcoming.length;

    }


    if (completedSchedules) {

        completedSchedules.textContent =
            completed.length;

    }


    if (totalHours) {

        totalHours.textContent =
            formatHours(hours);

    }

}


/* ==========================================
   STATUS
========================================== */

function renderStatus() {

    const counts = {

        Pending: 0,

        "In Progress": 0,

        Completed: 0,

        Cancelled: 0

    };


    schedules.forEach(
        function (schedule) {

            const status =
                schedule.status;

            if (
                Object.prototype.hasOwnProperty.call(
                    counts,
                    status
                )
            ) {

                counts[status]++;

            }

        }
    );


    pendingCount.textContent =
        counts.Pending;

    inProgressCount.textContent =
        counts["In Progress"];

    completedCount.textContent =
        counts.Completed;

    cancelledCount.textContent =
        counts.Cancelled;

}


/* ==========================================
   PERSONNEL WORKLOAD
========================================== */

function renderPersonnelWorkload() {

    if (!personnelReportBody) {
        return;
    }


    if (personnel.length === 0) {

        personnelReportBody.innerHTML = `

            <tr>

                <td colspan="3">

                    <div class="empty-report">

                        No personnel accounts found.

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    personnelReportBody.innerHTML =
        personnel.map(
            function (person) {

                const personAssignments =
                    assignments.filter(
                        function (assignment) {

                            return idsMatch(
                                assignment.personnel_id,
                                person.id
                            );

                        }
                    );


                let hours = 0;


                personAssignments.forEach(
                    function (assignment) {

                        const schedule =
                            schedules.find(
                                function (item) {

                                    return idsMatch(
                                        item.id,
                                        assignment.schedule_id
                                    );

                                }
                            );


                        if (schedule) {

                            hours +=
                                calculateHours(
                                    schedule.start_time,
                                    schedule.end_time
                                );

                        }

                    }
                );


                return `

                    <tr>

                        <td>

                            ${escapeHTML(
                                person.full_name ||
                                "Unnamed"
                            )}

                        </td>

                        <td>

                            ${personAssignments.length}

                        </td>

                        <td class="hours-value">

                            ${formatHours(hours)}

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* ==========================================
   UPCOMING SCHEDULES
========================================== */

function renderUpcomingSchedules() {

    if (!upcomingReportBody) {
        return;
    }


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const upcoming =
        schedules
            .filter(
                function (schedule) {

                    const date =
                        new Date(
                            `${schedule.event_date}T00:00:00`
                        );

                    return date >= today;

                }
            )
            .slice(0, 20);


    if (upcoming.length === 0) {

        upcomingReportBody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="empty-report">

                        No upcoming schedules.

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    upcomingReportBody.innerHTML =
        upcoming.map(
            function (schedule) {

                const names =
                    getPersonnelNames(
                        schedule.id
                    );


                return `

                    <tr>

                        <td>

                            ${escapeHTML(
                                schedule.title
                            )}

                        </td>

                        <td>

                            ${escapeHTML(
                                schedule.event_date
                            )}

                        </td>

                        <td>

                            ${formatTime(
                                schedule.start_time
                            )}

                            -

                            ${formatTime(
                                schedule.end_time
                            )}

                        </td>

                        <td>

                            ${escapeHTML(
                                schedule.location ||
                                "Not specified"
                            )}

                        </td>

                        <td>

                            ${
                                names.length > 0
                                    ? names
                                        .map(
                                            function (name) {

                                                return escapeHTML(
                                                    name
                                                );

                                            }
                                        )
                                        .join(", ")
                                    : "Unassigned"
                            }

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* ==========================================
   REFRESH
========================================== */

if (refreshReports) {

    refreshReports.addEventListener(
        "click",
        async function () {

            refreshReports.disabled =
                true;

            refreshReports.textContent =
                "Refreshing...";


            try {

                await loadReports();

            } finally {

                refreshReports.disabled =
                    false;

                refreshReports.textContent =
                    "Refresh Reports";

            }

        }
    );

}


/* ==========================================
   LOGOUT
========================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            if (
                typeof supabaseClient !==
                "undefined"
            ) {

                await supabaseClient
                    .auth
                    .signOut();

            }


            window.location.replace(
                "index.html"
            );

        }
    );

}


/* ==========================================
   INITIAL LOAD
========================================== */

loadReports();
