var encryptedAES = CryptoJS.AES.encrypt("Message", "My Secret");
console.log("encryptedAES:")
console.log(encryptedAES)
var decryptedBytes = CryptoJS.AES.decrypt(encryptedAES, "My Secret");
console.log("decryptedBytes:")
console.log(decryptedBytes)
var plaintext = decryptedBytes.toString(CryptoJS.enc.Utf8);
console.log("plaintext:")
console.log(plaintext)


$( document ).ready(function() {
    
    let storageState = {
        users: [],
        repositories: [],
        ght: '',
    }

    const updateStorageState = (newState) => {
        storageState = {...storageState, ...newState};
    }

    const loadStorage = () => {
        users = chrome.storage.local.get('users');
        repositories = chrome.storage.local.get('repositories');
        ght = chrome.storage.local.get('ght');
    } 
    
    const saveStorage = () => {
        for (const [key, value] of Object.entries(storageState)) {
            chrome.storage.local.set({key: JSON.stringify(value)});
          }
    } 




    $("#add-user-form").submit(function(event) {
        event.preventDefault();
        var values = $(this).serialize();
        
        updateStorageState({users: storageState.users.push(values)});
        saveStorage();

        // let data = JSON.stringify( $(form).serializeArray() );
        // console.log(data);

        // chrome.storage.local.set({key: value}, function() {
        //     console.log('User saved');
        //   });


    });
    


});


