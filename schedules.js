console.log("SCHEDULE SCRIPT LOADED");


/* ==========================================
   ELEMENTS
   ========================================== */

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

const trackerList =
    document.getElementById("trackerList");


let editingScheduleId = null;


/* ==========================================
   SHOW / HIDE FORM
   ========================================== */

function showScheduleForm() {

    const createScheduleContent =
        document.getElementById(
            "createScheduleContent"
        );

    const toggleCreateBtn =
        document.getElementById(
            "toggleCreateBtn"
        );


    if (createScheduleContent) {

        createScheduleContent.classList.add(
            "open"
        );

    }


    if (toggleCreateBtn) {

        toggleCreateBtn.innerHTML =
            'Hide <span class="collapse-arrow open">▼</span>';

    }


    if (scheduleFormContainer) {

        scheduleFormContainer.style.display =
            "block";

    }

}


function hideScheduleForm() {

    const createScheduleContent =
        document.getElementById(
            "createScheduleContent"
        );

    const toggleCreateBtn =
        document.getElementById(
            "toggleCreateBtn"
        );


    if (createScheduleContent) {

        createScheduleContent.classList.remove(
            "open"
        );

    }


    if (toggleCreateBtn) {

        toggleCreateBtn.innerHTML =
            'Show <span class="collapse-arrow">▼</span>';

    }


    if (scheduleFormContainer) {

        scheduleFormContainer.style.display =
            "none";

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
               UPDATE
               ================================== */

            if (editingScheduleId) {

                const {
                    data,
                    error
                } =
                    await supabaseClient
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


                editingScheduleId =
                    null;


                scheduleForm.reset();

                updateFormMode();

                hideScheduleForm();

                loadSchedules();

                return;

            }


            /* ==================================
               CREATE
               ================================== */

            const {
                data,
                error
            } =
                await supabaseClient
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
    } =
        await supabaseClient
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
            );


    if (error) {

        console.error(
            "Schedule loading error:",
            error
        );

        return;

    }


    /* ======================================
       LOAD PERSONNEL
       ====================================== */

    const {
        data: personnel,
        error: personnelError
    } =
        await supabaseClient
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
            );


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
    } =
        await supabaseClient
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


    /* ======================================
       LOAD NORMAL SCHEDULE LIST
       ====================================== */

    if (
        !schedules ||
        schedules.length === 0
    ) {

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
                function () {

                    editingScheduleId =
                        null;

                    if (scheduleForm) {

                        scheduleForm.reset();

                    }

                    updateFormMode();

                    showScheduleForm();

                }
            );

        }


        /* LOAD EMPTY TRACKER */

        renderScheduleTracker(
            [],
            personnel,
            assignments
        );


        return;

    }


    scheduleList.innerHTML = "";


    /* ======================================
       DISPLAY NORMAL SCHEDULES
       ====================================== */

    schedules.forEach(
        function (schedule) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "schedule-row";


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

                    <div class="assigned-personnel">

                        <strong>
                            Assigned:
                        </strong>

                        <div>

                            ${names
                                .map(
                                    function (name) {

                                        return `
                                            <span
                                                style="
                                                    display: inline-block;
                                                    background: #e8f1fa;
                                                    color: #123f6d;
                                                    padding: 5px 8px;
                                                    border-radius: 6px;
                                                    margin: 3px 3px 3px 0;
                                                    font-size: 12px;
                                                "
                                            >
                                                ${escapeHTML(
                                                    name
                                                )}
                                            </span>
                                        `;

                                    }
                                )
                                .join("")
                            }

                        </div>

                    </div>

                `;

            } else {

                personnelHTML = `

                    <div
                        style="
                            color: #777;
                            margin-bottom: 8px;
                        "
                    >
                        Unassigned
                    </div>

                `;

            }


            row.innerHTML = `

                <div>
                    ${escapeHTML(
                        schedule.title
                    )}
                </div>

                <div>
                    ${escapeHTML(
                        schedule.event_date
                    )}
                </div>

                <div>
                    ${formatTime(
                        schedule.start_time
                    )}
                    -
                    ${formatTime(
                        schedule.end_time
                    )}
                </div>

                <div>
                    ${escapeHTML(
                        schedule.location
                    )}
                </div>

                <div>

                    ${personnelHTML}

                    <button
                        type="button"
                        class="primary-button manage-personnel-button"
                        data-schedule-id="${schedule.id}"
                        style="
                            margin-top: 8px;
                        "
                    >
                        Manage Personnel
                    </button>


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
                            data-schedule-id="${schedule.id}"
                        >
                            Edit
                        </button>


                        <button
                            type="button"
                            class="primary-button delete-schedule-button"
                            data-schedule-id="${schedule.id}"
                            style="
                                background: #b42318;
                            "
                        >
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
       MANAGE PERSONNEL BUTTONS
       ====================================== */

    const manageButtons =
        document.querySelectorAll(
            ".manage-personnel-button"
        );


    manageButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const scheduleId =
                        button.dataset.scheduleId;


                    showPersonnelManager(
                        scheduleId,
                        personnel,
                        assignments
                    );

                }
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


    /* ======================================
       LOAD SEPARATE TRACKER
       ====================================== */

    renderScheduleTracker(
        schedules,
        personnel,
        assignments
    );

}


/* ==========================================
   SCHEDULE TRACKER
   ========================================== */

function renderScheduleTracker(
    schedules,
    personnel,
    assignments
) {

    if (!trackerList) {

        return;

    }


    if (
        !schedules ||
        schedules.length === 0
    ) {

        trackerList.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="tracker-empty"
                >

                    <div class="empty-state">

                        <div class="empty-icon">
                            📊
                        </div>

                        <h3>
                            No tracker records yet
                        </h3>

                        <p>
                            Create a schedule first.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    trackerList.innerHTML = "";


    schedules.forEach(
        function (schedule) {

            const scheduleAssignments =
                assignments.filter(
                    function (assignment) {

                        return assignment.schedule_id ===
                            schedule.id;

                    }
                );


            /* ==================================
               HOURS
               ================================== */

            const hours =
                calculateHours(
                    schedule.start_time,
                    schedule.end_time
                );


            const hoursText =
                hours % 1 === 0
                    ? `${hours} hrs`
                    : `${hours.toFixed(2)} hrs`;


            /* ==================================
               MEDIA
               ================================== */

            const mediaNames =
                scheduleAssignments.map(
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


            const mediaText =
                mediaNames.length > 0
                    ? mediaNames.join(", ")
                    : "Unassigned";


            /* ==================================
               COLORGRADER
               ================================== */

            let colorgraderName =
                "Not assigned";


            if (
                schedule.colorgrader_id
            ) {

                const colorgrader =
                    personnel.find(
                        function (person) {

                            return person.id ===
                                schedule.colorgrader_id;

                        }
                    );


                if (colorgrader) {

                    colorgraderName =
                        colorgrader.full_name;

                }

            }


            /* ==================================
               STATUS
               ================================== */

            const currentStatus =
                schedule.status ||
                "Pending/Sorting";


            /* ==================================
               CREATE TRACKER ROW
               ================================== */

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        schedule.event_date
                    )}
                </td>


                <td>
                    <strong>
                        ${escapeHTML(
                            schedule.title
                        )}
                    </strong>
                </td>


                <td>
                    ${hoursText}
                </td>


                <td>
                    ${escapeHTML(
                        mediaText
                    )}
                </td>


                <td>

                    <input
                        type="text"
                        class="tracker-equipment"
                        value="${
                            escapeAttribute(
                                schedule.equipment || ""
                            )
                        }"
                        placeholder="Equipment"
                        data-schedule-id="${schedule.id}"
                    >

                </td>


                <td>

                    <select
                        class="tracker-status"
                        data-schedule-id="${schedule.id}"
                    >

                        <option
                            value="Pending/Sorting"
                            ${currentStatus === "Pending/Sorting"
                                ? "selected"
                                : ""
                            }
                        >
                            Pending/Sorting
                        </option>


                        <option
                            value="In Progress"
                            ${currentStatus === "In Progress"
                                ? "selected"
                                : ""
                            }
                        >
                            In Progress
                        </option>


                        <option
                            value="Completed"
                            ${currentStatus === "Completed"
                                ? "selected"
                                : ""
                            }
                        >
                            Completed
                        </option>


                        <option
                            value="Cancelled"
                            ${currentStatus === "Cancelled"
                                ? "selected"
                                : ""
                            }
                        >
                            Cancelled
                        </option>

                    </select>

                </td>


                <td>

                    <select
                        class="tracker-colorgrader"
                        data-schedule-id="${schedule.id}"
                    >

                        <option value="">
                            Not assigned
                        </option>

                        ${
                            personnel
                                .map(
                                    function (person) {

                                        return `
                                            <option
                                                value="${person.id}"
                                                ${
                                                    schedule.colorgrader_id ===
                                                    person.id
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${escapeHTML(
                                                    person.full_name
                                                )}
                                            </option>
                                        `;

                                    }
                                )
                                .join("")
                        }

                    </select>

                </td>


                <td>

                    <textarea
                        class="tracker-remarks"
                        rows="2"
                        placeholder="Remarks"
                        data-schedule-id="${schedule.id}"
                    >${escapeHTML(
                        schedule.remarks || ""
                    )}</textarea>


                    <button
                        type="button"
                        class="primary-button save-tracker-button"
                        data-schedule-id="${schedule.id}"
                        style="
                            margin-top: 7px;
                            font-size: 12px;
                            padding: 7px 10px;
                        "
                    >
                        Save
                    </button>

                </td>

            `;


            trackerList.appendChild(
                row
            );

        }
    );


    /* ======================================
       TRACKER SAVE BUTTONS
       ====================================== */

    const saveButtons =
        document.querySelectorAll(
            ".save-tracker-button"
        );


    saveButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                saveTrackerRecord
            );

        }
    );

}


/* ==========================================
   SAVE TRACKER RECORD
   ========================================== */

async function saveTrackerRecord(event) {

    const button =
        event.currentTarget;


    const scheduleId =
        button.dataset.scheduleId;


    const equipmentInput =
        document.querySelector(
            `.tracker-equipment[data-schedule-id="${scheduleId}"]`
        );


    const statusInput =
        document.querySelector(
            `.tracker-status[data-schedule-id="${scheduleId}"]`
        );


    const colorgraderInput =
        document.querySelector(
            `.tracker-colorgrader[data-schedule-id="${scheduleId}"]`
        );


    const remarksInput =
        document.querySelector(
            `.tracker-remarks[data-schedule-id="${scheduleId}"]`
        );


    if (
        !equipmentInput ||
        !statusInput ||
        !colorgraderInput ||
        !remarksInput
    ) {

        alert(
            "Could not find tracker fields."
        );

        return;

    }


    button.disabled = true;

    button.textContent =
        "Saving...";


    const equipment =
        equipmentInput.value.trim();


    const status =
        statusInput.value;


    const colorgraderId =
        colorgraderInput.value ||
        null;


    const remarks =
        remarksInput.value.trim();


    const {
        error
    } =
        await supabaseClient
            .from("schedules")
            .update({
                equipment:
                    equipment || null,

                status:
                    status || "Pending/Sorting",

                colorgrader_id:
                    colorgraderId,

                remarks:
                    remarks || null
            })
            .eq(
                "id",
                scheduleId
            );


    if (error) {

        console.error(
            "Tracker save error:",
            error
        );


        alert(
            "Could not save tracker information: " +
            error.message
        );


        button.disabled = false;

        button.textContent =
            "Save";

        return;

    }


    alert(
        "Tracker information saved successfully!"
    );


    button.disabled = false;

    button.textContent =
        "Saved";


    setTimeout(
        function () {

            button.textContent =
                "Save";

        },
        1500
    );

}


/* ==========================================
   PERSONNEL MANAGER
   ========================================== */

function showPersonnelManager(
    scheduleId,
    personnel,
    assignments
) {

    const existingModal =
        document.getElementById(
            "personnelManagerModal"
        );


    if (existingModal) {

        existingModal.remove();

    }


    const assignedIds =
        assignments
            .filter(
                function (assignment) {

                    return assignment.schedule_id ===
                        scheduleId;

                }
            )
            .map(
                function (assignment) {

                    return assignment.personnel_id;

                }
            );


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "personnelManagerModal";


    modal.innerHTML = `

        <div
            style="
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.45);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
            "
        >

            <div
                style="
                    background: white;
                    width: 100%;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                    border-radius: 14px;
                    padding: 30px;
                    position: relative;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.2);
                "
            >

                <button
                    type="button"
                    id="closePersonnelManager"
                    style="
                        position: absolute;
                        top: 12px;
                        right: 18px;
                        border: none;
                        background: transparent;
                        font-size: 28px;
                        color: #667085;
                        cursor: pointer;
                    "
                >
                    ×
                </button>


                <h2
                    style="
                        margin-top: 0;
                        color: #123f6d;
                    "
                >
                    Manage Personnel
                </h2>


                <p
                    style="
                        color: #667085;
                        font-size: 14px;
                    "
                >
                    Select everyone assigned to this schedule.
                </p>


                <div
                    id="personnelCheckboxList"
                    style="
                        margin-top: 20px;
                    "
                >

                    ${
                        personnel.length === 0
                            ? `
                                <p>
                                    No personnel accounts found.
                                </p>
                            `
                            :
                            personnel
                                .map(
                                    function (person) {

                                        const checked =
                                            assignedIds.includes(
                                                person.id
                                            )
                                                ? "checked"
                                                : "";


                                        return `

                                            <label
                                                style="
                                                    display: flex;
                                                    align-items: center;
                                                    gap: 10px;
                                                    padding: 12px;
                                                    margin-bottom: 8px;
                                                    background: #f8fafc;
                                                    border-radius: 8px;
                                                    cursor: pointer;
                                                "
                                            >

                                                <input
                                                    type="checkbox"
                                                    class="personnel-checkbox"
                                                    value="${person.id}"
                                                    ${checked}
                                                >

                                                <span>
                                                    ${escapeHTML(
                                                        person.full_name
                                                    )}
                                                </span>

                                            </label>

                                        `;

                                    }
                                )
                                .join("")
                    }

                </div>


                <div
                    style="
                        margin-top: 20px;
                        display: flex;
                        gap: 10px;
                    "
                >

                    <button
                        type="button"
                        class="primary-button"
                        id="savePersonnelAssignments"
                    >
                        Save Personnel
                    </button>


                    <button
                        type="button"
                        class="primary-button"
                        id="cancelPersonnelManager"
                    >
                        Cancel
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "closePersonnelManager"
        )
        .addEventListener(
            "click",
            function () {

                modal.remove();

            }
        );


    document
        .getElementById(
            "cancelPersonnelManager"
        )
        .addEventListener(
            "click",
            function () {

                modal.remove();

            }
        );


    document
        .getElementById(
            "savePersonnelAssignments"
        )
        .addEventListener(
            "click",
            async function () {

                await savePersonnelAssignments(
                    scheduleId,
                    modal
                );

            }
        );

}


/* ==========================================
   SAVE MULTIPLE PERSONNEL
   ========================================== */

async function savePersonnelAssignments(
    scheduleId,
    modal
) {

    const checkboxes =
        modal.querySelectorAll(
            ".personnel-checkbox"
        );


    const selectedPersonnel =
        Array.from(
            checkboxes
        )
            .filter(
                function (checkbox) {

                    return checkbox.checked;

                }
            )
            .map(
                function (checkbox) {

                    return checkbox.value;

                }
            );


    const saveButton =
        modal.querySelector(
            "#savePersonnelAssignments"
        );


    saveButton.disabled = true;

    saveButton.textContent =
        "Saving...";


    /* DELETE OLD ASSIGNMENTS */

    const {
        error: deleteError
    } =
        await supabaseClient
            .from("assignments")
            .delete()
            .eq(
                "schedule_id",
                scheduleId
            );


    if (deleteError) {

        console.error(
            "Assignment delete error:",
            deleteError
        );


        alert(
            "Could not update personnel: " +
            deleteError.message
        );


        saveButton.disabled = false;

        saveButton.textContent =
            "Save Personnel";

        return;

    }


    /* INSERT NEW ASSIGNMENTS */

    if (
        selectedPersonnel.length > 0
    ) {

        const rows =
            selectedPersonnel.map(
                function (personnelId) {

                    return {
                        schedule_id:
                            scheduleId,

                        personnel_id:
                            personnelId
                    };

                }
            );


        const {
            data,
            error
        } =
            await supabaseClient
                .from("assignments")
                .insert(rows)
                .select();


        if (error) {

            console.error(
                "Assignment save error:",
                error
            );


            alert(
                "Could not save personnel: " +
                error.message
            );


            saveButton.disabled = false;

            saveButton.textContent =
                "Save Personnel";

            return;

        }


        console.log(
            "Personnel assignments saved:",
            data
        );

    }


    alert(
        "Personnel assignments updated successfully!"
    );


    modal.remove();

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
    } =
        await supabaseClient
            .from("schedules")
            .select("*")
            .eq(
                "id",
                scheduleId
            )
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
   
   console.log("DELETE BUTTON CLICKED");

    const button =
        event.currentTarget;


    const scheduleId =
        button.dataset.scheduleId;


    const confirmed =
        confirm(
            "Are you sure you want to delete this schedule?\n\nThis will also remove all personnel assignments."
        );


    if (!confirmed) {

        return;

    }


    button.disabled = true;

    button.textContent =
        "Deleting...";


    /* DELETE ASSIGNMENTS */

    const {
        error: assignmentDeleteError
    } =
        await supabaseClient
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


    /* DELETE SCHEDULE */

    const {
        error
    } =
        await supabaseClient
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
   CALCULATE HOURS
   ========================================== */

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
        startTime.split(":");


    const endParts =
        endTime.split(":");


    const startMinutes =
        (
            parseInt(
                startParts[0],
                10
            ) * 60
        ) +
        parseInt(
            startParts[1],
            10
        );


    const endMinutes =
        (
            parseInt(
                endParts[0],
                10
            ) * 60
        ) +
        parseInt(
            endParts[1],
            10
        );


    const difference =
        endMinutes -
        startMinutes;


    if (difference <= 0) {

        return 0;

    }


    return difference / 60;

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
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ==========================================
   ATTRIBUTE SAFETY
   ========================================== */

function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}


/* ==========================================
   INITIAL LOAD
   ========================================== */

updateFormMode();

loadSchedules();
