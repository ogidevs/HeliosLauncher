const loginOptionsCancelContainer = document.getElementById('loginOptionCancelContainer')
const loginOptionMicrosoft = document.getElementById('loginOptionMicrosoft')
const loginOptionMojang = document.getElementById('loginOptionMojang')
const loginOptionCracked = document.getElementById('loginOptionCracked')
const usernameInput = document.getElementById('usernameInput')
const passwordInput = document.getElementById('passwordInput')
const loginOptionsCancelButton = document.getElementById('loginOptionCancelButton')
const loginNotification = document.getElementById('loginNotification')

let loginOptionsCancellable = false

let loginOptionsViewOnLoginSuccess
let loginOptionsViewOnLoginCancel
let loginOptionsViewOnCancel
let loginOptionsViewCancfelHandler

function loginOptionsCancelEnabled(val){
    if(val){
        $(loginOptionsCancelContainer).show()
    } else {
        $(loginOptionsCancelContainer).hide()
    }
}

loginOptionMicrosoft.onclick = (e) => {
    switchView(getCurrentView(), VIEWS.waiting, 500, 500, () => {
        ipcRenderer.send(
            MSFT_OPCODE.OPEN_LOGIN,
            loginOptionsViewOnLoginSuccess,
            loginOptionsViewOnLoginCancel
        )
    })
}

loginOptionCracked.onclick = (e) => {
    if (usernameInput.value.length < 3) {
        $('#loginNotification').fadeIn(1000);
        loginNotification.innerHTML = 'Korisničko ime mora imati najmanje 3 karaktera.'
        $('#loginNotification').delay(3000).fadeOut(1000);
        return
    }
    if (passwordInput.value.length < 3) {
        $('#loginNotification').fadeIn(1000);
        loginNotification.innerHTML = 'Lozinka mora imati najmanje 3 karaktera.'
        $('#loginNotification').delay(3000).fadeOut(1000);
        return
    }
    const url = `${ConfigManager.getBackendURL()}/get_character/${usernameInput.value}?char_password=${passwordInput.value}`;
    // Napravite AJAX zahtev koristeći fetch
    fetch(url)
    .then(async response => {
        if (!response.ok) {
            $('#loginNotification').fadeIn(1000);
            var jsonResponse = await response.json().catch(() => ({ message: 'Neispravni podaci za prijavu. Pokušajte ponovo.' }));
            console.log(jsonResponse)
            if (jsonResponse.result === false) {
                loginNotification.innerHTML = jsonResponse.message
            } else {
                loginNotification.innerHTML = 'Neispravni podaci za prijavu. Pokušajte ponovo.'
            }
            $('#loginNotification').delay(3000).fadeOut(1000);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Server odgovor:', data);
        if (data.result) {
            AuthManager.addCrackedAccount(usernameInput.value, passwordInput.value).then((value) => {
                updateSelectedAccount(value)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                setTimeout(() => {
                    switchView(VIEWS.login, loginViewOnSuccess, 500, 500, async () => {
                        // Temporary workaround
                        if(loginViewOnSuccess === VIEWS.settings){
                            await prepareSettings()
                        }
                        loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                        loginCancelEnabled(false) // Reset this for good measure.
                        loginViewCancelHandler = null // Reset this for good measure.
                        loginUsername.value = ''
                        loginPassword.value = ''
                        $('.circle-loader').toggleClass('load-complete')
                        $('.checkmark').toggle()
                        loginLoading(false)
                        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                        formDisabled(false)

                        // PROMENI SKIN NA POCETNOJ STRANI KAD NEKO DODA NOVI NALOG
                        const avatarContainer = document.getElementById('avatarContainer');
                        var skin1 = 'https://mc-heads.com/images/skeleton_skull.png';
                        console.log(passwordInput.value)
                        fetch(`${ConfigManager.getBackendURL()}/get_character_skin/${ConfigManager.getSelectedAccount().username}`)
                            .then(response => {
                                if (response.status === 404) {
                                    avatarContainer.style.backgroundImage = `url('${skin1}')`;
                                    throw new Error('Image not found (404)');
                                }
                                return response.blob();
                            })
                            .then(blob => {
                                return new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                            })
                            .then(dataUrl => {
                                avatarContainer.style.backgroundImage = `url('${dataUrl}')`;
                            })
                            .catch(error => console.error('Error fetching the image:', error));
                        })
                }, 1000)
            }).catch((displayableError) => {
                loginLoading(false)
        
                let actualDisplayableError
                if(isDisplayableError(displayableError)) {
                    msftLoginLogger.error('Error while logging in.', displayableError)
                    actualDisplayableError = displayableError
                } else {
                    // Uh oh.
                    msftLoginLogger.error('Unhandled error during login.', displayableError)
                    actualDisplayableError = Lang.queryJS('login.error.unknown')
                }
        
                setOverlayContent(actualDisplayableError.title, actualDisplayableError.desc, Lang.queryJS('login.tryAgain'))
                setOverlayHandler(() => {
                    formDisabled(false)
                    toggleOverlay(false)
                })
                toggleOverlay(true)
            })
        
            switchView(getCurrentView(), VIEWS.landing, 500, 500, () => {
                
            })
        } else {
            $('#loginNotification').fadeIn(1000);
            loginNotification.innerHTML = data.message
            $('#loginNotification').delay(3000).fadeOut(1000);
        }
    })
    .catch(error => {
        console.error('Greška:', error);
        $('#loginNotification').fadeIn(1000);
        $('#loginNotification').delay(3000).fadeOut(1000);
    });
}


loginOptionMojang.onclick = (e) => {
    switchView(getCurrentView(), VIEWS.login, 500, 500, () => {
        loginViewOnSuccess = loginOptionsViewOnLoginSuccess
        loginViewOnCancel = loginOptionsViewOnLoginCancel
        loginCancelEnabled(true)
    })
}

loginOptionsCancelButton.onclick = (e) => {
    switchView(getCurrentView(), loginOptionsViewOnCancel, 500, 500, () => {
        // Clear login values (Mojang login)
        // No cleanup needed for Microsoft.
        loginUsername.value = ''
        loginPassword.value = ''
        if(loginOptionsViewCancelHandler != null){
            loginOptionsViewCancelHandler()
            loginOptionsViewCancelHandler = null
        }
    })
}