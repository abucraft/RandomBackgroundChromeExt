var CACHE_INTERVAL = 10000;
function loadCache() {
    chrome.runtime.sendMessage({ type: 'CACHE_REQUEST' }, async function (response) {
        if (response) {
            const url = response;
            const res = await _fetchWithCredential(url.url);
            if (res.status === 200) {
                const arrayBuffer = await res.arrayBuffer();
                const base64str = _arrayBufferToBase64(arrayBuffer);
                url.data = base64str;
                chrome.runtime.sendMessage({ type: 'CACHE_RESULT', data: url });
            }
        }
    })
}

loadCache();
setInterval(loadCache, CACHE_INTERVAL);