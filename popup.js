document.getElementById("settings-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "settings.html"})
});
document.getElementById("report-btn").addEventListener("click", () => {
    chrome.storage.local.get(["users", "repositories"], (storage) => {
        const repositories = storage.repositories;
        const users = storage.users;
        if (repositories && users) {
            localStorage.setItem('Token', document.getElementById("token-input").value);
            chrome.tabs.create({url: "report.html"});
        } else {
            document.getElementById("errorHandler").innerHTML = 'Fill list of repositories and users in settings';
        }
    })
});

document.getElementById("token-gen-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "https://github.com/settings/tokens/new"});
});

document.getElementById("tokens-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "https://github.com/settings/tokens"});
});

$(document).ready(function () {
    let accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        document.getElementById("token-input").hidden = true;
    }
});
