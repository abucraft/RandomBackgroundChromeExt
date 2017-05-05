var LOG_ENABLE = false;
var log = {};
log.urls = [];
function logUrl(url) {
    if (LOG_ENABLE && url) {
        log.urls.push(url);
    }
}