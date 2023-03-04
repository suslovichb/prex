function generatePendingDays(item) {
    let startDate = 0;
    let endDate = 0;
    const comments = item['comments']['nodes']
    for (const comment in comments) {
        if (startDate === 0) {
            if (users.includes(comments[comment]['author']['login'])) {
                if (comments[comment]['bodyText'].includes('LGTM')) {
                    startDate = comments[comment]['createdAt'];
                }
            }
        } else if (endDate === 0) {
            if (!users.includes(comments[comment]['author']['login'])) {
                if (comments[comment]['bodyText'].includes('LGTM')) {
                    endDate = comments[comment]['createdAt'];
                }
            }
        }
    }
    item['POReview'] = '-';
    if (startDate === 0) {
        item['pendingDays'] = '-';
        item['state'] = 0;
        item['teamReview'] = '-';
    } else {
        item['teamReview'] = startDate;
        if (endDate === 0) {
            item['pendingDays'] = Math.trunc((today - Date.parse(startDate)) / (1000 * 3600 * 24))
            item['state'] = 1;
        } else {
            item['pendingDays'] = diffTwoDates(endDate, startDate);
            item['state'] = 2;
            item['POReview'] = endDate;
        }
    }
    if (reportType === 1) {
        item['daysFromLastUpdate'] = Math.trunc((today - Date.parse(item['updatedAt'])) / (1000 * 3600 * 24));
        days.push([item['daysFromLastUpdate'], item['pendingDays']]);
    } else {
        item['teamReviewTime'] = item['teamReview'];
        if (item['teamReview'] !== '-') {
            item['teamReviewTime'] = diffTwoDates(item['teamReviewTime'], item['createdAt']);
        }
        item['fullReviewTime'] = item['POReview'];
        if ((item['fullReviewTime'] !== '-') && (item['teamReview'] !== '-')) {
            item['fullReviewTime'] = diffTwoDates(item['fullReviewTime'], item['teamReview']);
        }
        item['lifetime'] = diffTwoDates(item['mergedAt'], item['createdAt']);
        days.push([item['lifetime'],  item['teamReviewTime'], item['fullReviewTime']]);
    }
}

function validateDates(startDate, endDate) {
    if (startDate > endDate) {
        [startDate, endDate] = [endDate, startDate];
    }
    endDate = (new Date(Date.parse(endDate) + (24 * 60 * 60 * 1000))).toISOString().split('T')[0];
    return [startDate, endDate];
}

$(document).ready(function () {
    try {
        let accessToken = localStorage.getItem('token');
        localStorage.removeItem('token');
        loadData();
        [startDate, endDate] = validateDates(startDate, endDate);
        const pullRequests = getPullRequests(accessToken);
        pullRequests.forEach(generatePendingDays);
        generateTable(pullRequests.sort(compare));
    } catch (e) {
        document.querySelector('.preloader').style.display = 'none';
        if (e.status === 0) {
            alert(e.statusText);
        } else {
            alert(e.responseJSON['message']);
        }
    }
});


function compare(a, b) {
    if (a.updatedAt < b.updatedAt) {
        return -1;
    }
    if (a.updatedAt > b.updatedAt) {
        return 1;
    }
    return 0;
}

const reviewStatesStyles = ['badge bg-danger', 'badge bg-warning', 'badge bg-success'];
const reviewStates = ['Under Team Review', 'Under PO Review', 'Ready to merge'];
let repositories = [];
let userQueries = [];
let users = [];
let reportType = 1;
const today = Date.now();
let startDate = 0;
let endDate = 0;
let days = [];

function loadData() {
    const selectedTeam = extractValueFromLocalStorage('selectedTeam');
    reportType = extractValueFromLocalStorage('reportType');
    if (reportType === 0) {
        startDate = extractValueFromLocalStorage('startDate');
        endDate = extractValueFromLocalStorage('endDate');
    }
    const repositoryList = selectedTeam.repositories;
    const usersList = selectedTeam.users;
    for (const user in usersList) {
        userQueries.push("author:" + usersList[user]['github'] + " ");
        users.push(usersList[user]['github']);
    }
    for (const repository in repositoryList) {
        repositories.push(repositoryList[repository]['path']);
    }
}

function extractValueFromLocalStorage(key) {
    const value = JSON.parse(localStorage.getItem(key));
    localStorage.removeItem(key);
    return value;
}

const queryGetPullRequests = ['{\
  search(query: "is:pr state:', ' ", type: ISSUE, first: 100) {\
    edges {\
      node {\
        ... on PullRequest {\
          title\
          url\
          state\
          author {\
            ... on User {\
              name\
            }\
            }\
          createdAt\
          mergedAt\
          updatedAt\
          comments(first: 100) {\
            nodes {\
              bodyText\
              createdAt\
              author {\
                login\
              }\
            }\
        }\
      }\
    }\
  }\
}}'];


function getPullRequests(accessToken) {
    let pullRequests = [];
    let stop = false;
    let error;
    for (const repo of repositories) {
        for (const userQuery of userQueries) {
            if (stop) {
                break;
            }
            let query;
            if (reportType === 1) {
                query = queryGetPullRequests[0] + "open repo:" + repo + " " + userQuery + queryGetPullRequests[1];
            } else {
                query = queryGetPullRequests[0] + "closed repo:" + repo + " " + userQuery + " merged:" + startDate +
                    ".." + endDate + queryGetPullRequests[1];
            }
            $.ajax({
                type: "POST",
                url: `https://api.github.com/graphql`,
                contentType: "application/json",
                headers: {
                    Authorization: "bearer " + accessToken
                },
                data: JSON.stringify({
                    "query": query
                }),
                async: false,
                dataType: 'json',
                success: response => {
                    for (const responseIterator of response['data']['search']['edges']) {
                        pullRequests.push(responseIterator['node']);
                    }
                },
                error: function (e) {
                    stop = true;
                    error = e;
                }
            });
        }
    }
    if (stop) {
        throw error;
    }
    return pullRequests;
}

function average(nums) {
    if (nums.length === 0) {
        return '-';
    } else {
        return nums.reduce((a, b) => (a + b)) / nums.length;
    }
}

function getTableHead() {
    let dataKeys = ['#', 'Title', 'Author', 'URL',];
    if (reportType === 1) {
        dataKeys.push('Last activity');
        dataKeys.push('Pending days in review');
        dataKeys.push('State');
    } else {
        dataKeys.push('Lifetime');
        dataKeys.push('Team Review Time');
        dataKeys.push('PO Review Time');
    }
    return dataKeys;
}

function generateTable(data) {
    const dataKeys = getTableHead();
    let table = "<table><thead><tr>";
    for (const dataKey of dataKeys) {
        table += "<th>" + dataKey + "</th>";
    }
    table += "</tr></thead><tbody>";

    data.forEach(generateRow);
    generateAVGRow();

    function generateAVGRow() {
        if (reportType === 1) {
            let daysFromLastUpdateAVG = [];
            let pendingDaysAVG = [];
            let AVGList = [daysFromLastUpdateAVG, pendingDaysAVG];
            for (let days_i = 0; days_i < days.length; days_i++) {
                for (let data_i in days[days_i]) {
                    if (days[days_i][data_i] !== '-') {
                        AVGList[data_i].push(days[days_i][data_i]);
                    }
                }
            }
            table += '<tr class="table-info"><td></td><td>AVG</td><td></td><td></td><td>'
                + average(daysFromLastUpdateAVG) + "</td><td>" + average(pendingDaysAVG) +
                '</td><td></td></tr>';
        } else {
            let lifetimeAVG = [];
            let teamReviewTimeAVG = [];
            let fullReviewTimeAVG = [];
            let AVGList = [lifetimeAVG, teamReviewTimeAVG, fullReviewTimeAVG];
            for (let days_i = 0; days_i < days.length; days_i++) {
                for (let data_i in days[days_i]) {
                    if (days[days_i][data_i] !== '-') {
                        AVGList[data_i].push(days[days_i][data_i]);
                    }
                }
            }
            table += '<tr class="table-info"><td></td><td>AVG</td><td></td><td></td><td>'
                + average(lifetimeAVG) + "</td><td>" + average(teamReviewTimeAVG) + "</td><td>" +
                average(fullReviewTimeAVG) + "</td></tr>";
        }
    }


    function generateRow(item, index) {
        if (reportType === 1) {
            table += '<tr class="table-light"><td>' + (index + 1) + "</td><td>" + item['title'] +
                "</td><td>" + item['author']['name'] + '</td><td><a href="' + item['url'] + '">' + item['url'] + '</a></td><td>'
                + item['daysFromLastUpdate'] + "</td><td>" + item['pendingDays'] +
                '</td><td class="status-field""><span class="' + reviewStatesStyles[item['state']] + '">' + reviewStates[item['state']] + "</span></td></tr>";
        } else {
            table += '<tr class="table-light"><td>' + (index + 1) + "</td><td>" + item['title'] +
                "</td><td>" + item['author']['name'] + '</td><td><a href="' + item['url'] + '">' + item['url'] + '</a></td><td>'
                + item['lifetime'] + "</td><td>" + item['teamReviewTime'] + "</td><td>" + item['fullReviewTime'] + "</td></tr>";
        }
    }

    table += "</tbody></table>";

    document.getElementById("reportTable").innerHTML = table;
    document.querySelector('.preloader').style.display = 'none';
}

function diffTwoDates(firstDate, secondDate) {
    return Math.trunc((Date.parse(firstDate) - Date.parse(secondDate)) / (1000 * 3600 * 24));
}
