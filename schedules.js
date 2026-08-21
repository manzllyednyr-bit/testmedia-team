console.log("SCHEDULE SCRIPT LOADED");

/* ==========================================
   ELEMENTS
   ========================================== */

const createScheduleBtn =
    document.getElementById("createScheduleBtn");

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


/* ==========================================
   PAGE STATE
   ========================================== */

let editingScheduleId = null;
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
        value === null || value === undefined
            ? ""
            : String(value);

    return element.innerHTML;

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
        return "";
    }

    const start =
        startTime.substring(0, 5).split(":");

    const end =
        endTime.substring(0, 5).split(":");

    const startMinutes =
        Number(start[0]) * 60 +
        Number(start[1]);

    const endMinutes =
        Number(end[0]) * 60 +
        Number(end[1]);

    let difference =
        endMinutes - startMinutes;

    if (difference < 0) {
        difference += 24 * 60;
    }

    const hours =
        difference / 60;

    return Number.isInteger(hours)
        ? `${hours} hr${hours === 1 ? "" : "s"}`
        : `${hours.toFixed(1)} hrs`;

}


function getScheduleAssignments(scheduleId) {

    return assignmentsCache.filter(
        function (assignment) {

            return assignment.schedule_id ===
                scheduleId;

        }
    );

}


function getPersonnelNames(scheduleId) {

    const names =
        getScheduleAssignments(scheduleId)
            .map(
                function (assignment) {

                    const person =
                        personnelCache.find(
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

    return names;

}


/* ==========================================
   PERSONNEL NOTIFICATIONS
   ========================================== */

async function createScheduleNotifications(
    recipientIds,
    schedule,
    notificationType,
    message
) {

    const uniqueRecipientIds =
        [...new Set(recipientIds || [])]
            .filter(Boolean);

    if (uniqueRecipientIds.length === 0) {
        return;
    }

    const notifications =
        uniqueRecipientIds.map(
            function (recipientId) {

                return {
                    recipient_id: recipientId,
                    schedule_id: schedule.id,
                    type: notificationType,
                    title: schedule.title,
                    message: message
                };

            }
        );

    const {
        error
    } = await supabaseClient
        .from("notifications")
        .insert(notifications);

    if (error) {

        console.error(
            "Notification creation error:",
            error
        );

    }

}


function openCreateSection() {

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


function closeCreateSection() {

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

}


/* ==========================================
   FORM SHOW / HIDE
   ========================================== */

function showScheduleForm() {

    openCreateSection();

    if (scheduleForm) {

        scheduleForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


function hideScheduleForm() {

    editingScheduleId = null;

    if (scheduleForm) {

        scheduleForm.reset();

    }

    updateFormMode();
    closeCreateSection();

}


/* ==========================================
   FORM MODE
   Works with both the old form container and
   the current collapsible Create Schedule HTML.
   ========================================== */

function updateFormMode() {

    if (!scheduleForm) {
        return;
    }

    const formSection =
        scheduleForm.closest("section");

    const formTitle =
        scheduleFormContainer
            ? scheduleFormContainer.querySelector("h2")
            : formSection
                ? formSection.querySelector(
                    ".collapsible-header h2"
                )
                : null;

    const formDescription =
        scheduleFormContainer
            ? scheduleFormContainer.querySelector(
                ".section-header p"
            )
            : formSection
                ? formSection.querySelector(
                    ".collapsible-header p"
                )
                : null;

    const submitButton =
        scheduleForm.querySelector(
            'button[type="submit"]'
        );

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
   CREATE / CANCEL BUTTONS
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

            const submitButton =
                scheduleForm.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {
                submitButton.disabled = true;
            }

            try {

                if (editingScheduleId) {

                    const {
                        data: updatedSchedule,
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
                        .select()
                        .single();

                    if (error) {
                        throw error;
                    }

                    await createScheduleNotifications(
                        getScheduleAssignments(
                            editingScheduleId
                        ).map(
                            function (assignment) {

                                return assignment.personnel_id;

                            }
                        ),
                        updatedSchedule,
                        "schedule_updated",
                        `The schedule "${title}" has been updated. ` +
                        `Please review the new date, time, or details.`
                    );

                    alert(
                        "Schedule updated successfully!"
                    );

                } else {

                    const {
                        data: authData,
                        error: userError
                    } = await supabaseClient
                        .auth
                        .getUser();

                    const user =
                        authData
                            ? authData.user
                            : null;

                    if (userError || !user) {

                        alert(
                            "You are not logged in."
                        );

                        return;

                    }

                    const {
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
                        ]);

                    if (error) {
                        throw error;
                    }

                    alert(
                        "Schedule created successfully!"
                    );

                }

                hideScheduleForm();
                await loadSchedules();

            } catch (error) {

                console.error(
                    "Schedule save error:",
                    error
                );

                alert(
                    "Could not save schedule: " +
                    error.message
                );

            } finally {

                if (submitButton) {
                    submitButton.disabled = false;
                }

            }

        }
    );

}


/* ==========================================
   LOAD SCHEDULES, PERSONNEL, ASSIGNMENTS
   ========================================== */

async function loadSchedules() {

    try {

        const results =
            await Promise.all([
                supabaseClient
                    .from("schedules")
                    .select("*")
                    .order("event_date", {
                        ascending: true
                    })
                    .order("start_time", {
                        ascending: true
                    }),

                supabaseClient
                    .from("profiles")
                    .select("id, full_name")
                    .eq("role", "personnel")
                    .order("full_name", {
                        ascending: true
                    }),

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

        schedulesCache =
            schedulesResult.data || [];

        personnelCache =
            personnelResult.data || [];

        assignmentsCache =
            assignmentsResult.data || [];

        renderScheduleList();
        renderScheduleTracker();

    } catch (error) {

        console.error(
            "Schedule loading error:",
            error
        );

        if (scheduleList) {

            scheduleList.innerHTML = `
                <div class="empty-state">
                    <h3>Could not load schedules</h3>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;

        }

    }

}


/* ==========================================
   ALL SCHEDULES
   ========================================== */

function renderScheduleList() {

    if (!scheduleList) {
        return;
    }

    if (schedulesCache.length === 0) {

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
                    data-action="create-schedule">

                    Create Schedule

                </button>

            </div>
        `;

        return;

    }

    scheduleList.innerHTML =
        schedulesCache.map(
            function (schedule) {

                const names =
                    getPersonnelNames(
                        schedule.id
                    );

                const personnelHTML =
                    names.length > 0
                        ? `
                            <div class="assigned-personnel">

                                <strong>
                                    Assigned:
                                </strong>

                                <div>
                                    ${names.map(
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
                                                    ">
                                                    ${escapeHTML(name)}
                                                </span>
                                            `;

                                        }
                                    ).join("")}
                                </div>

                            </div>
                        `
                        : `
                            <div
                                style="
                                    color: #777;
                                    margin-bottom: 8px;
                                ">
                                Unassigned
                            </div>
                        `;

                return `
                    <div class="schedule-row">

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

                            <button
                                type="button"
                                class="primary-button"
                                data-action="manage-personnel"
                                data-schedule-id="${schedule.id}"
                                style="margin-top: 8px;">

                                Manage Personnel

                            </button>

                            <div
                                style="
                                    margin-top: 8px;
                                    display: flex;
                                    gap: 6px;
                                    flex-wrap: wrap;
                                ">

                                <button
                                    type="button"
                                    class="primary-button"
                                    data-action="edit-schedule"
                                    data-schedule-id="${schedule.id}">

                                    Edit

                                </button>

                                <button
                                    type="button"
                                    class="primary-button"
                                    data-action="delete-schedule"
                                    data-schedule-id="${schedule.id}"
                                    style="background: #b42318;">

                                    Delete

                                </button>

                            </div>

                        </div>

                    </div>
                `;

            }
        ).join("");

}


/* ==========================================
   EVENT DELEGATION
   Buttons continue working after list renders.
   ========================================== */

if (scheduleList) {

    scheduleList.addEventListener(
        "click",
        async function (event) {

            const button =
                event.target.closest(
                    "button[data-action]"
                );

            if (!button) {
                return;
            }

            const action =
                button.dataset.action;

            const scheduleId =
                button.dataset.scheduleId;

            if (action === "create-schedule") {

                editingScheduleId = null;

                if (scheduleForm) {
                    scheduleForm.reset();
                }

                updateFormMode();
                showScheduleForm();

                return;

            }

            if (action === "edit-schedule") {

                await editSchedule(scheduleId);

                return;

            }

            if (action === "delete-schedule") {

                await deleteSchedule(scheduleId);

                return;

            }

            if (action === "manage-personnel") {

                showPersonnelManager(scheduleId);

            }

        }
    );

}


/* ==========================================
   EDIT SCHEDULE
   ========================================== */

async function editSchedule(scheduleId) {

    let schedule =
        schedulesCache.find(
            function (item) {

                return item.id === scheduleId;

            }
        );

    if (!schedule) {

        const {
            data,
            error
        } = await supabaseClient
            .from("schedules")
            .select("*")
            .eq("id", scheduleId)
            .single();

        if (error) {

            console.error(
                "Schedule loading error:",
                error
            );

            alert(
                "Could not load this schedule: " +
                error.message
            );

            return;

        }

        schedule = data;

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
            ? schedule.start_time.substring(0, 5)
            : "";

    document.getElementById(
        "endTime"
    ).value =
        schedule.end_time
            ? schedule.end_time.substring(0, 5)
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

}


/* ==========================================
   DELETE SCHEDULE
   ========================================== */

async function deleteSchedule(scheduleId) {

    const schedule =
        schedulesCache.find(
            function (item) {

                return item.id === scheduleId;

            }
        );

    const scheduleName =
        schedule
            ? schedule.title
            : "this schedule";

    const shouldDelete =
        confirm(
            `Delete "${scheduleName}"?\n\n` +
            "This also removes its personnel assignments."
        );

    if (!shouldDelete) {
        return;
    }

    try {

        const {
            error: assignmentError
        } = await supabaseClient
            .from("assignments")
            .delete()
            .eq("schedule_id", scheduleId);

        if (assignmentError) {
            throw assignmentError;
        }

        const {
            error: scheduleError
        } = await supabaseClient
            .from("schedules")
            .delete()
            .eq("id", scheduleId);

        if (scheduleError) {
            throw scheduleError;
        }

        alert(
            "Schedule deleted successfully!"
        );

        await loadSchedules();

    } catch (error) {

        console.error(
            "Schedule delete error:",
            error
        );

        alert(
            "Could not delete schedule: " +
            error.message
        );

    }

}


/* ==========================================
   MANAGE MULTIPLE PERSONNEL
   ========================================== */

function showPersonnelManager(scheduleId) {

    const schedule =
        schedulesCache.find(
            function (item) {

                return item.id === scheduleId;

            }
        );

    if (!schedule) {
        return;
    }

    const assignedIds =
        getScheduleAssignments(scheduleId)
            .map(
                function (assignment) {

                    return assignment.personnel_id;

                }
            );

    const existingModal =
        document.getElementById(
            "personnelManagerModal"
        );

    if (existingModal) {
        existingModal.remove();
    }

    const personnelOptions =
        personnelCache.length > 0
            ? personnelCache.map(
                function (person) {

                    const isChecked =
                        assignedIds.includes(person.id)
                            ? "checked"
                            : "";

                    return `
                        <label
                            style="
                                display: block;
                                margin: 10px 0;
                                cursor: pointer;
                            ">

                            <input
                                type="checkbox"
                                name="personnel"
                                value="${person.id}"
                                ${isChecked}>

                            ${escapeHTML(person.full_name)}

                        </label>
                    `;

                }
            ).join("")
            : `
                <p>
                    No personnel accounts were found.
                </p>
            `;

    const modal =
        document.createElement("div");

    modal.id =
        "personnelManagerModal";

    modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div
            style="
                width: 100%;
                max-width: 480px;
                max-height: 80vh;
                overflow-y: auto;
                background: white;
                border-radius: 12px;
                padding: 24px;
                box-sizing: border-box;
            ">

            <h2 style="margin-top: 0;">
                Manage Personnel
            </h2>

            <p>
                ${escapeHTML(schedule.title)}
            </p>

            <form id="personnelManagerForm">

                <div style="margin: 18px 0;">
                    ${personnelOptions}
                </div>

                <button
                    type="submit"
                    class="primary-button">

                    Save Personnel

                </button>

                <button
                    type="button"
                    class="primary-button"
                    data-action="close-personnel-modal"
                    style="
                        margin-left: 8px;
                        background: #777;
                    ">

                    Cancel

                </button>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener(
        "click",
        async function (event) {

            if (
                event.target === modal ||
                event.target.closest(
                    '[data-action="close-personnel-modal"]'
                )
            ) {

                modal.remove();

                return;

            }

            const form =
                event.target.closest(
                    "#personnelManagerForm"
                );

            if (!form || event.type !== "submit") {
                return;
            }

            event.preventDefault();

            const selectedIds =
                Array.from(
                    form.querySelectorAll(
                        'input[name="personnel"]:checked'
                    )
                ).map(
                    function (input) {

                        return input.value;

                    }
                );

            const newlyAssignedIds =
                selectedIds.filter(
                    function (personnelId) {

                        return !assignedIds.includes(
                            personnelId
                        );

                    }
                );

            const saveButton =
                form.querySelector(
                    'button[type="submit"]'
                );

            if (saveButton) {
                saveButton.disabled = true;
            }

            try {

                const {
                    error: deleteError
                } = await supabaseClient
                    .from("assignments")
                    .delete()
                    .eq(
                        "schedule_id",
                        scheduleId
                    );

                if (deleteError) {
                    throw deleteError;
                }

                if (selectedIds.length > 0) {

                    const newAssignments =
                        selectedIds.map(
                            function (personnelId) {

                                return {
                                    schedule_id: scheduleId,
                                    personnel_id: personnelId
                                };

                            }
                        );

                    const {
                        error: insertError
                    } = await supabaseClient
                        .from("assignments")
                        .insert(newAssignments);

                    if (insertError) {
                        throw insertError;
                    }

                }

                await createScheduleNotifications(
                    newlyAssignedIds,
                    schedule,
                    "schedule_assigned",
                    `You have been assigned to "${schedule.title}" on ` +
                    `${schedule.event_date} from ` +
                    `${formatTime(schedule.start_time)} to ` +
                    `${formatTime(schedule.end_time)}.`
                );

                modal.remove();

                alert(
                    "Personnel assignments saved!"
                );

                await loadSchedules();

            } catch (error) {

                console.error(
                    "Personnel assignment error:",
                    error
                );

                alert(
                    "Could not save personnel: " +
                    error.message
                );

            } finally {

                if (saveButton) {
                    saveButton.disabled = false;
                }

            }

        }
    );

}


/* ==========================================
   SCHEDULE TRACKER
   Fields are saved on the schedules table:
   equipment, status, colorgrader_id, remarks.
   ========================================== */

function renderScheduleTracker() {

    if (!trackerList) {
        return;
    }

    if (schedulesCache.length === 0) {

        trackerList.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="tracker-empty">

                    <div class="empty-state">

                        <div class="empty-icon">
                            📊
                        </div>

                        <h3>
                            No tracker records yet
                        </h3>

                        <p>
                            Schedule tracker information
                            will appear here.
                        </p>

                    </div>

                </td>
            </tr>
        `;

        return;

    }

    const colorgraderOptions =
        [
            `<option value="">Select person</option>`,
            ...personnelCache.map(
                function (person) {

                    return `
                        <option value="${person.id}">
                            ${escapeHTML(person.full_name)}
                        </option>
                    `;

                }
            )
        ].join("");

    trackerList.innerHTML =
        schedulesCache.map(
            function (schedule) {

                const names =
                    getPersonnelNames(schedule.id);

                return `
                    <tr data-schedule-id="${schedule.id}">

                        <td>
                            ${escapeHTML(schedule.event_date)}
                        </td>

                        <td>
                            ${escapeHTML(schedule.title)}
                        </td>

                        <td>
                            ${calculateHours(
                                schedule.start_time,
                                schedule.end_time
                            )}
                        </td>

                        <td>
                            ${names.length > 0
                                ? names.map(
                                    escapeHTML
                                ).join(", ")
                                : "Unassigned"
                            }
                        </td>

                        <td>
                            <input
                                type="text"
                                class="tracker-equipment"
                                value="${escapeHTML(
                                    schedule.equipment || ""
                                )}"
                                placeholder="Equipment">
                        </td>

                        <td>
                            <select class="tracker-status">

                                <option value="">
                                    Select status
                                </option>

                                <option
                                    value="Pending"
                                    ${schedule.status === "Pending"
                                        ? "selected"
                                        : ""
                                    }>
                                    Pending
                                </option>

                                <option
                                    value="In Progress"
                                    ${schedule.status === "In Progress"
                                        ? "selected"
                                        : ""
                                    }>
                                    In Progress
                                </option>

                                <option
                                    value="Completed"
                                    ${schedule.status === "Completed"
                                        ? "selected"
                                        : ""
                                    }>
                                    Completed
                                </option>

                                <option
                                    value="Cancelled"
                                    ${schedule.status === "Cancelled"
                                        ? "selected"
                                        : ""
                                    }>
                                    Cancelled
                                </option>

                            </select>
                        </td>

                        <td>
                            <select class="tracker-colorgrader">
                                ${colorgraderOptions}
                            </select>
                        </td>

                        <td>
                            <textarea
                                class="tracker-remarks"
                                rows="2"
                                placeholder="Remarks">${escapeHTML(
                                    schedule.remarks || ""
                                )}</textarea>

                            <button
                                type="button"
                                class="primary-button"
                                data-action="save-tracker"
                                data-schedule-id="${schedule.id}"
                                style="
                                    margin-top: 6px;
                                    font-size: 12px;
                                ">

                                Save

                            </button>
                        </td>

                    </tr>
                `;

            }
        ).join("");

    schedulesCache.forEach(
        function (schedule) {

            const row =
                trackerList.querySelector(
                    `tr[data-schedule-id="${schedule.id}"]`
                );

            if (!row) {
                return;
            }

            const colorgraderSelect =
                row.querySelector(
                    ".tracker-colorgrader"
                );

            if (colorgraderSelect) {

                colorgraderSelect.value =
                    schedule.colorgrader_id || "";

            }

        }
    );

}


if (trackerList) {

    trackerList.addEventListener(
        "click",
        async function (event) {

            const button =
                event.target.closest(
                    '[data-action="save-tracker"]'
                );

            if (!button) {
                return;
            }

            const scheduleId =
                button.dataset.scheduleId;

            const row =
                button.closest("tr");

            if (!row) {
                return;
            }

            const equipment =
                row.querySelector(
                    ".tracker-equipment"
                ).value.trim();

            const status =
                row.querySelector(
                    ".tracker-status"
                ).value;

            const colorgraderId =
                row.querySelector(
                    ".tracker-colorgrader"
                ).value || null;

            const remarks =
                row.querySelector(
                    ".tracker-remarks"
                ).value.trim();

            button.disabled = true;
            button.textContent = "Saving...";

            try {

                const {
                    error
                } = await supabaseClient
                    .from("schedules")
                    .update({
                        equipment: equipment,
                        status: status,
                        colorgrader_id: colorgraderId,
                        remarks: remarks
                    })
                    .eq("id", scheduleId);

                if (error) {
                    throw error;
                }

                button.textContent = "Saved";

                await loadSchedules();

            } catch (error) {

                console.error(
                    "Tracker save error:",
                    error
                );

                alert(
                    "Could not save tracker details: " +
                    error.message
                );

                button.disabled = false;
                button.textContent = "Save";

            }

        }
    );

}


/* ==========================================
   INITIAL LOAD
   ========================================== */

updateFormMode();
loadSchedules();
