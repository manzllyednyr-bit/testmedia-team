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


// ==========================================
// LOAD CALENDAR
// ==========================================

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

        return;
    }


    // GET PERSONNEL

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


    // GET ASSIGNMENTS

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


// ==========================================
// RENDER CALENDAR
// ==========================================

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


    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const firstDayOfWeek =
        firstDay.getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const daysInPreviousMonth =
        new Date(
            year,
            month,
            0
        ).getDate();


    // PREVIOUS MONTH DAYS

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


    // CURRENT MONTH DAYS

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


        const daySchedules =
            schedules.filter(function (schedule) {

                return schedule.event_date ===
                    dateString;

            });


        // ADD EVENTS

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

            `;


            // ==================================
            // CLICK EVENT
            // ==================================

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

        });


        calendarDays.appendChild(day);

    }


    // NEXT MONTH DAYS

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


// ==========================================
// CREATE CALENDAR DAY
// ==========================================

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


// ==========================================
// SHOW SCHEDULE DETAILS
// ==========================================

function showScheduleDetails(
    schedule,
    personnelText
) {

    // Remove existing modal

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


    modal.innerHTML = `

        <div class="schedule-modal-overlay">

            <div class="schedule-modal">

                <button
                    type="button"
                    class="schedule-modal-close"
                    id="closeScheduleModal">
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


                <button
                    type="button"
                    class="primary-button"
                    id="closeScheduleModalButton">

                    Close

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    // Close with X

    document
        .getElementById(
            "closeScheduleModal"
        )
        .addEventListener(
            "click",
            closeScheduleDetails
        );


    // Close with button

    document
        .getElementById(
            "closeScheduleModalButton"
        )
        .addEventListener(
            "click",
            closeScheduleDetails
        );


    // Close by clicking outside

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

}


// ==========================================
// CLOSE MODAL
// ==========================================

function closeScheduleDetails() {

    const modal =
        document.getElementById(
            "scheduleDetailsModal"
        );

    if (modal) {

        modal.remove();

    }

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
// HTML SAFETY
// ==========================================

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


// ==========================================
// MONTH BUTTONS
// ==========================================

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


// ==========================================
// START
// ==========================================

loadCalendar();
