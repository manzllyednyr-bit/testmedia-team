const profileName = document.getElementById("profileName");
const profileInitial = document.getElementById("profileInitial");
const scheduleSubtitle = document.getElementById("scheduleSubtitle");
const myScheduleList = document.getElementById("myScheduleList");
const scheduleSearch = document.getElementById("scheduleSearch");
const scheduleFilter = document.getElementById("scheduleFilter");
const scheduleSummary = document.getElementById("scheduleSummary");
const scheduleDetailsModal = document.getElementById("scheduleDetailsModal");
const detailsContent = document.getElementById("detailsContent");

let assignedSchedules = [];

const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
const parseDate = value => new Date(`${value}T00:00:00`);
const formatDate = value => parseDate(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function formatTime(schedule) {
    const format = time => {
        if (!time) return "—";
        const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
        return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    };
    return `${format(schedule.start_time)} – ${format(schedule.end_time)}`;
}

function assignedHours(schedule) {
    if (!schedule.start_time || !schedule.end_time) return 0;
    const [startHour, startMinute] = schedule.start_time.slice(0, 5).split(":").map(Number);
    const [endHour, endMinute] = schedule.end_time.slice(0, 5).split(":").map(Number);
    let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    if (minutes < 0) minutes += 1440;
    return minutes / 60;
}

function formatHours(hours) { return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`; }

function showError(message) { myScheduleList.innerHTML = `<div class="empty-state"><h3>${escapeHTML(message)}</h3></div>`; }

async function loadSchedules() {
    if (typeof supabaseClient === "undefined") return showError("Supabase is not connected. Check script.js.");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) return window.location.replace("index.html");
    const { data: profile, error: profileError } = await supabaseClient.from("profiles").select("id, full_name, role").eq("id", user.id).maybeSingle();
    if (profileError || !profile) return showError("Your personnel profile could not be loaded.");
    if (profile.role && profile.role.toLowerCase() !== "personnel") return window.location.replace("admin.html");
    const name = profile.full_name || "Personnel";
    profileName.textContent = name; profileInitial.textContent = name.charAt(0).toUpperCase(); scheduleSubtitle.textContent = `${name}'s assigned media duties.`;
    const { data: assignments, error: assignmentError } = await supabaseClient.from("assignments").select("schedule_id").eq("personnel_id", user.id);
    if (assignmentError) return showError(`Could not load assignments: ${assignmentError.message}`);
    const ids = [...new Set((assignments || []).map(item => item.schedule_id).filter(Boolean))];
    if (ids.length) {
        const { data, error } = await supabaseClient.from("schedules").select("id, title, event_date, start_time, end_time, location, description, equipment, status, remarks").in("id", ids).order("event_date", { ascending: true }).order("start_time", { ascending: true });
        if (error) return showError(`Could not load schedules: ${error.message}`);
        assignedSchedules = data || [];
    }
    renderSchedules();
}

function visibleSchedules() {
    const term = scheduleSearch.value.trim().toLowerCase(); const filter = scheduleFilter.value;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return assignedSchedules.filter(schedule => {
        const date = parseDate(schedule.event_date);
        const matchesFilter = filter === "all" || (filter === "upcoming" && date >= today) || (filter === "past" && date < today);
        const haystack = `${schedule.title || ""} ${schedule.location || ""} ${schedule.description || ""}`.toLowerCase();
        return matchesFilter && (!term || haystack.includes(term));
    });
}

function renderSchedules() {
    const schedules = visibleSchedules();
    const hours = schedules.reduce((total, schedule) => total + assignedHours(schedule), 0);
    scheduleSummary.textContent = `${schedules.length} schedule${schedules.length === 1 ? "" : "s"} · ${formatHours(hours)}`;
    if (!schedules.length) { myScheduleList.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><h3>No schedules found</h3><p>Try changing the search or filter.</p></div>'; return; }
    myScheduleList.innerHTML = schedules.map(schedule => `<div class="schedule-row"><span>${escapeHTML(schedule.title)}</span><span>${escapeHTML(formatDate(schedule.event_date))}</span><span>${escapeHTML(formatTime(schedule))}</span><span>${escapeHTML(schedule.location || "—")}</span><span><button type="button" class="details-button" data-schedule-id="${escapeHTML(schedule.id)}">View details</button></span></div>`).join("");
    myScheduleList.querySelectorAll("[data-schedule-id]").forEach(button => button.addEventListener("click", () => showDetails(button.dataset.scheduleId)));
}

function showDetails(id) {
    const schedule = assignedSchedules.find(item => String(item.id) === String(id)); if (!schedule) return;
    const value = item => escapeHTML(item || "Not specified");
    document.getElementById("detailsTitle").textContent = schedule.title || "Schedule Details";
    detailsContent.innerHTML = `<dl class="details-grid"><div><dt>Date</dt><dd>${escapeHTML(formatDate(schedule.event_date))}</dd></div><div><dt>Time</dt><dd>${escapeHTML(formatTime(schedule))}</dd></div><div><dt>Location</dt><dd>${value(schedule.location)}</dd></div><div><dt>Assigned Hours</dt><dd>${formatHours(assignedHours(schedule))}</dd></div><div><dt>Status</dt><dd>${value(schedule.status)}</dd></div><div><dt>Equipment</dt><dd>${value(schedule.equipment)}</dd></div><div class="wide"><dt>Description</dt><dd>${value(schedule.description)}</dd></div><div class="wide"><dt>Remarks</dt><dd>${value(schedule.remarks)}</dd></div></dl>`;
    scheduleDetailsModal.classList.add("open");
}

scheduleSearch.addEventListener("input", renderSchedules);
scheduleFilter.addEventListener("change", renderSchedules);
document.getElementById("closeDetails").addEventListener("click", () => scheduleDetailsModal.classList.remove("open"));
scheduleDetailsModal.addEventListener("click", event => { if (event.target === scheduleDetailsModal) scheduleDetailsModal.classList.remove("open"); });
document.getElementById("logoutButton").addEventListener("click", async () => { if (typeof supabaseClient !== "undefined") await supabaseClient.auth.signOut(); window.location.replace("index.html"); });
loadSchedules();
