var CACHE_INTERVAL = 10000;
function loadCache() {
    chrome.runtime.sendMessage({ type: 'CACHE_REQUEST' }, function (response) {
        if (response) {
            var url = response;
            var oReq = new XMLHttpRequest();
            oReq.open("GET", url.url, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function (oEvent) {
                if (oReq.status === 200) {
                    var arrayBuffer = oReq.response; // Note: not oReq.responseText
                    var base64str = _arrayBufferToBase64(arrayBuffer);
                    url.data = base64str.toString();
                    chrome.runtime.sendMessage({ type: 'CACHE_RESULT', data: url });
                }
            };
            oReq.send();
        }
    })
}
loadCache();
setInterval(loadCache, CACHE_INTERVAL);