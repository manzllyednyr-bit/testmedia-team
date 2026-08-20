console.log("SCHEDULE SCRIPT LOADED");

const createScheduleBtn =
    document.getElementById("createScheduleBtn");

const createScheduleEmptyBtn =
    document.getElementById("createScheduleEmptyBtn");

const cancelScheduleBtn =
    document.getElementById("cancelScheduleBtn");

const scheduleFormContainer =
    document.getElementById("scheduleFormContainer");

const scheduleForm =
    document.getElementById("scheduleForm");

const scheduleList =
    document.getElementById("scheduleList");

let editingScheduleId = null;


/* ==========================================
   SHOW / HIDE FORM
   ========================================== */

function showScheduleForm() {

    if (scheduleFormContainer) {
        scheduleFormContainer.style.display = "block";
    }

}


function hideScheduleForm() {

    if (scheduleFormContainer) {
        scheduleFormContainer.style.display = "none";
    }

    editingScheduleId = null;

    if (scheduleForm) {
        scheduleForm.reset();
    }

    updateFormMode();
}


/* ==========================================
   UPDATE FORM MODE
   ========================================== */

function updateFormMode() {

    const formTitle =
        scheduleFormContainer
            ? scheduleFormContainer.querySelector("h2")
            : null;

    const formDescription =
        scheduleFormContainer
            ? scheduleFormContainer.querySelector(
                ".section-header p"
            )
            : null;

    const submitButton =
        scheduleForm
            ? scheduleForm.querySelector(
                'button[type="submit"]'
            )
            : null;


    if (editingScheduleId) {

        if (formTitle) {
            formTitle.textContent =
                "Edit Schedule";
        }

        if (formDescription) {
            formDescription.textContent =
                "Update the media team schedule.";
        }

        if (submitButton) {
            submitButton.textContent =
                "Update Schedule";
        }

    } else {

        if (formTitle) {
            formTitle.textContent =
                "Create Schedule";
        }

        if (formDescription) {
            formDescription.textContent =
                "Add a new media team schedule.";
        }

        if (submitButton) {
            submitButton.textContent =
                "Save Schedule";
        }

    }

}


/* ==========================================
   CREATE BUTTONS
   ========================================== */

if (createScheduleBtn) {

    createScheduleBtn.addEventListener(
        "click",
        function () {

            editingScheduleId = null;

            if (scheduleForm) {
                scheduleForm.reset();
            }

            updateFormMode();

            showScheduleForm();

        }
    );

}


if (createScheduleEmptyBtn) {

    createScheduleEmptyBtn.addEventListener(
        "click",
        function () {

            editingScheduleId = null;

            if (scheduleForm) {
                scheduleForm.reset();
            }

            updateFormMode();

            showScheduleForm();

        }
    );

}


if (cancelScheduleBtn) {

    cancelScheduleBtn.addEventListener(
        "click",
        hideScheduleForm
    );

}


/* ==========================================
   SAVE / UPDATE SCHEDULE
   ========================================== */

if (scheduleForm) {

    scheduleForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const title =
                document.getElementById(
                    "eventName"
                ).value.trim();

            const eventDate =
                document.getElementById(
                    "scheduleDate"
                ).value;

            const startTime =
                document.getElementById(
                    "startTime"
                ).value;

            const endTime =
                document.getElementById(
                    "endTime"
                ).value;

            const location =
                document.getElementById(
                    "location"
                ).value.trim();

            const description =
                document.getElementById(
                    "description"
                ).value.trim();


            if (
                !title ||
                !eventDate ||
                !startTime ||
                !endTime ||
                !location
            ) {

                alert(
                    "Please complete all required fields."
                );

                return;

            }


            if (endTime <= startTime) {

                alert(
                    "End time must be later than start time."
                );

                return;

            }


            const {
                data: { user },
                error: userError
            } =
                await supabaseClient.auth.getUser();


            if (userError || !user) {

                alert(
                    "You are not logged in."
                );

                return;

            }


            /* ==================================
               UPDATE EXISTING SCHEDULE
               ================================== */

            if (editingScheduleId) {

                const {
                    data,
                    error
                } = await supabaseClient
                    .from("schedules")
                    .update({
                        title: title,
                        event_date: eventDate,
                        start_time: startTime,
                        end_time: endTime,
                        location: location,
                        description: description
                    })
                    .eq(
                        "id",
                        editingScheduleId
                    )
                    .select();


                if (error) {

                    console.error(
                        "Schedule update error:",
                        error
                    );

                    alert(
                        "Could not update schedule: " +
                        error.message
                    );

                    return;

                }


                console.log(
                    "Schedule updated:",
                    data
                );


                alert(
                    "Schedule updated successfully!"
                );


                editingScheduleId = null;

                scheduleForm.reset();

                updateFormMode();

                hideScheduleForm();

                loadSchedules();

                return;

            }


            /* ==================================
               CREATE NEW SCHEDULE
               ================================== */

            const {
                data,
                error
            } = await supabaseClient
                .from("schedules")
                .insert([
                    {
                        title: title,
                        event_date: eventDate,
                        start_time: startTime,
                        end_time: endTime,
                        location: location,
                        description: description,
                        created_by: user.id
                    }
                ])
                .select();


            if (error) {

                console.error(
                    "Schedule save error:",
                    error
                );

                alert(
                    "Could not save schedule: " +
                    error.message
                );

                return;

            }


            console.log(
                "Schedule created:",
                data
            );


            alert(
                "Schedule created successfully!"
            );


            scheduleForm.reset();

            hideScheduleForm();

            loadSchedules();

        }
    );

}


/* ==========================================
   LOAD SCHEDULES
   ========================================== */

async function loadSchedules() {

    if (!scheduleList) {
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
            "Schedule loading error:",
            error
        );

        return;

    }


    if (!schedules || schedules.length === 0) {

        scheduleList.innerHTML = `
            <div class="empty-state">

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
                    id="createScheduleEmptyBtn">

                    Create Schedule

                </button>

            </div>
        `;


        const newButton =
            document.getElementById(
                "createScheduleEmptyBtn"
            );


        if (newButton) {

            newButton.addEventListener(
                "click",
                showScheduleForm
            );

        }


        return;

    }


    /* ======================================
       LOAD PERSONNEL
       ====================================== */

    const {
        data: personnel,
        error: personnelError
    } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .eq("role", "personnel")
        .order("full_name", {
            ascending: true
        });


    if (personnelError) {

        console.error(
            "Personnel loading error:",
            personnelError
        );

        return;

    }


    /* ======================================
       LOAD ASSIGNMENTS
       ====================================== */

    const {
        data: assignments,
        error: assignmentError
    } = await supabaseClient
        .from("assignments")
        .select(
            "id, schedule_id, personnel_id"
        );


    if (assignmentError) {

        console.error(
            "Assignment loading error:",
            assignmentError
        );

        return;

    }


    scheduleList.innerHTML = "";


    /* ======================================
       DISPLAY SCHEDULES
       ====================================== */

    schedules.forEach(
        function (schedule) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "schedule-row";


            /* FIND ASSIGNMENTS */

            const scheduleAssignments =
                assignments.filter(
                    function (item) {

                        return item.schedule_id ===
                            schedule.id;

                    }
                );


            let personnelHTML = "";


            if (
                scheduleAssignments.length > 0
            ) {

                const names =
                    scheduleAssignments.map(
                        function (assignment) {

                            const person =
                                personnel.find(
                                    function (person) {

                                        return person.id ===
                                            assignment.personnel_id;

                                    }
                                );


                            return person
                                ? person.full_name
                                : "Unknown";

                        }
                    );


                personnelHTML = `
                    <span>
                        ${names.join(", ")}
                    </span>
                `;

            } else {

                personnelHTML = `
                    <select
                        class="personnel-select"
                        data-schedule-id="${schedule.id}">

                        <option value="">
                            Select Personnel
                        </option>

                        ${
                            personnel.map(
                                function (person) {

                                    return `
                                        <option value="${person.id}">
                                            ${person.full_name}
                                        </option>
                                    `;

                                }
                            ).join("")
                        }

                    </select>

                    <button
                        type="button"
                        class="primary-button assign-button"
                        data-schedule-id="${schedule.id}">

                        Assign

                    </button>
                `;

            }


            /* ==================================
               ROW HTML
               ================================== */

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

                    ${personnelHTML}

                    <div
                        style="
                            margin-top: 8px;
                            display: flex;
                            gap: 6px;
                            flex-wrap: wrap;
                        "
                    >

                        <button
                            type="button"
                            class="primary-button edit-schedule-button"
                            data-schedule-id="${schedule.id}">

                            Edit

                        </button>


                        <button
                            type="button"
                            class="primary-button delete-schedule-button"
                            data-schedule-id="${schedule.id}"
                            style="
                                background: #b42318;
                            ">

                            Delete

                        </button>

                    </div>

                </div>

            `;


            scheduleList.appendChild(
                row
            );

        }
    );


    /* ======================================
       ASSIGN BUTTONS
       ====================================== */

    const assignButtons =
        document.querySelectorAll(
            ".assign-button"
        );


    assignButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                assignPersonnel
            );

        }
    );


    /* ======================================
       EDIT BUTTONS
       ====================================== */

    const editButtons =
        document.querySelectorAll(
            ".edit-schedule-button"
        );


    editButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                editSchedule
            );

        }
    );


    /* ======================================
       DELETE BUTTONS
       ====================================== */

    const deleteButtons =
        document.querySelectorAll(
            ".delete-schedule-button"
        );


    deleteButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                deleteSchedule
            );

        }
    );

}


/* ==========================================
   ASSIGN PERSONNEL
   ========================================== */

async function assignPersonnel(event) {

    const button =
        event.currentTarget;


    const scheduleId =
        button.dataset.scheduleId;


    const select =
        document.querySelector(
            `.personnel-select[data-schedule-id="${scheduleId}"]`
        );


    if (!select || !select.value) {

        alert(
            "Please select a personnel member."
        );

        return;

    }


    const personnelId =
        select.value;


    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    if (userError || !user) {

        alert(
            "You are not logged in."
        );

        return;

    }


    button.disabled = true;

    button.textContent =
        "Assigning...";


    const {
        data,
        error
    } = await supabaseClient
        .from("assignments")
        .insert([
            {
                schedule_id: scheduleId,
                personnel_id: personnelId
            }
        ])
        .select();


    if (error) {

        console.error(
            "Assignment error:",
            error
        );

        alert(
            "Could not assign personnel: " +
            error.message
        );


        button.disabled = false;

        button.textContent =
            "Assign";

        return;

    }


    console.log(
        "Assignment created:",
        data
    );


    alert(
        "Personnel assigned successfully!"
    );


    loadSchedules();

}


/* ==========================================
   EDIT SCHEDULE
   ========================================== */

async function editSchedule(event) {

    const button =
        event.currentTarget;


    const scheduleId =
        button.dataset.scheduleId;


    const {
        data: schedule,
        error
    } = await supabaseClient
        .from("schedules")
        .select("*")
        .eq("id", scheduleId)
        .single();


    if (error) {

        console.error(
            "Could not load schedule:",
            error
        );

        alert(
            "Could not load schedule: " +
            error.message
        );

        return;

    }


    editingScheduleId =
        schedule.id;


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


    updateFormMode();

    showScheduleForm();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ==========================================
   DELETE SCHEDULE
   ========================================== */

async function deleteSchedule(event) {

    const button =
        event.currentTarget;


    const scheduleId =
        button.dataset.scheduleId;


    const confirmed =
        confirm(
            "Are you sure you want to delete this schedule?\n\nThis will also remove its personnel assignments."
        );


    if (!confirmed) {
        return;
    }


    button.disabled = true;

    button.textContent =
        "Deleting...";


    /* ======================================
       DELETE ASSIGNMENTS FIRST
       ====================================== */

    const {
        error: assignmentDeleteError
    } = await supabaseClient
        .from("assignments")
        .delete()
        .eq(
            "schedule_id",
            scheduleId
        );


    if (assignmentDeleteError) {

        console.error(
            "Assignment delete error:",
            assignmentDeleteError
        );

        alert(
            "Could not delete schedule assignments: " +
            assignmentDeleteError.message
        );


        button.disabled = false;

        button.textContent =
            "Delete";

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


        button.disabled = false;

        button.textContent =
            "Delete";

        return;

    }


    alert(
        "Schedule deleted successfully!"
    );


    loadSchedules();

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
   INITIAL LOAD
   ========================================== */

updateFormMode();

loadSchedules();
