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
   CHECK IF THIS IS ADMIN DASHBOARD
   ========================================== */

const isAdminDashboard =
    window.location.pathname.endsWith("admin.html");


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
        })
        .order("start_time", {
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
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

        return;

    }


    /* ======================================
       GET PERSONNEL
       ====================================== */

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


    /* ======================================
       GET ASSIGNMENTS
       ====================================== */

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


    currentMonthElement.textContent =
        currentDate.toLocaleString(
            "default",
            {
                month: "long",
                year: "numeric"
            }
        );


    /* ======================================
       FIRST DAY
       ====================================== */

    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const firstDayOfWeek =
        firstDay.getDay();


    /* ======================================
       DAYS IN MONTH
       ====================================== */

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /* ======================================
       DAYS IN PREVIOUS MONTH
       ====================================== */

    const daysInPreviousMonth =
        new Date(
            year,
            month,
            0
        ).getDate();


    /* ======================================
       PREVIOUS MONTH DAYS
       ====================================== */

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


    /* ======================================
       CURRENT MONTH
       ====================================== */

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
            schedules.filter(
                function (schedule) {

                    return schedule.event_date ===
                        dateString;

                }
            );


        /* ==================================
           ADD EVENTS
           ================================== */

        daySchedules.forEach(
            function (schedule) {

                const event =
                    document.createElement("div");


                event.className =
                    "calendar-event";


                /* FIND ASSIGNED PERSONNEL */

                const assignedPersonnel =
                    assignments
                        .filter(
                            function (assignment) {

                                return assignment.schedule_id ===
                                    schedule.id;

                            }
                        )
                        .map(
                            function (assignment) {

                                const person =
                                    personnel.find(
                                        function (item) {

                                            return item.id ===
                                                assignment.personnel_id;

                                        }
                                    );


                                return person
                                    ? person.full_name
                                    : "Unknown";

                            }
                        );


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


                /* ==================================
                   CLICK EVENT
                   ================================== */

                event.addEventListener(
                    "click",
                    function () {

                        showScheduleDetails(
                            schedule,
                            personnelText
                        );

                    }
                );


                day.appendChild(event);

            }
        );


        calendarDays.appendChild(day);

    }


    /* ======================================
       NEXT MONTH DAYS
       ====================================== */

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
   CREATE CALENDAR DAY
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
   SHOW SCHEDULE DETAILS
   ========================================== */

function showScheduleDetails(
    schedule,
    personnelText
) {

    /* Remove existing modal */

    const existingModal =
        document.getElementById(
            "scheduleDetailsModal"
        );


    if (existingModal) {
        existingModal.remove();
    }


    const modal =
        document.createElement("div");


    modal.id =
        "scheduleDetailsModal";


    /* ======================================
       ADMIN BUTTONS
       ====================================== */

    let adminButtons = "";


    if (isAdminDashboard) {

        adminButtons = `

            <div
                style="
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                "
            >

                <button
                    type="button"
                    class="primary-button"
                    id="editScheduleButton"
                    style="flex: 1;"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="primary-button"
                    id="deleteScheduleButton"
                    style="
                        flex: 1;
                        background: #b42318;
                    "
                >
                    Delete
                </button>

            </div>

        `;

    }


    modal.innerHTML = `

        <div class="schedule-modal-overlay">

            <div class="schedule-modal">

                <button
                    type="button"
                    class="schedule-modal-close"
                    id="closeScheduleModal"
                >
                    ×
                </button>


                <h2>
                    ${escapeHTML(schedule.title)}
                </h2>


                <div class="schedule-detail">

                    <strong>
                        📅 Date
                    </strong>

                    <span>
                        ${escapeHTML(schedule.event_date)}
                    </span>

                </div>


                <div class="schedule-detail">

                    <strong>
                        ⏰ Time
                    </strong>

                    <span>
                        ${formatTime(schedule.start_time)}
                        -
                        ${formatTime(schedule.end_time)}
                    </span>

                </div>


                <div class="schedule-detail">

                    <strong>
                        📍 Location
                    </strong>

                    <span>
                        ${escapeHTML(schedule.location)}
                    </span>

                </div>


                <div class="schedule-detail">

                    <strong>
                        👤 Personnel
                    </strong>

                    <span>
                        ${escapeHTML(personnelText)}
                    </span>

                </div>


                <div class="schedule-detail">

                    <strong>
                        📝 Description
                    </strong>

                    <span>
                        ${
                            escapeHTML(
                                schedule.description ||
                                "No description"
                            )
                        }
                    </span>

                </div>


                ${adminButtons}


                <button
                    type="button"
                    class="primary-button"
                    id="closeScheduleModalButton"
                    style="margin-top: 15px;"
                >
                    Close
                </button>


            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* ======================================
       CLOSE WITH X
       ====================================== */

    document
        .getElementById(
            "closeScheduleModal"
        )
        .addEventListener(
            "click",
            closeScheduleDetails
        );


    /* ======================================
       CLOSE WITH BUTTON
       ====================================== */

    document
        .getElementById(
            "closeScheduleModalButton"
        )
        .addEventListener(
            "click",
            closeScheduleDetails
        );


    /* ======================================
       CLOSE OUTSIDE MODAL
       ====================================== */

    document
        .querySelector(
            ".schedule-modal-overlay"
        )
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target.classList.contains(
                        "schedule-modal-overlay"
                    )
                ) {

                    closeScheduleDetails();

                }

            }
        );


    /* ======================================
       ADMIN EDIT BUTTON
       ====================================== */

    if (isAdminDashboard) {

        const editButton =
            document.getElementById(
                "editScheduleButton"
            );


        if (editButton) {

            editButton.addEventListener(
                "click",
                function () {

                    closeScheduleDetails();

                    editScheduleFromCalendar(
                        schedule
                    );

                }
            );

        }


        /* ==================================
           ADMIN DELETE BUTTON
           ================================== */

        const deleteButton =
            document.getElementById(
                "deleteScheduleButton"
            );


        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                function () {

                    deleteScheduleFromCalendar(
                        schedule.id
                    );

                }
            );

        }

    }

}


/* ==========================================
   EDIT SCHEDULE FROM CALENDAR
   ========================================== */

function editScheduleFromCalendar(
    schedule
) {

    /* Look for schedule form on dashboard */

    const formContainer =
        document.getElementById(
            "scheduleFormContainer"
        );


    const form =
        document.getElementById(
            "scheduleForm"
        );


    if (!formContainer || !form) {

        alert(
            "Schedule editing form could not be found."
        );

        return;

    }


    /* Fill the existing form */

    document.getElementById(
        "eventName"
    ).value =
        schedule.title || "";


    document.getElementById(
        "scheduleDate"
    ).value =
        schedule.event_date || "";


    document.getElementById(
        "startTime"
    ).value =
        schedule.start_time
            ? schedule.start_time.substring(
                0,
                5
            )
            : "";


    document.getElementById(
        "endTime"
    ).value =
        schedule.end_time
            ? schedule.end_time.substring(
                0,
                5
            )
            : "";


    document.getElementById(
        "location"
    ).value =
        schedule.location || "";


    document.getElementById(
        "description"
    ).value =
        schedule.description || "";


    /*
       Tell schedules.js which schedule
       is being edited.
    */

    if (
        typeof window.startScheduleEdit ===
        "function"
    ) {

        window.startScheduleEdit(
            schedule.id
        );

    }


    formContainer.style.display =
        "block";


    formContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* ==========================================
   DELETE SCHEDULE FROM CALENDAR
   ========================================== */

async function deleteScheduleFromCalendar(
    scheduleId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this schedule?\n\nAll personnel assignments for this schedule will also be removed."
        );


    if (!confirmed) {
        return;
    }


    const deleteButton =
        document.getElementById(
            "deleteScheduleButton"
        );


    if (deleteButton) {

        deleteButton.disabled =
            true;

        deleteButton.textContent =
            "Deleting...";

    }


    /* ======================================
       DELETE ASSIGNMENTS
       ====================================== */

    const {
        error: assignmentError
    } = await supabaseClient
        .from("assignments")
        .delete()
        .eq(
            "schedule_id",
            scheduleId
        );


    if (assignmentError) {

        console.error(
            "Assignment delete error:",
            assignmentError
        );


        alert(
            "Could not delete assignments: " +
            assignmentError.message
        );


        if (deleteButton) {

            deleteButton.disabled =
                false;

            deleteButton.textContent =
                "Delete";

        }

        return;

    }


    /* ======================================
       DELETE SCHEDULE
       ====================================== */

    const {
        error
    } = await supabaseClient
        .from("schedules")
        .delete()
        .eq(
            "id",
            scheduleId
        );


    if (error) {

        console.error(
            "Schedule delete error:",
            error
        );


        alert(
            "Could not delete schedule: " +
            error.message
        );


        if (deleteButton) {

            deleteButton.disabled =
                false;

            deleteButton.textContent =
                "Delete";

        }

        return;

    }


    closeScheduleDetails();


    alert(
        "Schedule deleted successfully!"
    );


    /* Refresh dashboard calendar */

    loadCalendar();


    /* Refresh dashboard statistics */

    if (
        typeof window.loadAdminDashboard ===
        "function"
    ) {

        window.loadAdminDashboard();

    }

}


/* ==========================================
   CLOSE MODAL
   ========================================== */

function closeScheduleDetails() {

    const modal =
        document.getElementById(
            "scheduleDetailsModal"
        );


    if (modal) {

        modal.remove();

    }

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
   MONTH BUTTONS
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
