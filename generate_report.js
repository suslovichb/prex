$(document).ready(function () {
    let accessToken = localStorage.getItem('Token');
    localStorage.removeItem('Token');
    document.querySelector('.preloader').style.display = 'flex';
    getPullRequests(accessToken).then(r => generateTable(r.sort(compare)));
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

const reposStorage = {};
chrome.storage.local.get('repositories', (data) => {
    Object.assign(reposStorage, JSON.parse(data.repositories));
});

async function getListRepos() {
    let listRepos = [];
    for (const repo in reposStorage) {
        listRepos.push(reposStorage[repo]['link']);
    }
    return listRepos;
}

const users = {};
chrome.storage.local.get('users', (data) => {
    Object.assign(users, JSON.parse(data.users));
});

async function getUserQuery() {
    let userQueries = [];
    for (const user in users) {
        userQueries.push("author:" + users[user]['link'] + " ");
    }
    return userQueries;
}


async function getPullRequests(accessToken) {
    let options = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + accessToken
        },
        body: ""
    };
    const listRepos = await getListRepos();
    const userQueries = await getUserQuery();
    let pullRequests = [];
    try {
        for (const repo of listRepos) {
            for (const userQuery of userQueries) {
                options['body'] = JSON.stringify({
                    "query": queryGetPullRequests[0] + "repo:" + repo + " " + userQuery + queryGetPullRequests[1]
                });
                let response = (await (await fetch(`https://api.github.com/graphql`, options)).json());
                for (const responseIterator of response['data']['search']['edges']) {
                    pullRequests.push(responseIterator['node']);
                }
            }
        }
    } catch (e) {
        console.log(e);
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
    for (const row of data.map((item, index) => '<tr class="table-light"><td>' + (index + 1) + "</td><td>" + item['title'] +
        "</td><td>" + item['author']['name'] + '</td><td><a href="' + item['url'] + '">' + item['url'] + '</a></td><td>'
        + Math.trunc((today - Date.parse(item['updatedAt'])) / (1000 * 3600 * 24)) + "</td></tr>"
    )){
        table+=row;
    }
    console.log(table);
    table += "</tbody></table>";

    document.querySelector('.preloader').style.display = 'none';
    document.getElementById("reportTable").innerHTML = table;
}




