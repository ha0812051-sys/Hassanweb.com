/* =========================
   HASSAN BROWSER
   MENU + SEARCH + HISTORY
========================= */

const HISTORY_KEY = "hassanBrowserHistory";

const input = document.getElementById("website");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");

const menuBtn = document.getElementById("menuBtn");
const dropdownMenu = document.getElementById("dropdownMenu");


/* =========================
   3 DOT MENU
========================= */

menuBtn.addEventListener("click", function (event) {

    event.stopPropagation();

    dropdownMenu.classList.toggle("show");

});


/* Close menu when clicking outside */

document.addEventListener("click", function (event) {

    if (
        !dropdownMenu.contains(event.target) &&
        !menuBtn.contains(event.target)
    ) {
        dropdownMenu.classList.remove("show");
    }

});


/* =========================
   SHOW PAGE / SECTION
========================= */

function showSection(sectionId) {

    const homePage = document.getElementById("home");
    const historyPage = document.getElementById("history");

    const infoSections =
        document.querySelectorAll(".info-section");


    /* Hide all information sections */

    infoSections.forEach(function (section) {

        section.classList.add("hidden");

    });


    /* =========================
       HOME
    ========================= */

    if (sectionId === "home") {

        homePage.style.display = "block";
        historyPage.style.display = "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =========================
       HISTORY
    ========================= */

    else if (sectionId === "history") {

        homePage.style.display = "block";
        historyPage.style.display = "block";

        historyPage.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    /* =========================
       ABOUT / FEATURES /
       CONTACT / PRIVACY / TERMS
    ========================= */

    else {

        /* Hide main Home content */

        homePage.style.display = "none";
        historyPage.style.display = "none";


        /* Find selected section */

        const selectedSection =
            document.getElementById(sectionId);


        if (selectedSection) {

            selectedSection.classList.remove("hidden");

            selectedSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }


    /* Close 3-dot menu */

    dropdownMenu.classList.remove("show");

}


/* =========================
   HISTORY FUNCTIONS
========================= */

function getHistory() {

    const saved =
        localStorage.getItem(HISTORY_KEY);

    if (!saved) {
        return [];
    }

    try {
        return JSON.parse(saved);
    }

    catch (error) {
        return [];
    }

}


function saveHistory(query, url) {

    let history = getHistory();


    history = history.filter(function (item) {

        return item.query.toLowerCase()
            !== query.toLowerCase();

    });


    history.unshift({

        query: query,
        url: url,
        time: new Date().toLocaleString()

    });


    /* Keep last 20 searches */

    history = history.slice(0, 20);


    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );


    displayHistory();

}


/* =========================
   DISPLAY HISTORY
========================= */

function displayHistory() {

    const historyList =
        document.getElementById("historyList");

    if (!historyList) {
        return;
    }


    const history = getHistory();

    historyList.innerHTML = "";


    if (history.length === 0) {

        historyList.innerHTML = `
            <div class="empty-history">
                🔎 No searches yet
            </div>
        `;

        return;
    }


    history.forEach(function (item, index) {

        const row =
            document.createElement("div");

        row.className = "history-item";


        row.innerHTML = `

            <div class="history-info">

                <div class="history-query">
                    ${escapeHTML(item.query)}
                </div>

                <div class="history-time">
                    ${escapeHTML(item.time)}
                </div>

            </div>

            <button
                class="history-open"
                onclick="openHistory(${index})">
                ↗
            </button>

            <button
                class="history-delete"
                onclick="deleteHistory(${index})">
                🗑
            </button>

        `;


        historyList.appendChild(row);

    });

}


/* =========================
   OPEN HISTORY
========================= */

function openHistory(index) {

    const history = getHistory();

    if (history[index]) {

        window.open(
            history[index].url,
            "_blank",
            "noopener,noreferrer"
        );

    }

}


/* =========================
   DELETE HISTORY
========================= */

function deleteHistory(index) {

    let history = getHistory();

    history.splice(index, 1);

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );

    displayHistory();

}


/* =========================
   CLEAR HISTORY
========================= */

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            const history = getHistory();

            if (history.length === 0) {
                return;
            }


            if (confirm("Clear all search history?")) {

                localStorage.removeItem(HISTORY_KEY);

                displayHistory();

            }

        }
    );

}


/* =========================
   SEARCH
========================= */

function searchWeb() {

    const query =
        input.value.trim();


    if (!query) {

        input.focus();

        return;

    }


    let url;


    if (
        query.startsWith("http://") ||
        query.startsWith("https://")
    ) {

        url = query;

    }

    else if (
        query.includes(".") &&
        !query.includes(" ")
    ) {

        url = "https://" + query;

    }

    else {

        url =
            "https://www.google.com/search?q=" +
            encodeURIComponent(query);

    }


    saveHistory(query, url);


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


/* Search button */

if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        searchWeb
    );

}


/* Enter key */

if (input) {

    input.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                searchWeb();

            }

        }
    );

}


/* =========================
   QUICK LINKS
========================= */

function openSite(name, url) {

    saveHistory(name, url);

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================
   SECURITY
========================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}
function showSection(sectionId) {

    const home = document.getElementById("home");
    const history = document.getElementById("history");

    const sections = document.querySelectorAll(".info-section");

    // Sab info sections hide
    sections.forEach(function(section) {
        section.classList.add("hidden");
    });

    // Home
    if (sectionId === "home") {

        home.style.display = "block";
        history.style.display = "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

    // History
    else if (sectionId === "history") {

        home.style.display = "block";
        history.style.display = "block";

        history.scrollIntoView({
            behavior: "smooth"
        });

    }

    // About / Features / Contact / Privacy / Terms
    else {

        home.style.display = "none";
        history.style.display = "none";

        const page = document.getElementById(sectionId);

        if (page) {
            page.classList.remove("hidden");

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    }

    dropdownMenu.classList.remove("show");
}


/* =========================
   START
========================= */

displayHistory();