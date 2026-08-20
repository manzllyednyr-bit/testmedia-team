console.log("ADMIN SCRIPT LOADED");

const totalSchedulesElement = document.querySelector(
    ".stat-card:nth-child(1) h2"
);

const upcomingElement = document.querySelector(
    ".stat-card:nth-child(4) h2"
);

const scheduleTable = document.querySelector(".schedule-table");


async function loadAdminDashboard() {

    const today = new Date().toISOString().split("T")[0];


    const { data: schedules, error } = await supabaseClient
        .from("schedules")
        .select("*")
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });


    if (error) {

        console.error("Dashboard schedule error:", error);

        return;
    }


    console.log("Dashboard schedules:", schedules);


    /* TOTAL SCHEDULES */

    if (totalSchedulesElement) {
        totalSchedulesElement.textContent = schedules.length;
    }


    /* UPCOMING SCHEDULES */

    const upcomingSchedules = schedules.filter(function (schedule) {

        return schedule.event_date >= today;

    });


    if (upcomingElement) {
        upcomingElement.textContent = upcomingSchedules.length;
    }


    /* DISPLAY UPCOMING SCHEDULES */

    const emptyState = document.querySelector(".empty-state");

    if (!scheduleTable) {
        return;
    }


    if (upcomingSchedules.length === 0) {

        return;
    }


    if (emptyState) {
        emptyState.remove();
    }


    upcomingSchedules.forEach(function (schedule) {

        const row = document.createElement("div");

        row.className = "schedule-row";

        row.innerHTML = `
            <div>${schedule.title}</div>

            <div>${schedule.event_date}</div>

            <div>
                ${formatTime(schedule.start_time)}
                -
                ${formatTime(schedule.end_time)}
            </div>

            <div>${schedule.location}</div>

            <div>Unassigned</div>
        `;

        scheduleTable.appendChild(row);

    });

}


function formatTime(time) {

    if (!time) {
        return "";
    }


    const parts = time.split(":");

    let hour = parseInt(parts[0]);

    const minute = parts[1];

    const period = hour >= 12 ? "PM" : "AM";


    hour = hour % 12;


    if (hour === 0) {
        hour = 12;
    }


    return `${hour}:${minute} ${period}`;
}


loadAdminDashboard();
