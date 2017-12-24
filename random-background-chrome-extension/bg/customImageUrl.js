var custom = (function () {
    var api = {
        apis: [],
        name: "custom",
        name_zh: "自定义",
        type: 'custom',
        chance: 0
    }

    var exported = {
        getImageUrl: getImageUrl,
        api: api
    }
    function getImageUrl() {
        // _randomPick will splice array, push element back to it
        var url = _randomPick(exported.api.apis, 1).shift();
        exported.api.apis.push(url);
        if (url) {
            return Promise.resolve(url);
        } else {
            return Promise.reject();
        }
    }
    return exported;
})();