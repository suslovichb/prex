$( document ).ready(function() {

    // First field - identifier - must be unique for every entity 
    const userFields = ["github"];
    const repositoryFields = ["path"];
    
    const usersContainerId = "users-table-container";
    const repositoriesContainerId = "repo-table-container";
    const tableClasses = ["table", "table-hover"];
    const defaultCellValue = "-";

    const teamsContainerId = "teams-container";

    const githubNamePattern = "[a-z0-9](?:[-_](?=[a-z0-9])|[a-z0-9]){0,38}(?<=[a-z0-9])";

    let users = new Set();
    let repositories = new Set();
    let teams = new Set();


    const setUsers = (newUsers) => {
        users = new Set(newUsers);
        buildTable(userFields, [...users], usersContainerId);
        renderTeams([...teams], teamsContainerId);
    }


    const setRepositories = (newRepositories) => {
        repositories = new Set(newRepositories);
        buildTable(repositoryFields, [...repositories], repositoriesContainerId);
        renderTeams([...teams], teamsContainerId);
    }


    const setTeams = (newTeams) => {
        teams = new Set(newTeams);
        renderTeams([...teams], teamsContainerId);
    }


    const readLocalStorage = async (key) => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], function (storage) {
                if (storage[key] === undefined) {
                    reject();
                } else {
                    resolve(storage[key]);
                }
            });
        });
    };


    const validateUsers = (users) => (Array.isArray(users) && users.length > 0);


    const loadLocalUsers = async () => {
        try {
            let localUsers = await readLocalStorage("users");
            let parsedUsers = JSON.parse(localUsers);
            validateUsers(parsedUsers) && setUsers(parsedUsers);
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }  
    }


    const addUser = (user) => {
        loadLocalUsers().then((isLoaded) => {
            setUsers([...users, user]);
            chrome.storage.local.set(
                {"users": JSON.stringify([...users])},
                () => {}
            );
        }).catch((err) => {console.log(err)});
    }


    const validateGithubUsername = (username) => {
        pattern = "^" + githubNamePattern + "$";
        let re = new RegExp(pattern, "i");
        return re.test(username);
    }


    $("#add-user-form").submit(function(event) {
        event.preventDefault();
        
        let errorsList = $(this).find(".form-errors-list");
        let values = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});

        errorsList.html("");
        errorsList.addClass("visually-hidden");

        if (!validateGithubUsername(values.github)) {
            errorsList.removeClass("visually-hidden");
            errorsList.append("<li>Incorrect username</li>");
            return;
        }
        
        addUser(values);
        $(this).trigger("reset");
        $(this).find("input:text:visible:first").focus();
    });


    const validateRepositories = (repositories) => (Array.isArray(repositories) && repositories.length > 0);


    const loadLocalRepositories = async () => {
        try {
            let localRepositories = await readLocalStorage("repositories");
            let parsedRepositories = JSON.parse(localRepositories);
            validateRepositories(parsedRepositories) && setRepositories(parsedRepositories);
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }  
    }


    const addRepository = (repository) => {
        loadLocalRepositories().then((isLoaded) => {
            setRepositories([...repositories, repository]);
            chrome.storage.local.set(
                {"repositories": JSON.stringify([...repositories])},
                () => {}
            );
        }).catch((err) => {console.log(err)});
    }


    const validateRepoPath = (path) => {
        pattern = "^" + githubNamePattern + "\\/" + githubNamePattern + "$";
        let re = new RegExp(pattern, "i");
        return re.test(path);
    }


    $("#add-repo-form").submit(function(event) {
        event.preventDefault();
        
        let errorsList = $(this).find(".form-errors-list");
        let values = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});

        errorsList.html("");
        errorsList.addClass("visually-hidden");

        if (!validateRepoPath(values.path)) {
            errorsList.removeClass("visually-hidden");
            errorsList.append("<li>Incorrect path format</li>");
            return;
        }

        addRepository(values);
        $(this).trigger("reset");
        $(this).find("input:text:visible:first").focus();
    });


    const buildTable = (columnNames, items, htmlContainerId) => {
        let table = makeTable(columnNames, items);
        $("#" + htmlContainerId).html(table);
    }


    const makeTable = (columnNames, items) => {
        return (`
            <table class="${tableClasses.join(" ")}">
                <thead>
                    ${makeHeaders(columnNames)}
                    ${actionsHeader()}
                </thead>
                <tbody>
                    ${makeRows(columnNames, items)}
                </tbody>        
            </table>
        `);
    }


    const actionsHeader = () => {
        return `<th>actions</th>`;
    }


    const makeHeaders = (columnNames) => {
        return columnNames.map((columnName) => `<th>${columnName}</th>`).join("");
    }


    const makeRows = (columnNames, items) => {
        return items.map((item) => makeRow(columnNames, item)).join("")
    }


    const makeRow = (columnNames, item) => {
        let cells = columnNames.map((columnName) => `<td>${item[columnName]||defaultCellValue}</td>`).join("");
        return `<tr>${cells}${actionsCell(item[columnNames[0]])}</tr>`;
    }


    const actionsCell = (itemId) => {
        return (`
            <td>
                <button class="delete-btn btn btn-secondary p-1" itemId="${itemId}">
                    Delete
                </button>
            </td>
        `);
    }


    const deleteUser = (id) => {
        setUsers(
            [...users].filter((user) => (user[userFields[0]] !== id))
        );
        chrome.storage.local.set(
            {"users":JSON.stringify([...users])}
        );
    }


    const deleteRepository = (id) => {
        setRepositories(
            [...repositories].filter((repo) => (repo[repositoryFields[0]] !== id))
        );

        chrome.storage.local.set(
            {"repositories":JSON.stringify([...repositories])}
        );
    }


    $('#users-table-container').on('click', '.delete-btn', function() {
        let id = $(this).attr('itemId');
        loadLocalUsers().then(() => {
            deleteUser(id)
        });
    });


    $('#repo-table-container').on('click', '.delete-btn', function() {
        let id = $(this).attr('itemId');
        loadLocalRepositories().then(() => {
            deleteRepository(id)
        });
    });


    const validateTeams = (teams) => (Array.isArray(teams) && teams.length > 0);


    const loadLocalTeams = async () => {
        try {
            let localTeams = await readLocalStorage("teams");
            let parsedTeams = JSON.parse(localTeams);
            validateTeams(parsedTeams) && setTeams(parsedTeams);
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    }


    const addTeam = (team) => {
        loadLocalTeams().then((isLoaded) => {
            setTeams([...teams, team]);
            chrome.storage.local.set(
                {"teams": JSON.stringify([...teams])},
                () => {}
            );
        }).catch((err) => {console.log(err)});
    }


    $("#add-team-form").submit(function(event) {
        event.preventDefault();
        let values = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});
        addTeam(values);
        $(this).trigger("reset");
        $(this).find("input:text:visible:first").focus();
    });


    const renderTeams = (teams, htmlContainerId) => {
        let teamCards = teams.map((team) => makeTeamCard(team)).join("");
        $("#" + htmlContainerId).html(teamCards);
    }


    const makeTeamCard = (team) => {
        return `
            <div class="team-card" style="margin:15px" teamId=${team.name}>

                <div class="team-header d-flex p-2 bg-dark text-light rounded-top">
                    <div class="flex-grow-1 text-center">                
                        ${team.name}
                    </div>
                    <div>
                        <button class="team-delete-btn btn btn-light py-0 px-2" teamId="${team.name}">
                            X
                        </button>
                    </div>
                </div>
            
                <div class="rounded-bottom" style="display:flex;flex-direction:row;align-items:stretch;background-color:#F0F0F0;">
                    <div class="d-flex flex-column border-end" style="flex-grow:1;">
                        <div class="p-1 text-center border" style="background-color:lightgrey;">
                            Users
                        </div>
                        ${Array.isArray(team.users) ? team.users.map(user => teamUserRow(user, team.name)).join("") : ""}
                        <div class="mt-auto">
                            <form id="add-team-user-form" class="w-100 p-2 border-top border-end" teamId="${team.name}">
                                <div class="d-flex flex-row align-items-end">
                                    <div class="d-flex flex-column">
                                        <label class="small" for="team-user-select">User</label>
                                        <select type="select" id="team-user-select" class="rounded-3" name="github">
                                            ${users ? [...users].map(user => `<option>${user.github}</option>`) : ""}
                                        </select>
                                    </div>
                                    <button type="submit" class="ms-1 btn btn-secondary py-0 px-2">Add</button>
                                </div>
                            </form>
                        </div>
                    
                    </div>
                    
                    <div class="d-flex flex-column border-start" style="flex-grow:1;">
                        <div class="p-1 text-center border" style="background-color:lightgrey;">
                            Repositories
                        </div>
                        
                        ${Array.isArray(team.repositories) ? team.repositories.map(repo => teamRepositoryRow(repo, team.name)).join("") : ""}
                        <div class="mt-auto">
                            <form id="add-team-repo-form" class="w-100 p-2 border-top border-start" teamId="${team.name}">
                                <div class="d-flex flex-row align-items-end">
                                    <div class="d-flex flex-column">
                                        <label class="small" for="team-repo-select">Repository</label>
                                        <select type="select" id="team-repo-select" class="rounded-3" name="path">
                                            ${repositories ? [...repositories].map(repo => `<option>${repo.path}</option>`) : ""}
                                        </select>
                                    </div>
                                    <button type="submit" class="ms-1 btn btn-secondary py-0 px-2">Add</button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        `
    }


    const teamUserRow = (user, teamId) => {
        return `
            <div class="team-user-row d-flex px-2" teamId="${teamId}">
                <div class="flex-grow-1">
                    ${user.github}
                </div>
                <div>
                    <button class="team-user-delete-btn btn btn-danger py-0 px-1" teamId="${teamId}" userId="${user.github}">
                        X
                    </button>
                </div>
            </div>
        `
    }


    const teamRepositoryRow = (repository, teamId) => {
        return `
            <div class="team-repo-row d-flex px-2" teamId="${teamId}">
                <div class="flex-grow-1">
                    ${repository.path}
                </div>
                <div>
                    <button class="team-repo-delete-btn btn btn-danger py-0 px-1" teamId="${teamId}" repoId="${repository.path}">
                        X
                    </button>
                </div>
            </div>
        `
    }


    $("#teams-container").on("submit", "#add-team-user-form", function(event) {
        event.preventDefault();
        let formValues = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});
        let teamName = $(this).attr("teamId");
        
        loadLocalTeams().then((isLoaded) => {
            for (const team of teams) {
                if (team.name === teamName) {
                    team.users = Array.isArray(team.users) ? [...team.users, formValues] : [formValues];
                }
            }
            renderTeams([...teams], teamsContainerId);
            chrome.storage.local.set({"teams": JSON.stringify([...teams])});
        });
    });


    $("#teams-container").on("submit", "#add-team-repo-form", function(event) {
        event.preventDefault();
        let formValues = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});
        let teamName = $(this).attr("teamId");
        
        loadLocalTeams().then((isLoaded) => {
            for (const team of teams) {
                if (team.name === teamName) {
                    team.repositories = Array.isArray(team.repositories) ? [...team.repositories, formValues] : [formValues];
                }
            }
            renderTeams([...teams], teamsContainerId);
            chrome.storage.local.set({"teams": JSON.stringify([...teams])});
        });
    });


    $("#teams-container").on("click", ".team-delete-btn", function(event) {
        let teamId = $(this).attr("teamId");
        loadLocalTeams().then((isLoaded) => {
            let clearedTeams = [...teams].filter((team) => (team.name !== teamId));
            setTeams(clearedTeams);
            chrome.storage.local.set({"teams": JSON.stringify(clearedTeams)});
        });
    });


    $("#teams-container").on("click", ".team-user-delete-btn", function(event) {
        let teamId = $(this).attr("teamId");
        let userId = $(this).attr("userId");
        loadLocalTeams().then((isLoaded) => {
            let clearedTeams = [...teams].map((team) => {
                if (team.name === teamId) {
                    team.users = team.users.filter((user) => (user.github !== userId))
                }
                return team;
            });
            setTeams(clearedTeams);
            chrome.storage.local.set({"teams": JSON.stringify(clearedTeams)});
        });
    });


    $("#teams-container").on("click", ".team-repo-delete-btn", function(event) {
        let teamId = $(this).attr("teamId");
        let repoId = $(this).attr("repoId");
        loadLocalTeams().then((isLoaded) => {
            let clearedTeams = [...teams].map((team) => {
                if (team.name === teamId) {
                    team.repositories = team.repositories.filter((repo) => (repo.path !== repoId))
                }
                return team;
            });
            setTeams(clearedTeams);
            chrome.storage.local.set({"teams": JSON.stringify(clearedTeams)});
        });
    });
    

    const main = () => {
        Promise.all([
            loadLocalUsers(),
            loadLocalRepositories()
        ]).then(values => {
            loadLocalTeams();
        });
    }


    main();
});


