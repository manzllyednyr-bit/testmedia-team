console.log("CALENDAR SCRIPT LOADED");


const currentMonthElement =
    document.getElementById("currentMonth");

const calendarDays =
    document.getElementById("calendarDays");

const previousMonthBtn =
    document.getElementById("previousMonthBtn");

const nextMonthBtn =
    document.getElementById("nextMonthBtn");

const todayBtn =
    document.getElementById("todayBtn");


let currentDate = new Date();


/* ==========================================
   LOAD CALENDAR
   ========================================== */

async function loadCalendar() {

    if (!calendarDays) {
        return;
    }


    const {
        data: schedules,
        error
    } = await supabaseClient
        .from("schedules")
        .select("*")
        .order("event_date", {
            ascending: true
        });


    if (error) {

        console.error(
            "Calendar schedule error:",
            error
        );

        calendarDays.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Could not load schedules
                </h3>

                <p>
                    ${error.message}
                </p>

            </div>
        `;

        return;
    }


    /* GET PERSONNEL */

    const {
        data: personnel,
        error: personnelError
    } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .eq("role", "personnel");


    if (personnelError) {

        console.error(
            "Personnel error:",
            personnelError
        );

        return;
    }


    /* GET ASSIGNMENTS */

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


    renderCalendar(
        schedules,
        personnel,
        assignments
    );

}


/* ==========================================
   RENDER CALENDAR
   ========================================== */

function renderCalendar(
    schedules,
    personnel,
    assignments
) {

    calendarDays.innerHTML = "";


    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();


    const monthName =
        currentDate.toLocaleString(
            "default",
            {
                month: "long",
                year: "numeric"
            }
        );


    currentMonthElement.textContent =
        monthName;


    /* FIRST DAY */

    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const firstDayOfWeek =
        firstDay.getDay();


    /* DAYS IN MONTH */

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /* DAYS FROM PREVIOUS MONTH */

    const daysInPreviousMonth =
        new Date(
            year,
            month,
            0
        ).getDate();


    /* PREVIOUS MONTH DAYS */

    for (
        let i = firstDayOfWeek - 1;
        i >= 0;
        i--
    ) {

        const dayNumber =
            daysInPreviousMonth - i;


        const day =
            createCalendarDay(
                dayNumber,
                true
            );


        calendarDays.appendChild(day);

    }


    /* CURRENT MONTH */

    for (
        let dayNumber = 1;
        dayNumber <= daysInMonth;
        dayNumber++
    ) {

        const day =
            createCalendarDay(
                dayNumber,
                false
            );


        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;


        /* FIND EVENTS */

        const daySchedules =
            schedules.filter(function (schedule) {

                return schedule.event_date ===
                    dateString;

            });


        /* ADD EVENTS */

        daySchedules.forEach(function (schedule) {

            const event =
                document.createElement("div");

            event.className =
                "calendar-event";


            const assignedPersonnel =
                assignments
                    .filter(function (assignment) {

                        return assignment.schedule_id ===
                            schedule.id;

                    })
                    .map(function (assignment) {

                        const person =
                            personnel.find(function (item) {

                                return item.id ===
                                    assignment.personnel_id;

                            });


                        return person
                            ? person.full_name
                            : "Unknown";

                    });


            const personnelText =
                assignedPersonnel.length > 0
                    ? assignedPersonnel.join(", ")
                    : "Unassigned";


            event.innerHTML = `

                <strong>
                    ${escapeHTML(schedule.title)}
                </strong>

                <small>
                    ${formatTime(schedule.start_time)}
                    -
                    ${formatTime(schedule.end_time)}
                </small>

                <small>
                    ${escapeHTML(schedule.location)}
                </small>

                <small>
                    👤 ${escapeHTML(personnelText)}
                </small>

            `;


            day.appendChild(event);

        });


        calendarDays.appendChild(day);

    }


    /* NEXT MONTH DAYS */

    const totalCells =
        firstDayOfWeek +
        daysInMonth;


    const remainingCells =
        totalCells % 7 === 0
            ? 0
            : 7 - (totalCells % 7);


    for (
        let i = 1;
        i <= remainingCells;
        i++
    ) {

        const day =
            createCalendarDay(
                i,
                true
            );


        calendarDays.appendChild(day);

    }

}


/* ==========================================
   CREATE DAY
   ========================================== */

function createCalendarDay(
    number,
    otherMonth
) {

    const day =
        document.createElement("div");


    day.className =
        "calendar-day";


    if (otherMonth) {

        day.classList.add(
            "other-month"
        );

    }


    const numberElement =
        document.createElement("div");


    numberElement.className =
        "calendar-number";


    numberElement.textContent =
        number;


    day.appendChild(
        numberElement
    );


    return day;

}


/* ==========================================
   FORMAT TIME
   ========================================== */

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


/* ==========================================
   HTML SAFETY
   ========================================== */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================
   BUTTONS
   ========================================== */

if (previousMonthBtn) {

    previousMonthBtn.addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() - 1
            );

            loadCalendar();

        }
    );

}


if (nextMonthBtn) {

    nextMonthBtn.addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() + 1
            );

            loadCalendar();

        }
    );

}


if (todayBtn) {

    todayBtn.addEventListener(
        "click",
        function () {

            currentDate =
                new Date();

            loadCalendar();

        }
    );

}


/* ==========================================
   START
   ========================================== */

loadCalendar();
