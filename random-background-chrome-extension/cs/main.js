var testUrl = "https://cdna.artstation.com/p/assets/images/images/004/557/740/large/philipp-schmidt-philipp-schmidt-highresscreenshot00007.jpg?1484579584";
var testUrl2 = "https://i3.pixiv.net/img-original/img/2017/02/19/18/34/26/61536966_p0.png"
var CACHE_INTERVAL = 10000;
var ONE_MINITE = 60 * 1000;
var ITEM_HEIGHT = 56;
chrome.runtime.sendMessage({ type: 'QUERY' }, function (response) {
    onloadImage(response);
})
function loadCache() {
    chrome.runtime.sendMessage({ type: 'CACHE_REQUEST' }, function (response) {
        if (response) {
            var url = response;
            var oReq = new XMLHttpRequest();
            oReq.open("GET", url.url, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function (oEvent) {
                var arrayBuffer = oReq.response; // Note: not oReq.responseText
                var base64str = _arrayBufferToBase64(arrayBuffer);
                var data = 'data:image/png;base64,' + base64str;
                url.data = data;
                chrome.runtime.sendMessage({ type: 'CACHE_RESULT', data: url })
            };
            oReq.send();
        }
    })
}
loadCache();
setInterval(loadCache, CACHE_INTERVAL);

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var img = new Image();
var vm = {};
vm.strings = {
    background_settings: 'background settings',
    background_settings_zh: '背景设置',
    name: 'Settings',
    name_zh: '设置',
    link: 'image link',
    link_zh: '原图网址',
    website: 'website',
    website_zh: '网站',
    usage: 'usage',
    usage_zh: '使用概率',
    ok: 'ok',
    ok_zh: '确认',
    cancel: 'cancel',
    cancel_zh: '取消',
}
vm.items = [];
vm.newCustomUrl = '';
vm.image = {};
function onloadImage(data) {
    vm.image = data;
    console.log(data);
    var imageSrc = data.data || data.url;
    $(`<style type="text/css">body{ background-image:url(${imageSrc}) !important;background-size:cover !important; }  </style>`).appendTo($('body'));
    img.onload = function () {
        watchDom();
    }
    if (data.data) {
        img.src = data.data;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
    } else {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", data.url, true);
        oReq.responseType = "arraybuffer";
        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response; // Note: not oReq.responseText
            var base64str = _arrayBufferToBase64(arrayBuffer);
            var data = 'data:image/png;base64,' + base64str;
            img.src = data;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        oReq.send();
        oReq.onerror = function (e) {
            console.error(e);
        };
    }
    var interval = setInterval(function () {
        watchDom();
        setTimeout(function () {
            clearInterval(interval)
        }, ONE_MINITE);
    }, 1000)
    $(window).on('resize', watchDom);
}

function watchDom() {
    changeElementFontColor($('#mngb > div > div > div'));
    changeElementFontColor($('#setting-panel > .mdl-button'));
}

function changeElementFontColor(elm) {
    var rect = element2ImageRect(elm);
    if (rect && rect.width && rect.height) {
        var imageData = ctx.getImageData(rect.left, rect.top, rect.width, rect.height);
        var total = imageData.height * imageData.width;
        var red = 0;
        var green = 0;
        var blue = 0;
        for (var i = 0; i < total; i++) {
            red += imageData.data[i * 4];
            green += imageData.data[i * 4 + 1];
            blue += imageData.data[i * 4 + 2];
        }
        red = red / total;
        green = green / total;
        blue = blue / total;
        var average = red * 0.299 + green * 0.587 + blue * 0.114;
        var jqElm = $(elm);
        if (average < 128) {
            jqElm.css('color', 'white');
            jqElm.css('fill', 'white');
            jqElm.find('a').css('color', 'white');
            jqElm.find('span').css('color', 'white');
        } else {
            jqElm.css('color', '');
            jqElm.css('fill', '');
            jqElm.find('a').css('color', '');
            jqElm.find('span').css('color', '');
        }
    }
}

function element2ImageRect(elm) {
    var elm = $(elm);
    if (elm.length > 0) {
        var elmRect = elm[0].getClientRects()[0];
        var windowHeight = window.innerHeight;
        var windowWidth = window.innerWidth;
        var imgWidth = img.width;
        var imgHeight = img.height;
        if (windowWidth > imgWidth) {
            var rect = {};
            var scale = windowWidth / imgWidth;
            rect.left = elmRect.left / scale;
            rect.top = elmRect.top / scale;
            rect.width = elmRect.width / scale;
            rect.height = elmRect.height / scale;
            return rect;
        } else {
            return elmRect;
        }
    }
    return null;
}



Vue.directive('mdl', {
    inserted: function (el) {
        if (el) {
            componentHandler.upgradeElement(el);
        }
    }
});

function reheightBinding(el, binding) {
    if (binding.value.index === binding.value.item.apis.length - 1) {
        var number = calculateValidApis(binding.value.item);
        updateSubListHeight(el, number);
    }
}

Vue.directive('reheight',
    {
        inserted: reheightBinding,
        update: reheightBinding,
        unbind: reheightBinding
    })


function querySettings() {
    chrome.runtime.sendMessage({ type: 'QUERY_SETTINGS' }, function (response) {
        vm.items = response;
    })
}

function calculateValidApis(item) {
    var number = 0;
    var apis = item.apis;
    var type = item.type;
    for (var i = 0; i < apis.length; i++) {
        if (apis[i].show === false) {
            continue;
        }
        number++;
    }
    return type === 'custom' ? number + 1 : number;
}

function hideDrawer() {
    if ($('.mdl-layout__drawer').hasClass('is-visible')) {
        $('.mdl-layout__drawer').toggleClass('is-visible');
        $('.mdl-layout__obfuscator').toggleClass('is-visible');
    }
}

function showDrawer() {
    if (!$('.mdl-layout__drawer').hasClass('is-visible')) {
        $('.mdl-layout__drawer').toggleClass('is-visible');
        $('.mdl-layout__obfuscator').toggleClass('is-visible');
    }
}

function updateSubListHeight(elm, length) {
    var elm = $(elm);
    var sub = elm.closest('.sub');
    if (!length) {
        length = sub.find('.subitem').length;
    }
    var size = length * ITEM_HEIGHT;
    if (!sub.hasClass('closed'))
        sub.css('height', size);
    else {
        sub.css('height', 0);
    }
}

querySettings();

$.get(chrome.runtime.getURL('cs/setting.html'), function (data) {
    $('body').append(data);
    var vapp = new Vue({
        el: '#setting-panel',
        data: vm,
        methods: {
            collapse: function (event) {
                var current;
                for (var i = 0; i < event.path.length; i++) {
                    if ($(event.path[i]).is('button')) {
                        current = $(event.path[i]);
                        break;
                    }
                }

                if (i < event.path.length) {
                    current.toggleClass('closed');
                    current.next().toggleClass('closed');
                }
                updateSubListHeight(current.next().children()[0]);
            },
            apply: function () {
                chrome.runtime.sendMessage({ type: 'APPLY_SETTINGS', data: vm.items });
                hideDrawer();
            },
            refresh: function () {
                querySettings();
            },
            cancel: hideDrawer,
            open: function () {
                showDrawer()
                querySettings();
            },
            showSub: function (item) {
                if (item.type === "custom") {
                    return true;
                }
                if (item.type === "other") {
                    var apis = item.apis;
                    for (var i = 0; i < apis.length; i++) {
                        if (apis[i].show) {
                            return true;
                        }
                    }
                }
                return false;
            },
            addCustomUrl: function (item) {
                item.apis.push({ url: this.newCustomUrl });
                this.newCustomUrl = '';
            },
            removeCustomUrl: function (item, index) {
                item.apis.splice(index, 1);
            },
            getString: function (store, key) {
                var postfixed = key;
                if (navigator.language.indexOf('zh') !== -1) {
                    postfixed = key + '_zh';
                }
                return store[postfixed] ? store[postfixed] : store[key];
            }
        }
    })
})
