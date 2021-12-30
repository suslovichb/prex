$(document).ready(function () {
    chrome.runtime.sendMessage({Ready: 'True'});
    chrome.runtime.onMessage.addListener(
        function (request, sender,sendResponse) {
            let accessToken = request.Token;
            loadPullRequests(accessToken);
        }
    )
});

const query = `query {\
    viewer {\
      pullRequests(first: 100, states: OPEN) {\
        totalCount\
        nodes {\
          createdAt\
          number\
          title\
        }\
        pageInfo {\
          hasNextPage\
          endCursor\
        }\
      }\
    }\
  }`;


function loadPullRequests(accessToken){
    const options = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + accessToken
        },
        body: JSON.stringify({
            "query": query
        })
    };
    fetch(`https://api.github.com/graphql`, options)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.log(error));
}
