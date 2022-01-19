document.getElementById("settings-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "settings.html"})
});
document.getElementById("report-btn").addEventListener("click", () => {
    chrome.storage.local.get(["teams"], (storage) => {
        const teams = JSON.parse(storage.teams);
        const selectedTeam = document.getElementById("team-select").value;
        localStorage.setItem('Token', document.getElementById("token-input").value);
        localStorage.setItem('selectedTeam', JSON.stringify(teams[selectedTeam]));
        chrome.tabs.create({url: "report.html"});
    });
});

document.getElementById("token-gen-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "https://github.com/settings/tokens/new"});
});

document.getElementById("tokens-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "https://github.com/settings/tokens"});
});

$(document).ready(function () {
    chrome.storage.local.get(["teams"], (storage) => {
        try {
            let teams = JSON.parse(storage.teams);
            let select = document.getElementById('team-select');

            for (let team in teams) {
                let opt = document.createElement('option');
                opt.value = team;
                opt.innerHTML = teams[team]['name'];
                select.appendChild(opt);
            }
        } catch (e) {
            document.getElementById("errorHandler").innerHTML = 'Create team in settings';
            document.getElementById("report-btn").hidden = true;
        }
    });
});
