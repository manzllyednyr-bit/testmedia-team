console.log("REPORTS SCRIPT LOADED");


/* ==========================================
   ELEMENTS
   ========================================== */

const totalSchedules =
    document.getElementById(
        "totalSchedules"
    );

const upcomingSchedules =
    document.getElementById(
        "upcomingSchedules"
    );

const completedSchedules =
    document.getElementById(
        "completedSchedules"
    );

const totalHours =
    document.getElementById(
        "totalHours"
    );

const totalPersonnelHours =
    document.getElementById(
        "totalPersonnelHours"
    );

const pendingCount =
    document.getElementById(
        "pendingCount"
    );

const inProgressCount =
    document.getElementById(
        "inProgressCount"
    );

const completedCount =
    document.getElementById(
        "completedCount"
    );

const cancelledCount =
    document.getElementById(
        "cancelledCount"
    );

const personnelWorkload =
    document.getElementById(
        "personnelWorkload"
    );

const upcomingScheduleReport =
    document.getElementById(
        "upcomingScheduleReport"
    );

const profileName =
    document.getElementById(
        "profileName"
    );

const profileInitial =
    document.getElementById(
        "profileInitial"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


/* ==========================================
   DATA
   ========================================== */

let schedulesCache = [];

let personnelCache = [];

let assignmentsCache = [];


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


function idsMatch(
    firstId,
    secondId
) {

    return String(firstId) ===
        String(secondId);

}


function calculateHours(
    startTime,
    endTime
) {

    if (
        !startTime ||
        !endTime
    ) {

        return 0;

    }


    const startParts =
        startTime
            .substring(0, 5)
            .split(":");

    const endParts =
        endTime
            .substring(0, 5)
            .split(":");


    const startMinutes =
        Number(startParts[0]) * 60 +
        Number(startParts[1]);


    const endMinutes =
        Number(endParts[0]) * 60 +
        Number(endParts[1]);


    let difference =
        endMinutes -
        startMinutes;


    /*
       Supports schedules that pass midnight.
    */

    if (difference < 0) {

        difference += 24 * 60;

    }


    return difference / 60;

}


function formatHours(hours) {

    const number =
        Number(hours) || 0;


    if (
        Number.isInteger(number)
    ) {

        return `${number} hr${number === 1 ? "" : "s"}`;

    }


    return `${number.toFixed(1)} hrs`;

}


function formatTime(time) {

    if (!time) {

        return "";

    }


    const parts =
        time
            .substring(0, 5)
            .split(":");


    let hours =
        Number(parts[0]);

    const minutes =
        parts[1];


    const period =
        hours >= 12
            ? "PM"
            : "AM";


    hours =
        hours % 12 || 12;


    return `${hours}:${minutes} ${period}`;

}


function formatDate(dateValue) {

    if (!dateValue) {

        return "";

    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

    }


    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


function getToday() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    return today;

}


function getScheduleDate(
    dateValue
) {

    if (!dateValue) {

        return null;

    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


/* ==========================================
   LOAD ADMIN PROFILE
   ========================================== */

async function loadAdminProfile() {

    const {
        data: authData,
        error: authError
    } =
        await supabaseClient
            .auth
            .getUser();


    if (
        authError ||
        !authData ||
        !authData.user
    ) {

        window.location.replace(
            "index.html"
        );

        return null;

    }


    const user =
        authData.user;


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
            .maybeSingle();


    if (profileError) {

        console.error(
            "Profile loading error:",
            profileError
        );

        alert(
            "Could not load your profile."
        );

        return null;

    }


    if (!profile) {

        alert(
            "Your profile could not be found."
        );

        return null;

    }


    if (
        profile.role &&
        profile.role.toLowerCase() !==
            "admin"
    ) {

        window.location.replace(
            "personnel-dashboard.html"
        );

        return null;

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


    return user;

}


/* ==========================================
   LOAD REPORT DATA
   ========================================== */

async function loadReportData() {

    try {

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
                        "id, full_name, role"
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


        if (
            schedulesResult.error
        ) {

            throw schedulesResult.error;

        }


        if (
            personnelResult.error
        ) {

            throw personnelResult.error;

        }


        if (
            assignmentsResult.error
        ) {

            throw assignmentsResult.error;

        }


        schedulesCache =
            schedulesResult.data || [];


        personnelCache =
            personnelResult.data || [];


        assignmentsCache =
            assignmentsResult.data || [];


        console.log(
            "Schedules:",
            schedulesCache
        );

        console.log(
            "Personnel:",
            personnelCache
        );

        console.log(
            "Assignments:",
            assignmentsCache
        );


        renderReport();

    } catch (error) {

        console.error(
            "Report loading error:",
            error
        );


        if (personnelWorkload) {

            personnelWorkload.innerHTML = `
                <div class="empty-report">
                    Could not load report data.
                    <br>
                    ${escapeHTML(
                        error.message
                    )}
                </div>
            `;

        }


        if (upcomingScheduleReport) {

            upcomingScheduleReport.innerHTML = `
                <div class="empty-report">
                    Could not load upcoming schedules.
                </div>
            `;

        }

    }

}


/* ==========================================
   RENDER ENTIRE REPORT
   ========================================== */

function renderReport() {

    renderSummary();

    renderStatus();

    renderPersonnelWorkload();

    renderUpcomingSchedules();

}


/* ==========================================
   SUMMARY
   ========================================== */

function renderSummary() {

    const schedules =
        schedulesCache;


    /*
       UPCOMING
       A schedule is upcoming when
       its date is today or later.
    */

    const today =
        getToday();


    const upcoming =
        schedules.filter(
            function (schedule) {

                const date =
                    getScheduleDate(
                        schedule.event_date
                    );

                return date &&
                    date >= today;

            }
        );


    /*
       COMPLETED
       Based on the schedule status.
    */

    const completed =
        schedules.filter(
            function (schedule) {

                return String(
                    schedule.status || ""
                ).toLowerCase() ===
                    "completed";

            }
        );


    /*
       TOTAL SCHEDULED HOURS

       Each schedule is counted
       ONLY ONCE.

       Example:
       Schedule A = 12 hours
       Schedule B = 9 hours

       Total Scheduled Hours = 21 hours
    */

    const scheduledHours =
        schedules.reduce(
            function (
                total,
                schedule
            ) {

                return total +
                    calculateHours(
                        schedule.start_time,
                        schedule.end_time
                    );

            },
            0
        );


    /*
       TOTAL PERSONNEL HOURS

       Each assignment gets the
       duration of its schedule.

       Example:

       Gene = 21 hours
       Michael = 9 hours

       Total Personnel Hours = 30 hours
    */

    const personnelHours =
        assignmentsCache.reduce(
            function (
                total,
                assignment
            ) {

                const schedule =
                    schedules.find(
                        function (
                            item
                        ) {

                            return idsMatch(
                                item.id,
                                assignment.schedule_id
                            );

                        }
                    );


                if (!schedule) {

                    return total;

                }


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
            formatHours(
                scheduledHours
            );

    }


    if (totalPersonnelHours) {

        totalPersonnelHours.textContent =
            formatHours(
                personnelHours
            );

    }

}


/* ==========================================
   STATUS REPORT
   ========================================== */

function renderStatus() {

    let pending = 0;

    let inProgress = 0;

    let completed = 0;

    let cancelled = 0;


    schedulesCache.forEach(
        function (schedule) {

            const status =
                String(
                    schedule.status || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                status === "pending"
            ) {

                pending++;

            }

            else if (
                status === "in progress"
            ) {

                inProgress++;

            }

            else if (
                status === "completed"
            ) {

                completed++;

            }

            else if (
                status === "cancelled"
            ) {

                cancelled++;

            }

        }
    );


    if (pendingCount) {

        pendingCount.textContent =
            pending;

    }


    if (inProgressCount) {

        inProgressCount.textContent =
            inProgress;

    }


    if (completedCount) {

        completedCount.textContent =
            completed;

    }


    if (cancelledCount) {

        cancelledCount.textContent =
            cancelled;

    }

}


/* ==========================================
   PERSONNEL WORKLOAD
   ========================================== */

function renderPersonnelWorkload() {

    if (!personnelWorkload) {

        return;

    }


    if (
        personnelCache.length === 0
    ) {

        personnelWorkload.innerHTML = `
            <div class="empty-report">
                No personnel accounts found.
            </div>
        `;

        return;

    }


    const workload =
        personnelCache.map(
            function (person) {

                /*
                   Find assignments belonging
                   to this personnel.
                */

                const assignments =
                    assignmentsCache.filter(
                        function (
                            assignment
                        ) {

                            return idsMatch(
                                assignment.personnel_id,
                                person.id
                            );

                        }
                    );


                /*
                   Avoid counting the same
                   schedule twice for the
                   same person if duplicate
                   assignment rows exist.
                */

                const uniqueScheduleIds =
                    [
                        ...new Set(
                            assignments.map(
                                function (
                                    assignment
                                ) {

                                    return String(
                                        assignment.schedule_id
                                    );

                                }
                            )
                        )
                    ];


                let hours = 0;


                uniqueScheduleIds.forEach(
                    function (
                        scheduleId
                    ) {

                        const schedule =
                            schedulesCache.find(
                                function (
                                    item
                                ) {

                                    return idsMatch(
                                        item.id,
                                        scheduleId
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


                return {

                    name:
                        person.full_name ||
                        "Unnamed",

                    scheduleCount:
                        uniqueScheduleIds.length,

                    hours:
                        hours

                };

            }
        );


    /*
       Put people with the most
       assigned hours first.
    */

    workload.sort(
        function (
            first,
            second
        ) {

            return second.hours -
                first.hours;

        }
    );


    personnelWorkload.innerHTML = `

        <table class="report-table">

            <thead>

                <tr>

                    <th>
                        Personnel
                    </th>

                    <th>
                        Assigned Schedules
                    </th>

                    <th>
                        Total Hours
                    </th>

                </tr>

            </thead>


            <tbody>

                ${
                    workload.map(
                        function (
                            person
                        ) {

                            return `

                                <tr>

                                    <td>
                                        ${escapeHTML(
                                            person.name
                                        )}
                                    </td>

                                    <td>
                                        ${person.scheduleCount}
                                    </td>

                                    <td>
                                        <strong>
                                            ${formatHours(
                                                person.hours
                                            )}
                                        </strong>
                                    </td>

                                </tr>

                            `;

                        }
                    ).join("")
                }

            </tbody>

        </table>

    `;

}


/* ==========================================
   UPCOMING SCHEDULES
   ========================================== */

function renderUpcomingSchedules() {

    if (!upcomingScheduleReport) {

        return;

    }


    const today =
        getToday();


    const upcoming =
        schedulesCache
            .filter(
                function (
                    schedule
                ) {

                    const date =
                        getScheduleDate(
                            schedule.event_date
                        );

                    return date &&
                        date >= today;

                }
            )
            .sort(
                function (
                    first,
                    second
                ) {

                    const firstDate =
                        getScheduleDate(
                            first.event_date
                        );

                    const secondDate =
                        getScheduleDate(
                            second.event_date
                        );


                    if (
                        firstDate &&
                        secondDate &&
                        firstDate.getTime() !==
                            secondDate.getTime()
                    ) {

                        return firstDate -
                            secondDate;

                    }


                    return String(
                        first.start_time || ""
                    ).localeCompare(
                        String(
                            second.start_time || ""
                        )
                    );

                }
            );


    if (
        upcoming.length === 0
    ) {

        upcomingScheduleReport.innerHTML = `
            <div class="empty-report">
                There are no upcoming schedules.
            </div>
        `;

        return;

    }


    upcomingScheduleReport.innerHTML = `

        <table class="report-table">

            <thead>

                <tr>

                    <th>
                        Event
                    </th>

                    <th>
                        Date
                    </th>

                    <th>
                        Time
                    </th>

                    <th>
                        Location
                    </th>

                    <th>
                        Personnel
                    </th>

                </tr>

            </thead>


            <tbody>

                ${
                    upcoming.map(
                        function (
                            schedule
                        ) {

                            const assignedNames =
                                assignmentsCache
                                    .filter(
                                        function (
                                            assignment
                                        ) {

                                            return idsMatch(
                                                assignment.schedule_id,
                                                schedule.id
                                            );

                                        }
                                    )
                                    .map(
                                        function (
                                            assignment
                                        ) {

                                            const person =
                                                personnelCache.find(
                                                    function (
                                                        item
                                                    ) {

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


                            const uniqueNames =
                                [
                                    ...new Set(
                                        assignedNames
                                    )
                                ];


                            return `

                                <tr>

                                    <td>
                                        ${escapeHTML(
                                            schedule.title
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            formatDate(
                                                schedule.event_date
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            formatTime(
                                                schedule.start_time
                                            )
                                        )}
                                        -
                                        ${escapeHTML(
                                            formatTime(
                                                schedule.end_time
                                            )
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
                                            uniqueNames.length > 0
                                                ? escapeHTML(
                                                    uniqueNames.join(
                                                        ", "
                                                    )
                                                )
                                                : "Unassigned"
                                        }
                                    </td>

                                </tr>

                            `;

                        }
                    ).join("")
                }

            </tbody>

        </table>

    `;

}


/* ==========================================
   LOGOUT
   ========================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {

                if (
                    typeof supabaseClient !==
                    "undefined"
                ) {

                    await supabaseClient
                        .auth
                        .signOut();

                }

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            window.location.replace(
                "index.html"
            );

        }
    );

}


/* ==========================================
   INITIALIZE
   ========================================== */

async function initializeReports() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.error(
            "supabaseClient is not available."
        );

        return;

    }


    const user =
        await loadAdminProfile();


    if (!user) {

        return;

    }


    await loadReportData();

}


initializeReports();
