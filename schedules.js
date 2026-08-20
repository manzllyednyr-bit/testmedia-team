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

}


if (createScheduleBtn) {

    createScheduleBtn.addEventListener(
        "click",
        showScheduleForm
    );

}


if (createScheduleEmptyBtn) {

    createScheduleEmptyBtn.addEventListener(
        "click",
        showScheduleForm
    );

}


if (cancelScheduleBtn) {

    cancelScheduleBtn.addEventListener(
        "click",
        hideScheduleForm
    );

}


/* ==========================================
   SAVE SCHEDULE
   ========================================== */

if (scheduleForm) {

    scheduleForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const title =
                document.getElementById("eventName").value.trim();

            const eventDate =
                document.getElementById("scheduleDate").value;

            const startTime =
                document.getElementById("startTime").value;

            const endTime =
                document.getElementById("endTime").value;

            const location =
                document.getElementById("location").value.trim();

            const description =
                document.getElementById("description").value.trim();


            if (
                !title ||
                !eventDate ||
                !startTime ||
                !endTime ||
                !location
            ) {

                alert("Please complete all required fields.");

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
            } = await supabaseClient.auth.getUser();


            if (userError || !user) {

                alert("You are not logged in.");

                return;

            }


            const { data, error } =
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

                <h3>No schedules yet</h3>

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


    /* LOAD PERSONNEL */

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


    /* LOAD ASSIGNMENTS */

    const {
        data: assignments,
        error: assignmentError
    } = await supabaseClient
        .from("assignments")
        .select("id, schedule_id, personnel_id");


    if (assignmentError) {

        console.error(
            "Assignment loading error:",
            assignmentError
        );

        return;

    }


    scheduleList.innerHTML = "";


    schedules.forEach(function (schedule) {

        const row =
            document.createElement("div");

        row.className = "schedule-row";


        /* FIND ASSIGNMENT */

        const assignment =
            assignments.find(function (item) {

                return item.schedule_id === schedule.id;

            });


        let personnelHTML = "";


        if (assignment) {

            const assignedPerson =
                personnel.find(function (person) {

                    return person.id ===
                        assignment.personnel_id;

                });


            personnelHTML = `
                <span>
                    ${
                        assignedPerson
                            ? assignedPerson.full_name
                            : "Assigned"
                    }
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
                        personnel.map(function (person) {

                            return `
                                <option value="${person.id}">
                                    ${person.full_name}
                                </option>
                            `;

                        }).join("")
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


        row.innerHTML = `

            <div>
                ${schedule.title}
            </div>

            <div>
                ${schedule.event_date}
            </div>

            <div>
                ${formatTime(schedule.start_time)}
                -
                ${formatTime(schedule.end_time)}
            </div>

            <div>
                ${schedule.location}
            </div>

            <div>
                ${personnelHTML}
            </div>

        `;


        scheduleList.appendChild(row);

    });


    /* ASSIGN BUTTONS */

    const assignButtons =
        document.querySelectorAll(
            ".assign-button"
        );


    assignButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            assignPersonnel
        );

    });

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
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        alert("You are not logged in.");

        return;

    }


    button.disabled = true;

    button.textContent = "Assigning...";


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

        button.textContent = "Assign";

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
   FORMAT TIME
   ========================================== */

function formatTime(time) {

    if (!time) {
        return "";
    }


    const parts =
        time.split(":");


    let hour =
        parseInt(parts[0]);


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
   INITIAL LOAD
   ========================================== */

loadSchedules();
