const createScheduleBtn = document.getElementById("createScheduleBtn");
const createScheduleEmptyBtn = document.getElementById("createScheduleEmptyBtn");
const cancelScheduleBtn = document.getElementById("cancelScheduleBtn");

const scheduleFormContainer = document.getElementById("scheduleFormContainer");

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
