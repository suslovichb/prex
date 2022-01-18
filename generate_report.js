$(document).ready(function () {
    let accessToken = localStorage.getItem('Token');
    localStorage.removeItem('Token');
    document.querySelector('.preloader').style.display = 'flex';
    try {
        const pullRequests = getPullRequests(accessToken);
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

let repositories = [];
let userQueries = [];
chrome.storage.local.get(["users", "repositories"], (storage) => {
    const repositoryList = JSON.parse(storage.repositories);
    const usersList = JSON.parse(storage.users);
    for (const user in usersList) {
        userQueries.push("author:" + usersList[user]['github'] + " ");
    }
    for (const repository in repositoryList) {
        repositories.push(repositoryList[repository]['path']);
    }
});

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
        }\
      }\
    }\
  }\
}'];


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
    const dataKeys = ['number', 'title', 'author', 'url', 'pending days'];
    let table = "<table><thead><tr>";
    const today = Date.now();
    for (const dataKey of dataKeys) {
        table += "<th>" + dataKey + "</th>";
    }
    table += "</tr></thead><tbody>";

    data.forEach(generateRow);

    function generateRow(item, index, array) {
        table += '<tr class="table-light"><td>' + (index + 1) + "</td><td>" + item['title'] +
            "</td><td>" + item['author']['name'] + '</td><td><a href="' + item['url'] + '">' + item['url'] + '</a></td><td>'
            + Math.trunc((today - Date.parse(item['updatedAt'])) / (1000 * 3600 * 24)) + "</td></tr>";
    }

    table += "</tbody></table>";

    document.querySelector('.preloader').style.display = 'none';
    document.getElementById("reportTable").innerHTML = table;
}




