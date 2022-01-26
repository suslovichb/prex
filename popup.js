document.getElementById("settings-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "settings.html"})
});

document.getElementById("report-btn").addEventListener("click", () => {
    chrome.storage.local.get(["teams"], (storage) => {
        const teams = JSON.parse(storage.teams);
        const selectedTeam = document.getElementById("team-select").value;
        const reportType = getElementData(labelOpenedClosed).report;
        localStorage.setItem('reportType', reportType);
        if (reportType === 0) {
            localStorage.setItem('startDate', JSON.stringify(document.getElementById('start-date').value));
            localStorage.setItem('endDate', JSON.stringify(document.getElementById('end-date').value));
        }
        localStorage.setItem('token', document.getElementById("token-input").value);
        localStorage.setItem('selectedTeam', JSON.stringify(teams[selectedTeam]));
        chrome.tabs.create({url: "report.html"});
    });
});

document.getElementById("token-gen-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "https://github.com/settings/tokens/new?description=Prex%20Chrome%20extension&scopes=repo%2Cread%3Aorg%2Cuser"});
});

document.getElementById("tokens-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "https://github.com/settings/tokens"});
});

$(document).ready(function () {
    document.getElementById('start-date').value = today;
    document.getElementById('end-date').value = today;
    let inputs = document.getElementsByClassName('input-date');
    for (const input in inputs) {
        inputs[input].style = 'visibility: hidden; opacity: 0;';
    }
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

const today = (new Date()).toISOString().split('T')[0];
const setElementData = (el, data) => {
    el.$dataKey = data;
}
const getElementData = (el) => {
    return el.$dataKey;
}
setElementData(document.getElementById('labelOpenedClosed'), {
    report: 1,
});

document.getElementById("report-switch").addEventListener("change", () => {
    let labelOpenedClosed = document.getElementById('labelOpenedClosed');
    let inputs = document.getElementsByClassName('input-date');
    if (getElementData(labelOpenedClosed).report !== 1) {
        setElementData(labelOpenedClosed, {report: 1});
        labelOpenedClosed.innerText = 'Opened Pull Requests';
        for (const input in inputs) {
            inputs[input].style = 'visibility: hidden; opacity: 0;';
        }
    } else {
        setElementData(labelOpenedClosed, {report: 0});
        labelOpenedClosed.innerText = 'Closed Pull Requests';
        for (const input in inputs) {
            inputs[input].style = '';
        }
    }
});
