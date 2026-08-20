const createScheduleBtn = document.getElementById("createScheduleBtn");
const createScheduleEmptyBtn = document.getElementById("createScheduleEmptyBtn");
const scheduleFormContainer = document.getElementById("scheduleFormContainer");

function showScheduleForm() {
    scheduleFormContainer.style.display = "block";
}

if (createScheduleBtn) {
    createScheduleBtn.addEventListener("click", showScheduleForm);
}

if (createScheduleEmptyBtn) {
    createScheduleEmptyBtn.addEventListener("click", showScheduleForm);
}
