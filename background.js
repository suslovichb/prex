const accessToken = ""


const query = `query AllRepositories($cursor: String) {\
  viewer {\
    repositories(first:100, ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], after: $cursor) {\
      nodes {\
        nameWithOwner\
        pullRequests(first: 100, states: OPEN) {\
          nodes {\
            number\
            title\
            createdAt\
          }\
        }\
      }\
    }\
  }\
}`


const loadPullRequests = () => {
    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "bearer " + accessToken
      },
      body: JSON.stringify({
        "query" : query
      })
    };

    fetch(`https://api.github.com/graphql`, options)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.log(error));
}


loadPullRequests();
