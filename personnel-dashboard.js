/* ==========================================
   DASHBOARD ELEMENTS
   ========================================== */

const welcomeMessage =
    document.getElementById("welcomeMessage");

const profileName =
    document.getElementById("profileName");

const profileInitial =
    document.getElementById("profileInitial");

const totalSchedules =
    document.getElementById("totalSchedules");

const upcomingSchedules =
    document.getElementById("upcomingSchedules");

const assignedHours =
    document.getElementById("assignedHours");

const myScheduleList =
    document.getElementById("myScheduleList");

const calendarDays =
    document.getElementById("calendarDays");

const calendarMonth =
    document.getElementById("calendarMonth");

const scheduleDetailsModal =
    document.getElementById("scheduleDetailsModal");

const detailsContent =
    document.getElementById("detailsContent");


/* ==========================================
   NOTIFICATION ELEMENTS
   ========================================== */

const notificationButton =
    document.getElementById(
        "notificationButton"
    );

const notificationBadge =
    document.getElementById(
        "notificationBadge"
    );

const notificationPanel =
    document.getElementById(
        "notificationPanel"
    );

const notificationList =
    document.getElementById(
        "notificationList"
    );

const markAllReadButton =
    document.getElementById(
        "markAllReadButton"
    );


/* ==========================================
   PAGE STATE
   ========================================== */

let mySchedules = [];

let myNotifications = [];

let currentUserId = null;

let currentMonth = new Date();

currentMonth.setDate(1);


/* ==========================================
   HELPERS
   ========================================== */

const escapeHTML =
    value =>
        String(
            value ?? ""
        ).replace(
            /[&<>'"]/g,
            character =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "'": "&#039;",
                    '"': "&quot;"
                }[character])
        );


const scheduleDate =
    value =>
        new Date(
            `${value}T00:00:00`
        );


const formatDate =
    value =>
        scheduleDate(value)
            .toLocaleDateString(
                undefined,
                {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }
            );


function formatTime(schedule) {

    const format =
        time => {

            if (!time) {
                return "Not specified";
            }

            const [
                hours,
                minutes
            ] =
                time
                    .slice(0, 5)
                    .split(":")
                    .map(Number);

            return new Date(
                2000,
                0,
                1,
                hours,
                minutes
            ).toLocaleTimeString(
                undefined,
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );

        };

    return `${format(schedule.start_time)} - ${format(schedule.end_time)}`;

}


function getHours(schedule) {

    if (
        !schedule.start_time ||
        !schedule.end_time
    ) {

        return 0;

    }

    const [
        startHour,
        startMinute
    ] =
        schedule.start_time
            .slice(0, 5)
            .split(":")
            .map(Number);

    const [
        endHour,
        endMinute
    ] =
        schedule.end_time
            .slice(0, 5)
            .split(":")
            .map(Number);

    let minutes =
        endHour * 60 +
        endMinute -
        (
            startHour * 60 +
            startMinute
        );

    if (minutes < 0) {

        minutes += 1440;

    }

    return minutes / 60;

}


function formatHours(hours) {

    return `${Number.isInteger(hours)
        ? hours
        : hours.toFixed(1)} hrs`;

}


function showError(message) {

    myScheduleList.innerHTML =
        `
            <div class="empty-state">

                <h3>
                    ${escapeHTML(message)}
                </h3>

            </div>
        `;

    calendarDays.innerHTML = "";

}


/* ==========================================
   LOAD DASHBOARD
   ========================================== */

async function loadDashboard() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        showError(
            "Supabase is not connected. Check script.js."
        );

        return;

    }


    const {
        data: {
            user
        },
        error: authError
    } =
        await supabaseClient.auth.getUser();


    if (
        authError ||
        !user
    ) {

        window.location.replace(
            "index.html"
        );

        return;

    }


    currentUserId =
        user.id;


    /* ======================================
       LOAD PROFILE
       ====================================== */

    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, full_name, role"
            )
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


    if (
        profileError ||
        !profile
    ) {

        showError(
            "Your personnel profile could not be loaded."
        );

        return;

    }


    if (
        profile.role &&
        profile.role.toLowerCase() !==
            "personnel"
    ) {

        window.location.replace(
            "admin.html"
        );

        return;

    }


    const name =
        profile.full_name ||
        "Personnel";


    welcomeMessage.textContent =
        `Welcome back, ${name}.`;

    profileName.textContent =
        name;

    profileInitial.textContent =
        name
            .charAt(0)
            .toUpperCase();


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
                "schedule_id"
            )
            .eq(
                "personnel_id",
                user.id
            );


    if (assignmentError) {

        showError(
            `Could not load assignments: ${assignmentError.message}`
        );

        return;

    }


    const scheduleIds =
        [
            ...new Set(
                (assignments || [])
                    .map(
                        item =>
                            item.schedule_id
                    )
                    .filter(Boolean)
            )
        ];


    /* ======================================
       LOAD SCHEDULES
       ====================================== */

    if (
        scheduleIds.length
    ) {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("schedules")
                .select(
                    `
                    id,
                    title,
                    event_date,
                    start_time,
                    end_time,
                    location,
                    description,
                    equipment,
                    status,
                    remarks
                    `
                )
                .in(
                    "id",
                    scheduleIds
                )
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

            showError(
                `Could not load schedules: ${error.message}`
            );

            return;

        }


        mySchedules =
            data || [];

    } else {

        mySchedules = [];

    }


    /* ======================================
       LOAD NOTIFICATIONS
       ====================================== */

    await loadNotifications();


    /* ======================================
       RENDER DASHBOARD
       ====================================== */

    renderDashboard();

}


/* ==========================================
   LOAD NOTIFICATIONS
   ========================================== */

async function loadNotifications() {

    if (!currentUserId) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("notifications")
            .select(
                `
                id,
                recipient_id,
                schedule_id,
                type,
                title,
                message,
                is_read,
                created_at
                `
            )
            .eq(
                "recipient_id",
                currentUserId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Notification loading error:",
            error
        );

        return;

    }


    myNotifications =
        data || [];


    renderNotifications();

}


/* ==========================================
   RENDER NOTIFICATIONS
   ========================================== */

function renderNotifications() {

    if (!notificationList) {
        return;
    }


    const unreadCount =
        myNotifications.filter(
            notification =>
                !notification.is_read
        ).length;


    /* ======================================
       BADGE
       ====================================== */

    if (notificationBadge) {

        if (unreadCount > 0) {

            notificationBadge.textContent =
                unreadCount > 99
                    ? "99+"
                    : unreadCount;

            notificationBadge.classList.add(
                "show"
            );

        } else {

            notificationBadge.classList.remove(
                "show"
            );

        }

    }


    /* ======================================
       EMPTY STATE
       ====================================== */

    if (
        myNotifications.length === 0
    ) {

        notificationList.innerHTML =
            `
                <div class="notification-empty">

                    🔔

                    <br><br>

                    No notifications yet.

                </div>
            `;

        return;

    }


    /* ======================================
       NOTIFICATION LIST
       ====================================== */

    notificationList.innerHTML =
        myNotifications
            .map(
                function (notification) {

                    const readClass =
                        notification.is_read
                            ? "read"
                            : "unread";


                    return `
                        <div
                            class="
                                notification-item
                                ${readClass}
                            "
                            data-notification-id="${escapeHTML(
                                notification.id
                            )}"
                            data-schedule-id="${escapeHTML(
                                notification.schedule_id || ""
                            )}">

                            <div
                                class="notification-item-title">

                                <span
                                    class="notification-dot">
                                </span>

                                ${escapeHTML(
                                    notification.title ||
                                    "Notification"
                                )}

                            </div>


                            <div
                                class="notification-message">

                                ${escapeHTML(
                                    notification.message ||
                                    ""
                                )}

                            </div>


                            <div
                                class="notification-time">

                                ${formatNotificationTime(
                                    notification.created_at
                                )}

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


/* ==========================================
   NOTIFICATION TIME
   ========================================== */

function formatNotificationTime(
    createdAt
) {

    if (!createdAt) {
        return "";
    }


    const date =
        new Date(createdAt);

    const now =
        new Date();

    const difference =
        Math.floor(
            (
                now.getTime() -
                date.getTime()
            ) / 1000
        );


    if (difference < 60) {

        return "Just now";

    }


    if (difference < 3600) {

        const minutes =
            Math.floor(
                difference / 60
            );

        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

    }


    if (difference < 86400) {

        const hours =
            Math.floor(
                difference / 3600
            );

        return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    }


    if (difference < 604800) {

        const days =
            Math.floor(
                difference / 86400
            );

        return `${days} day${days === 1 ? "" : "s"} ago`;

    }


    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


/* ==========================================
   NOTIFICATION CLICK
   ========================================== */

if (notificationList) {

    notificationList.addEventListener(
        "click",
        async function (event) {

            const item =
                event.target.closest(
                    ".notification-item"
                );


            if (!item) {
                return;
            }


            const notificationId =
                item.dataset.notificationId;


            const scheduleId =
                item.dataset.scheduleId;


            await markNotificationRead(
                notificationId
            );


            if (scheduleId) {

                showDetails(
                    scheduleId
                );

            }


            closeNotificationPanel();

        }
    );

}


/* ==========================================
   MARK ONE NOTIFICATION AS READ
   ========================================== */

async function markNotificationRead(
    notificationId
) {

    if (!notificationId) {
        return;
    }


    const notification =
        myNotifications.find(
            item =>
                String(item.id) ===
                String(notificationId)
        );


    if (!notification) {
        return;
    }


    if (notification.is_read) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("notifications")
            .update({
                is_read: true
            })
            .eq(
                "id",
                notificationId
            )
            .eq(
                "recipient_id",
                currentUserId
            );


    if (error) {

        console.error(
            "Could not mark notification as read:",
            error
        );

        return;

    }


    notification.is_read =
        true;


    renderNotifications();

}


/* ==========================================
   MARK ALL NOTIFICATIONS AS READ
   ========================================== */

if (markAllReadButton) {

    markAllReadButton.addEventListener(
        "click",
        async function () {

            const unread =
                myNotifications.filter(
                    notification =>
                        !notification.is_read
                );


            if (
                unread.length === 0
            ) {

                return;

            }


            markAllReadButton.disabled =
                true;


            markAllReadButton.textContent =
                "Saving...";


            const {
                error
            } =
                await supabaseClient
                    .from("notifications")
                    .update({
                        is_read: true
                    })
                    .eq(
                        "recipient_id",
                        currentUserId
                    )
                    .eq(
                        "is_read",
                        false
                    );


            if (error) {

                console.error(
                    "Could not mark notifications as read:",
                    error
                );

                alert(
                    "Could not mark notifications as read: " +
                    error.message
                );

            } else {

                myNotifications =
                    myNotifications.map(
                        notification => ({
                            ...notification,
                            is_read: true
                        })
                    );

                renderNotifications();

            }


            markAllReadButton.disabled =
                false;

            markAllReadButton.textContent =
                "Mark all as read";

        }
    );

}


/* ==========================================
   OPEN / CLOSE NOTIFICATION PANEL
   ========================================== */

function closeNotificationPanel() {

    if (!notificationPanel) {
        return;
    }

    notificationPanel.classList.remove(
        "open"
    );

    if (notificationButton) {

        notificationButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            const isOpen =
                notificationPanel.classList.contains(
                    "open"
                );


            if (isOpen) {

                closeNotificationPanel();

            } else {

                notificationPanel.classList.add(
                    "open"
                );

                notificationButton.setAttribute(
                    "aria-expanded",
                    "true"
                );

            }

        }
    );

}


/* ==========================================
   CLOSE NOTIFICATIONS WHEN CLICKING OUTSIDE
   ========================================== */

document.addEventListener(
    "click",
    function (event) {

        if (
            notificationPanel &&
            notificationButton &&
            !notificationPanel.contains(
                event.target
            ) &&
            !notificationButton.contains(
                event.target
            )
        ) {

            closeNotificationPanel();

        }

    }
);


/* ==========================================
   REFRESH NOTIFICATIONS
   ========================================== */

setInterval(
    async function () {

        if (currentUserId) {

            await loadNotifications();

        }

    },
    30000
);


/* ==========================================
   RENDER DASHBOARD
   ========================================== */

function renderDashboard() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const upcoming =
        mySchedules.filter(
            schedule =>
                scheduleDate(
                    schedule.event_date
                ) >= today
        );


    const calendarStartSchedule =
        upcoming[0] ||
        mySchedules[0];


    if (
        calendarStartSchedule
    ) {

        currentMonth =
            scheduleDate(
                calendarStartSchedule.event_date
            );

        currentMonth.setDate(
            1
        );

    }


    totalSchedules.textContent =
        mySchedules.length;


    upcomingSchedules.textContent =
        upcoming.length;


    assignedHours.textContent =
        formatHours(
            mySchedules.reduce(
                (
                    sum,
                    schedule
                ) =>
                    sum +
                    getHours(schedule),
                0
            )
        );


    renderScheduleList(
        upcoming
    );


    renderCalendar();

}


/* ==========================================
   SCHEDULE LIST
   ========================================== */

function renderScheduleList(
    upcoming
) {

    if (!upcoming.length) {

        myScheduleList.innerHTML =
            `
                <div class="empty-state">

                    <div class="empty-icon">
                        📅
                    </div>

                    <h3>
                        No upcoming schedules
                    </h3>

                    <p>
                        New assigned duties
                        will appear here.
                    </p>

                </div>
            `;

        return;

    }


    myScheduleList.innerHTML =
        upcoming
            .map(
                schedule =>
                    `
                        <div
                            class="schedule-row">

                            <span>
                                ${escapeHTML(
                                    schedule.title
                                )}
                            </span>

                            <span>
                                ${escapeHTML(
                                    formatDate(
                                        schedule.event_date
                                    )
                                )}
                            </span>

                            <span>
                                ${escapeHTML(
                                    formatTime(
                                        schedule
                                    )
                                )}
                            </span>

                            <span>
                                ${escapeHTML(
                                    schedule.location ||
                                    "—"
                                )}
                            </span>

                            <span>

                                <button
                                    type="button"
                                    class="details-button"
                                    data-schedule-id="${escapeHTML(
                                        schedule.id
                                    )}">

                                    View details

                                </button>

                            </span>

                        </div>
                    `
            )
            .join("");


    bindDetailsButtons(
        myScheduleList
    );

}


/* ==========================================
   CALENDAR
   ========================================== */

function renderCalendar() {

    const year =
        currentMonth.getFullYear();

    const month =
        currentMonth.getMonth();


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const totalDays =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    calendarMonth.textContent =
        currentMonth.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        );


    let output = "";


    for (
        let index = 0;
        index < firstDay;
        index += 1
    ) {

        output +=
            `
                <div
                    class="personnel-calendar-day muted">
                </div>
            `;

    }


    for (
        let day = 1;
        day <= totalDays;
        day += 1
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const schedules =
            mySchedules.filter(
                schedule => {

                    const itemDate =
                        scheduleDate(
                            schedule.event_date
                        );

                    return (
                        itemDate.getFullYear() ===
                            year &&

                        itemDate.getMonth() ===
                            month &&

                        itemDate.getDate() ===
                            day
                    );

                }
            );


        output +=
            `
                <div
                    class="
                        personnel-calendar-day
                        ${
                            date.getTime() ===
                            today.getTime()
                                ? "today"
                                : ""
                        }
                    ">

                    <div class="day-number">
                        ${day}
                    </div>

                    ${
                        schedules
                            .map(
                                schedule =>
                                    `
                                        <button
                                            type="button"
                                            class="calendar-duty"
                                            title="${escapeHTML(
                                                schedule.title
                                            )}"
                                            data-schedule-id="${escapeHTML(
                                                schedule.id
                                            )}">

                                            ${escapeHTML(
                                                schedule.title
                                            )}

                                        </button>
                                    `
                            )
                            .join("")
                    }

                </div>
            `;

    }


    calendarDays.innerHTML =
        output;


    bindDetailsButtons(
        calendarDays
    );

}


/* ==========================================
   DETAILS BUTTONS
   ========================================== */

function bindDetailsButtons(
    container
) {

    container
        .querySelectorAll(
            "[data-schedule-id]"
        )
        .forEach(
            button =>
                button.addEventListener(
                    "click",
                    () =>
                        showDetails(
                            button.dataset.scheduleId
                        )
                )
        );

}


/* ==========================================
   SHOW SCHEDULE DETAILS
   ========================================== */

function showDetails(
    scheduleId
) {

    const schedule =
        mySchedules.find(
            item =>
                String(item.id) ===
                String(scheduleId)
        );


    if (!schedule) {

        return;

    }


    const value =
        item =>
            escapeHTML(
                item ||
                "Not specified"
            );


    document.getElementById(
        "detailsTitle"
    ).textContent =
        schedule.title ||
        "Schedule Details";


    detailsContent.innerHTML =
        `
            <dl class="details-grid">

                <div>

                    <dt>
                        Date
                    </dt>

                    <dd>
                        ${escapeHTML(
                            formatDate(
                                schedule.event_date
                            )
                        )}
                    </dd>

                </div>


                <div>

                    <dt>
                        Time
                    </dt>

                    <dd>
                        ${escapeHTML(
                            formatTime(
                                schedule
                            )
                        )}
                    </dd>

                </div>


                <div>

                    <dt>
                        Location
                    </dt>

                    <dd>
                        ${value(
                            schedule.location
                        )}
                    </dd>

                </div>


                <div>

                    <dt>
                        Assigned Hours
                    </dt>

                    <dd>
                        ${formatHours(
                            getHours(schedule)
                        )}
                    </dd>

                </div>


                <div>

                    <dt>
                        Status
                    </dt>

                    <dd>
                        ${value(
                            schedule.status
                        )}
                    </dd>

                </div>


                <div>

                    <dt>
                        Equipment
                    </dt>

                    <dd>
                        ${value(
                            schedule.equipment
                        )}
                    </dd>

                </div>


                <div class="wide">

                    <dt>
                        Description
                    </dt>

                    <dd>
                        ${value(
                            schedule.description
                        )}
                    </dd>

                </div>


                <div class="wide">

                    <dt>
                        Remarks
                    </dt>

                    <dd>
                        ${value(
                            schedule.remarks
                        )}
                    </dd>

                </div>

            </dl>
        `;


    scheduleDetailsModal.classList.add(
        "open"
    );

}


/* ==========================================
   CALENDAR CONTROLS
   ========================================== */

document
    .getElementById(
        "previousMonth"
    )
    .addEventListener(
        "click",
        () => {

            currentMonth.setMonth(
                currentMonth.getMonth() - 1
            );

            renderCalendar();

        }
    );


document
    .getElementById(
        "nextMonth"
    )
    .addEventListener(
        "click",
        () => {

            currentMonth.setMonth(
                currentMonth.getMonth() + 1
            );

            renderCalendar();

        }
    );


/* ==========================================
   CLOSE DETAILS
   ========================================== */

document
    .getElementById(
        "closeDetails"
    )
    .addEventListener(
        "click",
        () =>
            scheduleDetailsModal.classList.remove(
                "open"
            )
    );


scheduleDetailsModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            scheduleDetailsModal
        ) {

            scheduleDetailsModal.classList.remove(
                "open"
            );

        }

    }
);


/* ==========================================
   LOGOUT
   ========================================== */

document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        async () => {

            if (
                typeof supabaseClient !==
                "undefined"
            ) {

                await supabaseClient.auth.signOut();

            }

            window.location.replace(
                "index.html"
            );

        }
    );


/* ==========================================
   START DASHBOARD
   ========================================== */

loadDashboard();
