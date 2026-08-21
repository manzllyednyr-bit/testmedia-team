const welcomeMessage = document.getElementById("welcomeMessage");
const profileName = document.getElementById("profileName");
const profileInitial = document.getElementById("profileInitial");
const totalSchedules = document.getElementById("totalSchedules");
const upcomingSchedules = document.getElementById("upcomingSchedules");
const assignedHours = document.getElementById("assignedHours");
const myScheduleList = document.getElementById("myScheduleList");
const calendarDays = document.getElementById("calendarDays");
const calendarMonth = document.getElementById("calendarMonth");
const scheduleDetailsModal = document.getElementById("scheduleDetailsModal");
const detailsContent = document.getElementById("detailsContent");

let mySchedules = [];
let currentMonth = new Date();
currentMonth.setDate(1);

const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
const scheduleDate = value => new Date(`${value}T00:00:00`);
const formatDate = value => scheduleDate(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function formatTime(schedule) {
    const format = time => {
        if (!time) return "—";
        const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
        return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    };
    return `${format(schedule.start_time)} – ${format(schedule.end_time)}`;
}

function getHours(schedule) {
    if (!schedule.start_time || !schedule.end_time) return 0;
    const [startHour, startMinute] = schedule.start_time.slice(0, 5).split(":").map(Number);
    const [endHour, endMinute] = schedule.end_time.slice(0, 5).split(":").map(Number);
    let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    if (minutes < 0) minutes += 1440;
    return minutes / 60;
}

function formatHours(hours) { return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`; }

function showError(message) {
    myScheduleList.innerHTML = `<div class="empty-state"><h3>${escapeHTML(message)}</h3></div>`;
    calendarDays.innerHTML = "";
}

async function loadDashboard() {
    if (!window.supabaseClient) return showError("Supabase is not connected. Check script.js.");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) return window.location.replace("index.html");
    const { data: profile, error: profileError } = await supabaseClient.from("profiles").select("id, full_name, role").eq("id", user.id).maybeSingle();
    if (profileError || !profile) return showError("Your personnel profile could not be loaded.");
    if (profile.role && profile.role.toLowerCase() !== "personnel") return window.location.replace("admin.html");
    const name = profile.full_name || "Personnel";
    welcomeMessage.textContent = `Welcome back, ${name}.`;
    profileName.textContent = name;
    profileInitial.textContent = name.charAt(0).toUpperCase();
    const { data: assignments, error: assignmentError } = await supabaseClient.from("assignments").select("schedule_id").eq("personnel_id", user.id);
    if (assignmentError) return showError(`Could not load assignments: ${assignmentError.message}`);
    const scheduleIds = [...new Set((assignments || []).map(item => item.schedule_id).filter(Boolean))];
    if (scheduleIds.length) {
        const { data, error } = await supabaseClient.from("schedules").select("id, title, event_date, start_time, end_time, location, description, equipment, status, remarks").in("id", scheduleIds).order("event_date", { ascending: true }).order("start_time", { ascending: true });
        if (error) return showError(`Could not load schedules: ${error.message}`);
        mySchedules = data || [];
    }
    renderDashboard();
}

function renderDashboard() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = mySchedules.filter(schedule => scheduleDate(schedule.event_date) >= today);
    totalSchedules.textContent = mySchedules.length;
    upcomingSchedules.textContent = upcoming.length;
    assignedHours.textContent = formatHours(mySchedules.reduce((sum, schedule) => sum + getHours(schedule), 0));
    renderScheduleList(upcoming);
    renderCalendar();
}

function renderScheduleList(upcoming) {
    if (!upcoming.length) {
        myScheduleList.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><h3>No upcoming schedules</h3><p>New assigned duties will appear here.</p></div>';
        return;
    }
    myScheduleList.innerHTML = upcoming.map(schedule => `<div class="schedule-row"><span>${escapeHTML(schedule.title)}</span><span>${escapeHTML(formatDate(schedule.event_date))}</span><span>${escapeHTML(formatTime(schedule))}</span><span>${escapeHTML(schedule.location || "—")}</span><span><button type="button" class="details-button" data-schedule-id="${escapeHTML(schedule.id)}">View details</button></span></div>`).join("");
    bindDetailsButtons(myScheduleList);
}

function renderCalendar() {
    const year = currentMonth.getFullYear(); const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    calendarMonth.textContent = currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    let output = "";
    for (let index = 0; index < firstDay; index += 1) output += '<div class="personnel-calendar-day muted"></div>';
    for (let day = 1; day <= totalDays; day += 1) {
        const date = new Date(year, month, day);
        const schedules = mySchedules.filter(schedule => { const itemDate = scheduleDate(schedule.event_date); return itemDate.getFullYear() === year && itemDate.getMonth() === month && itemDate.getDate() === day; });
        output += `<div class="personnel-calendar-day${date.getTime() === today.getTime() ? " today" : ""}"><div class="day-number">${day}</div>${schedules.map(schedule => `<button type="button" class="calendar-duty" title="${escapeHTML(schedule.title)}" data-schedule-id="${escapeHTML(schedule.id)}">${escapeHTML(schedule.title)}</button>`).join("")}</div>`;
    }
    calendarDays.innerHTML = output;
    bindDetailsButtons(calendarDays);
}

function bindDetailsButtons(container) { container.querySelectorAll("[data-schedule-id]").forEach(button => button.addEventListener("click", () => showDetails(button.dataset.scheduleId))); }

function showDetails(scheduleId) {
    const schedule = mySchedules.find(item => String(item.id) === String(scheduleId)); if (!schedule) return;
    const value = item => escapeHTML(item || "Not specified");
    document.getElementById("detailsTitle").textContent = schedule.title || "Schedule Details";
    detailsContent.innerHTML = `<dl class="details-grid"><div><dt>Date</dt><dd>${escapeHTML(formatDate(schedule.event_date))}</dd></div><div><dt>Time</dt><dd>${escapeHTML(formatTime(schedule))}</dd></div><div><dt>Location</dt><dd>${value(schedule.location)}</dd></div><div><dt>Assigned Hours</dt><dd>${formatHours(getHours(schedule))}</dd></div><div><dt>Status</dt><dd>${value(schedule.status)}</dd></div><div><dt>Equipment</dt><dd>${value(schedule.equipment)}</dd></div><div class="wide"><dt>Description</dt><dd>${value(schedule.description)}</dd></div><div class="wide"><dt>Remarks</dt><dd>${value(schedule.remarks)}</dd></div></dl>`;
    scheduleDetailsModal.classList.add("open");
}

document.getElementById("previousMonth").addEventListener("click", () => { currentMonth.setMonth(currentMonth.getMonth() - 1); renderCalendar(); });
document.getElementById("nextMonth").addEventListener("click", () => { currentMonth.setMonth(currentMonth.getMonth() + 1); renderCalendar(); });
document.getElementById("closeDetails").addEventListener("click", () => scheduleDetailsModal.classList.remove("open"));
scheduleDetailsModal.addEventListener("click", event => { if (event.target === scheduleDetailsModal) scheduleDetailsModal.classList.remove("open"); });
document.getElementById("logoutButton").addEventListener("click", async () => { if (window.supabaseClient) await supabaseClient.auth.signOut(); window.location.replace("index.html"); });
loadDashboard();
