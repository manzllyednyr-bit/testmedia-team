console.log("SCHEDULE SCRIPT LOADED");

const createScheduleBtn = document.getElementById("createScheduleBtn");
const createScheduleEmptyBtn = document.getElementById("createScheduleEmptyBtn");
const cancelScheduleBtn = document.getElementById("cancelScheduleBtn");

const scheduleFormContainer = document.getElementById("scheduleFormContainer");
const scheduleForm = document.getElementById("scheduleForm");
const scheduleList = document.getElementById("scheduleList");


function showScheduleForm() {
    scheduleFormContainer.style.display = "block";
}


function hideScheduleForm() {
    scheduleFormContainer.style.display = "none";
}


if (createScheduleBtn) {
    createScheduleBtn.addEventListener("click", showScheduleForm);
}


if (createScheduleEmptyBtn) {
    createScheduleEmptyBtn.addEventListener("click", showScheduleForm);
}


if (cancelScheduleBtn) {
    cancelScheduleBtn.addEventListener("click", hideScheduleForm);
}


/* ==========================================
   SAVE SCHEDULE
   ========================================== */

if (scheduleForm) {

    scheduleForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const title = document.getElementById("eventName").value.trim();
        const eventDate = document.getElementById("scheduleDate").value;
        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;
        const location = document.getElementById("location").value.trim();
        const description = document.getElementById("description").value.trim();


        if (!title || !eventDate || !startTime || !endTime || !location) {

            alert("Please complete all required fields.");

            return;
        }


        if (endTime <= startTime) {

            alert("End time must be later than start time.");

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


        const { data, error } = await supabaseClient
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

            console.error("Schedule save error:", error);

            alert("Could not save schedule: " + error.message);

            return;
        }


        console.log("Schedule created:", data);

        alert("Schedule created successfully!");


        scheduleForm.reset();

        hideScheduleForm();

        loadSchedules();

    });

}


/* ==========================================
   LOAD SCHEDULES
   ========================================== */

async function loadSchedules() {

    const { data, error } = await supabaseClient
        .from("schedules")
        .select("*")
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });


    if (error) {

        console.error("Schedule loading error:", error);

        return;
    }


    if (!data || data.length === 0) {

        scheduleList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📅
                </div>

                <h3>No schedules yet</h3>

                <p>
                    Create your first media schedule to get started.
                </p>

                <button
                    type="button"
                    class="primary-button"
                    id="createScheduleEmptyBtn">
                    Create Schedule
                </button>

            </div>
        `;

        const newButton = document.getElementById("createScheduleEmptyBtn");

        if (newButton) {
            newButton.addEventListener("click", showScheduleForm);
        }

        return;
    }


    scheduleList.innerHTML = "";


    data.forEach(function (schedule) {

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

        scheduleList.appendChild(row);

    });

}


/* ==========================================
   FORMAT TIME
   ========================================== */

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


/* ==========================================
   INITIAL LOAD
   ========================================== */

loadSchedules();
