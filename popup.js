document.getElementById("settings-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "settings.html"})
});

document.getElementById("report-btn").addEventListener("click", () => {
    const repositories = chrome.storage.local.get('repositories');
    const users = chrome.storage.local.get('users');
    if (repositories && users) {
        localStorage.setItem('Token', document.getElementById("token-input").value);
        chrome.tabs.create({url: "report.html"});
    } else {
        if (repos === null && users === null) {
            document.getElementById("errorHandler").innerHTML = 'Fill list of repos and users in settings';
        } else if (repos === null) {
            document.getElementById("errorHandler").innerHTML = 'Fill list of repos in settings';
        } else if (users === null) {
            document.getElementById("errorHandler").innerHTML = 'Fill list of users in settings';
        }
    }
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
