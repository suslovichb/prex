function generatePendingDays(item) {
    let startDate = 0;
    let endDate = 0;
    const comments = item['comments']['nodes']
    for (const comment in comments) {
        console.log(comments[comment]);
        if (startDate === 0) {
            if (users.includes(comments[comment]['author']['login'])) {
                startDate = comments[comment]['createdAt'];
            }
        } else if (endDate === 0) {
            if (!users.includes(comments[comment]['author']['login'])) {
                endDate = comments[comment]['createdAt'];
            }
        }
    }
    if (startDate === 0) {
        item['pendingDays'] = '-';
        item['state'] = 0;
    } else {
        if (endDate === 0) {
            item['pendingDays'] = Math.trunc((today - Date.parse(startDate)) / (1000 * 3600 * 24))
            item['state'] = 1;
        } else {
            item['pendingDays'] = Math.trunc((Date.parse(endDate) - Date.parse(startDate)) / (1000 * 3600 * 24))
            item['state'] = 2;
        }
    }
}

$(document).ready(function () {
    let accessToken = localStorage.getItem('Token');
    localStorage.removeItem('Token');
    loadData();
    try {
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
const reviewStates = ['Under Team Review', 'Under Stakeholder Review', 'Ready to merge'];
let repositories = [];
let userQueries = [];
let users = [];
const today = Date.now();

function loadData() {
    const selectedTeam = JSON.parse(localStorage.getItem('selectedTeam'));
    localStorage.removeItem('selectedTeam');
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

const queryGetPullRequests = ['{\
  search(query: "is:pr ', ' state:open", type: ISSUE, first: 100) {\
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
            $.ajax({
                type: "POST",
                url: `https://api.github.com/graphql`,
                contentType: "application/json",
                headers: {
                    Authorization: "bearer " + accessToken
                },
                data: JSON.stringify({
                    "query": queryGetPullRequests[0] + "repo:" + repo + " " + userQuery + queryGetPullRequests[1]
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


function generateTable(data) {
    const dataKeys = ['#', 'Title', 'Author', 'URL', 'Pending days', 'Pending days in review', 'State'];
    let table = "<table><thead><tr>";
    for (const dataKey of dataKeys) {
        table += "<th>" + dataKey + "</th>";
    }
    table += "</tr></thead><tbody>";

    data.forEach(generateRow);

    function generateRow(item, index, array) {
        table += '<tr class="table-light"><td>' + (index + 1) + "</td><td>" + item['title'] +
            "</td><td>" + item['author']['name'] + '</td><td><a href="' + item['url'] + '">' + item['url'] + '</a></td><td>'
            + Math.trunc((today - Date.parse(item['updatedAt'])) / (1000 * 3600 * 24)) + "</td><td>" + item['pendingDays'] +
            '</td><td style="font-size: 20px; padding: 5px;"><span class="' + reviewStatesStyles[item['state']] + '">' + reviewStates[item['state']] + "</span></td></tr>";
    }

    table += "</tbody></table>";

    document.getElementById("reportTable").innerHTML = table;
    document.querySelector('.preloader').style.display = 'none';
}
