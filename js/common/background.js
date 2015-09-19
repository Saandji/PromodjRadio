var setLocalStorageItem = function(key, value) {
    localStorage.setItem(key, value);
};

var getLocalStorageItem = function(key) {
    return localStorage.getItem(key)
};

var removeLocalStorageItem = function(key) {
    localStorage.removeItem(key);
};

var getAudioElement = function() {
    return chrome.extension.getBackgroundPage().document.querySelector('audio');
};

var startChecking = function() {
    console.log("startChecking");
    if (getLocalStorageItem('checkConnectedId')) {
        clearInterval(getLocalStorageItem('checkConnectedId'));
    }
    setLocalStorageItem("checkConnectedId", setInterval(function () {
        checkConnected();
    }, 1500));
};

var stopChecking = function() {
    clearInterval(getLocalStorageItem('checkConnectedId'));
};

var checkConnected = function () {
    console.log("checkConnected");
    if (isPaused()) {
        console.log("audio is paused");
        if (getAudioElement().src) {
            getAudioElement().load();
            getAudioElement().play();
        }
    } else {
        console.log("currentTime is : " + getCurrentTime());
        if (getCurrentTime() == 0) {
            var cnt = getLocalStorageItem('checkCount') || 0;
            setLocalStorageItem("checkCount", ++cnt);
            if (cnt > 5 && cnt < 10) {
                console.log("getAudioElement().play();");
                getAudioElement().play();
            }
            if (cnt >= 10) {
                console.log("cnt > 10, reload audio");
                getAudioElement().load();
                getAudioElement().play();
                setLocalStorageItem("checkCount", 0);
            }
        }
    }
};

var getCurrentTime = function () {
    return chrome.extension.getBackgroundPage().document.querySelector('audio').currentTime;
};

var isPaused = function() {
    return chrome.extension.getBackgroundPage().document.querySelector('audio').paused;
};

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse){
        if(request.msg == "startChecking") startChecking();
    }
);

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse){
        if(request.msg == "stopChecking") stopChecking();
    }
);