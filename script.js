/* =========================
   HASSAN BROWSER
   SEARCH + HISTORY
========================= */


/* HISTORY STORAGE */

const HISTORY_KEY = "hassanBrowserHistory";



/* =========================
   GET HISTORY
========================= */

function getHistory() {

    const saved =
        localStorage.getItem(HISTORY_KEY);

    if (!saved) {
        return [];
    }

    try {

        return JSON.parse(saved);

    } catch (error) {

        return [];
    }
}



/* =========================
   SAVE HISTORY
========================= */

function saveHistory(query, url) {

    let history = getHistory();


    const item = {

        query: query,

        url: url,

        time: new Date().toLocaleString()

    };


    /* Same search ko duplicate na karo */

    history = history.filter(function(item) {

        return item.query.toLowerCase()
            !== query.toLowerCase();

    });


    /* New item sab se upar */

    history.unshift(item);


    /* Maximum 20 history items */

    history = history.slice(0, 20);


    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );


    showHistory();
}



/* =========================
   SHOW HISTORY
========================= */

function showHistory() {

    const historyList =
        document.getElementById("historyList");

    const history =
        getHistory();


    historyList.innerHTML = "";


    if (history.length === 0) {

        historyList.innerHTML = `
            <div class="empty-history">
                🕘 No search history yet
            </div>
        `;

        return;
    }



    history.forEach(function(item, index) {

        const div =
            document.createElement("div");

        div.className = "history-item";


        div.innerHTML = `

            <div class="history-info">

                <div class="history-query">
                    🔎 ${escapeHTML(item.query)}
                </div>

                <div class="history-time">
                    ${escapeHTML(item.time)}
                </div>

            </div>


            <button
                class="history-open"
                onclick="openHistory(${index})"
            >
                Open
            </button>


            <button
                class="history-delete"
                onclick="deleteHistory(${index})"
            >
                ❌
            </button>

        `;


        historyList.appendChild(div);

    });
}



/* =========================
   SEARCH
========================= */

function searchWeb() {

    const inputElement =
        document.getElementById("website");


    const input =
        inputElement.value.trim();


    if (input === "") {

        inputElement.focus();

        return;
    }


    const search =
        input.toLowerCase();


    let url;



    /* GOOGLE */

    if (search === "google") {

        url =
            "https://www.google.com";

    }


    /* YOUTUBE */

    else if (search === "youtube") {

        url =
            "https://www.youtube.com";

    }


    /* FACEBOOK */

    else if (search === "facebook") {

        url =
            "https://www.facebook.com";

    }


    /* INSTAGRAM */

    else if (search === "instagram") {

        url =
            "https://www.instagram.com";

    }


    /* TIKTOK */

    else if (search === "tiktok") {

        url =
            "https://www.tiktok.com";

    }


    /* GITHUB */

    else if (search === "github") {

        url =
            "https://github.com";

    }


    /* CHATGPT */

    else if (search === "chatgpt") {

        url =
            "https://chatgpt.com";

    }


    /* DARAZ */

    else if (search === "daraz") {

        url =
            "https://www.daraz.pk";

    }


    /* NETFLIX */

    else if (search === "netflix") {

        url =
            "https://www.netflix.com";

    }


    /* MY WEBSITE */

    else if (search === "my website") {

        url =
            "https://example.com";

    }


    /* FULL URL */

    else if (
        search.startsWith("http://") ||
        search.startsWith("https://")
    ) {

        url = input;

    }


    /* DOMAIN */

    else if (input.includes(".")) {

        url =
            "https://" + input;

    }


    /* GOOGLE SEARCH */

    else {

        url =
            "https://www.google.com/search?q=" +
            encodeURIComponent(input);

    }



    /* SAVE HISTORY */

    saveHistory(input, url);


    /* OPEN WEBSITE */

    window.location.href = url;

}



/* =========================
   QUICK WEBSITE
========================= */

function openSite(name, url) {

    saveHistory(name, url);

    window.location.href = url;

}



/* =========================
   OPEN HISTORY
========================= */

function openHistory(index) {

    const history =
        getHistory();


    if (!history[index]) {
        return;
    }


    window.location.href =
        history[index].url;
}



/* =========================
   DELETE ONE HISTORY
========================= */

function deleteHistory(index) {

    let history =
        getHistory();


    history.splice(index, 1);


    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );


    showHistory();
}



/* =========================
   CLEAR ALL HISTORY
========================= */

function clearHistory() {

    const history =
        getHistory();


    if (history.length === 0) {
        return;
    }


    const confirmDelete =
        confirm(
            "Are you sure you want to clear all search history?"
        );


    if (!confirmDelete) {
        return;
    }


    localStorage.removeItem(
        HISTORY_KEY
    );


    showHistory();
}



/* =========================
   ENTER KEY
========================= */

document
    .getElementById("website")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                searchWeb();

            }

        }
    );



/* =========================
   SECURITY
   HTML ESCAPE
========================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}



/* =========================
   LOAD HISTORY
========================= */

showHistory();
// =========================
// CONTACT / INFO SECTIONS
// =========================

// Smooth scrolling for menu links
document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            e.preventDefault();

            target.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
});