
document.addEventListener("DOMContentLoaded", () => {

    // DEMO SETTINGS
    const FARMER_ID = "FRM-001";
    const MILK_RATE = Number(localStorage.getItem("dairyMilkRate")) || 80;
    const RECORD_KEY = "dairyMilkRecords";

    let records = JSON.parse(localStorage.getItem(RECORD_KEY) || "[]");
    let calendarDate = new Date();

    const $ = id => document.getElementById(id);

    function todayString() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function currentMonthString() {
        return todayString().slice(0, 7);
    }

    function money(amount) {
        return "NPR " + Number(amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function saveRecords() {
        localStorage.setItem(RECORD_KEY, JSON.stringify(records));
    }

    function monthRecords(month) {
        return records.filter(record => record.date.startsWith(month));
    }

    function totalLitres(list) {
        return list.reduce((sum, record) => sum + Number(record.quantity || 0), 0);
    }

    function safeText(value) {
        return String(value ?? "");
    }

    // TOP BAR DATE
    $("todayLabel").textContent = new Date().toLocaleDateString("en-NP", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    // NAVIGATION
    const pageTitles = {
        dashboard: "Dashboard",
        profile: "My Profile",
        collection: "Milk Collection",
        history: "Supply History",
        quality: "Milk Quality",
        payments: "Monthly Payments",
        calendar: "Collection Calendar",
        notifications: "Notifications",
        support: "Help & Support"
    };

    function showPage(page) {
        document.querySelectorAll(".page-section").forEach(section => {
            section.classList.toggle("active", section.id === "page-" + page);
        });

        document.querySelectorAll(".nav-link").forEach(button => {
            button.classList.toggle("active", button.dataset.page === page);
        });

        $("pageHeading").textContent = pageTitles[page] || "Dashboard";
        $("sidebar").classList.remove("open");

        if (page === "dashboard") renderDashboard();
        if (page === "history") renderHistory();
        if (page === "quality") renderQuality();
        if (page === "payments") renderPayments();
        if (page === "calendar") renderCalendar();
    }

    document.querySelectorAll(".nav-link").forEach(button => {
        button.addEventListener("click", () => showPage(button.dataset.page));
    });

    document.querySelectorAll("[data-goto]").forEach(button => {
        button.addEventListener("click", () => showPage(button.dataset.goto));
    });

    $("menuToggle").addEventListener("click", () => {
        $("sidebar").classList.toggle("open");
    });

    // MILK COLLECTION FORM
    $("milkDate").value = todayString();

    $("milkForm").addEventListener("submit", event => {
        event.preventDefault();

        const record = {
            farmerId: FARMER_ID,
            date: $("milkDate").value,
            session: $("milkSession").value,
            quantity: Number($("milkQuantity").value),
            fat: Number($("milkFat").value),
            snf: Number($("milkSnf").value)
        };

        if (!record.date || !record.session ||
            record.quantity <= 0 ||
            record.fat < 0 || record.fat > 100 ||
            record.snf < 0 || record.snf > 100) {
            $("formMessage").textContent = "Please check all your entries.";
            return;
        }

        const duplicate = records.some(item =>
            item.date === record.date &&
            item.session === record.session &&
            (item.farmerId || FARMER_ID) === FARMER_ID
        );

        if (duplicate) {
            $("formMessage").textContent =
                "A record already exists for this date and session.";
            return;
        }

        records.push(record);
        saveRecords();

        $("milkForm").reset();
        $("milkDate").value = todayString();
        $("formMessage").textContent = "✓ Milk record saved successfully!";

        renderDashboard();
    });

    // DASHBOARD
    function renderDashboard() {
        const currentRecords = monthRecords(currentMonthString());
        const total = totalLitres(records);
        const monthly = totalLitres(currentRecords);
        const earnings = monthly * MILK_RATE;

        $("dashTotalMilk").textContent = total.toFixed(1) + " L";
        $("dashMonthMilk").textContent = monthly.toFixed(1) + " L";
        $("dashEarnings").textContent = money(earnings);
        $("dashRecords").textContent = records.length;

        $("overviewEarnings").textContent = money(earnings);
        $("overviewRate").textContent = "At " + money(MILK_RATE) + " per litre";
        $("overviewLitres").textContent = monthly.toFixed(1) + " L";

        const recent = [...records].sort((a, b) =>
            (b.date + b.session).localeCompare(a.date + a.session)
        ).slice(0, 5);

        const tbody = $("recentRecords");
        tbody.innerHTML = "";

        if (!recent.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-row">No collection records yet. Add your first milk record.</td></tr>`;
            return;
        }

        recent.forEach(record => {
            const row = document.createElement("tr");
            [
                record.date,
                record.session,
                Number(record.quantity).toFixed(1) + " L",
                Number(record.fat).toFixed(1) + "% / " +
                Number(record.snf).toFixed(1) + "%"
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = safeText(value);
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
    }

    // MILK HISTORY
    function renderHistory() {
        const search = $("historySearch").value.trim().toLowerCase();
        const month = $("historyMonth").value;

        const filtered = [...records]
            .filter(record => {
                const matchesSearch =
                    record.date.toLowerCase().includes(search) ||
                    record.session.toLowerCase().includes(search);

                const matchesMonth = !month || record.date.startsWith(month);

                return matchesSearch && matchesMonth;
            })
            .sort((a, b) => b.date.localeCompare(a.date));

        const tbody = $("historyTable");
        tbody.innerHTML = "";

        if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No matching records found.</td></tr>`;
        } else {
            filtered.forEach(record => {
                const row = document.createElement("tr");
                [
                    record.date,
                    record.session,
                    Number(record.quantity).toFixed(1),
                    Number(record.fat).toFixed(1) + "%",
                    Number(record.snf).toFixed(1) + "%"
                ].forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = safeText(value);
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
        }

        $("historySummary").textContent =
            filtered.length + " record(s) · " +
            totalLitres(filtered).toFixed(1) + " litres in this view";
    }

    $("historySearch").addEventListener("input", renderHistory);
    $("historyMonth").addEventListener("change", renderHistory);

    $("clearHistoryFilter").addEventListener("click", () => {
        $("historySearch").value = "";
        $("historyMonth").value = "";
        renderHistory();
    });

    // QUALITY HISTORY
    function renderQuality() {
        const tbody = $("qualityTable");
        tbody.innerHTML = "";

        if (!records.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No quality readings recorded yet.</td></tr>`;
            $("averageFat").textContent = "—";
            $("averageSnf").textContent = "—";
            return;
        }

        const averageFat = records.reduce((sum, r) => sum + Number(r.fat), 0) / records.length;
        const averageSnf = records.reduce((sum, r) => sum + Number(r.snf), 0) / records.length;

        $("averageFat").textContent = averageFat.toFixed(1) + "%";
        $("averageSnf").textContent = averageSnf.toFixed(1) + "%";

        [...records].sort((a, b) => b.date.localeCompare(a.date)).forEach(record => {
            const row = document.createElement("tr");
            [
                record.date,
                record.session,
                Number(record.quantity).toFixed(1) + " L",
                Number(record.fat).toFixed(1) + "%",
                Number(record.snf).toFixed(1) + "%"
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = safeText(value);
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
    }

    // MONTHLY PAYMENTS
    $("paymentMonth").value = currentMonthString();

    function renderPayments() {
        const month = $("paymentMonth").value || currentMonthString();
        const list = monthRecords(month);
        const litres = totalLitres(list);
        const amount = litres * MILK_RATE;

        $("paymentRate").textContent = money(MILK_RATE) + " / L";
        $("paymentRateRow").textContent = money(MILK_RATE);
        $("paymentLitres").textContent = litres.toFixed(1) + " L";
        $("monthlyAmount").textContent = money(amount);
        $("paymentCalculation").textContent =
            litres.toFixed(1) + " litres × " + money(MILK_RATE);

        const months = [...new Set(records.map(r => r.date.slice(0, 7)))].sort().reverse();
        const tbody = $("statementTable");
        tbody.innerHTML = "";

        if (!months.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-row">Your monthly statements will appear here after milk collection.</td></tr>`;
            return;
        }

        months.forEach(monthName => {
            const monthMilk = totalLitres(monthRecords(monthName));
            const row = document.createElement("tr");

            [
                new Date(monthName + "-02").toLocaleDateString("en", {
                    month: "long",
                    year: "numeric"
                }),
                monthMilk.toFixed(1) + " L",
                money(MILK_RATE),
                money(monthMilk * MILK_RATE)
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = safeText(value);
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
    }

    $("paymentMonth").addEventListener("change", renderPayments);

    // COLLECTION CALENDAR
    function renderCalendar() {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();

        $("calendarMonthLabel").textContent =
            calendarDate.toLocaleDateString("en", {
                month: "long",
                year: "numeric"
            });

        const grid = $("calendarGrid");
        grid.innerHTML = "";

        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
            const cell = document.createElement("div");
            cell.className = "calendar-day heading";
            cell.textContent = day;
            grid.appendChild(cell);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = todayString();

        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement("div");
            blank.className = "calendar-day";
            grid.appendChild(blank);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = year + "-" +
                String(month + 1).padStart(2, "0") + "-" +
                String(day).padStart(2, "0");

            const dayRecords = records.filter(r => r.date === dateString);
            const cell = document.createElement("div");

            cell.className = "calendar-day";
            if (dayRecords.length) cell.classList.add("has-record");
            if (dateString === today) cell.classList.add("today");

            const number = document.createElement("span");
            number.textContent = day;
            cell.appendChild(number);

            if (dayRecords.length) {
                const note = document.createElement("small");
                note.textContent = dayRecords.length + " collection(s)";
                cell.appendChild(note);
            }

            grid.appendChild(cell);
        }
    }

    $("previousMonth").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });

    $("nextMonth").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    // SUPPORT FORM
    $("supportForm").addEventListener("submit", event => {
        event.preventDefault();

        const requests = JSON.parse(localStorage.getItem("dairySupportRequests") || "[]");

        requests.push({
            farmerId: FARMER_ID,
            subject: $("supportSubject").value,
            message: $("supportMessage").value,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem("dairySupportRequests", JSON.stringify(requests));

        $("supportForm").reset();
        $("supportMessageStatus").textContent =
            "✓ Your demo support request has been saved in this browser.";
    });

    // FIRST PAGE
    renderDashboard();
    renderHistory();
    renderQuality();
    renderPayments();
    renderCalendar();

});
