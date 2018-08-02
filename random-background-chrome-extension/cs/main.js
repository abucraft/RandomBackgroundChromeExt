if (vm) {
    throw '[Random Background]:vm has been defined';
}
var ORIGIN_URL = window.location.href;

var SECOND = 1000;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var ITEM_HEIGHT = 56;

var vm = {};
vm.strings = {
    background_settings: 'background settings',
    background_settings_zh: '背景设置',
    download_image: 'download image',
    download_image_zh: '下载图片',
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
    update_time: "update time",
    update_time_zh: "更新频率",
    second: "s",
    second_zh: "秒",
    minute: "m",
    minute_zh: "分钟",
    hour: "h",
    hour_zh: "小时",
    apply_on_desktop_wallpaper: 'apply on desktop wallpaper',
    apply_on_desktop_wallpaper_zh: '应用于桌面背景',
    run_in_background: 'run in background',
    run_in_background_zh: '后台运行',
}
vm.items = [];
vm.settings = { applyOnDesktopWallpaper: true, wallpaperUpdateTime: MINUTE }
vm.timeSegments = [0.5 * MINUTE, 5 * MINUTE, 15 * MINUTE, 30 * MINUTE, 60 * MINUTE, 3 * 60 * MINUTE, 12 * 60 * MINUTE];
vm.newCustomUrl = '';
vm.SECOND = SECOND;
vm.MINUTE = MINUTE;
vm.HOUR = HOUR;
vm.image = {};

Vue.directive('mdl', {
    inserted: function (el) {
        if (el) {
            componentHandler.upgradeElement(el);
        }
    }
});

Vue.directive('mdl-select', {
    inserted: function (el) {
        if (el) {
            componentHandler.upgradeElement(el);
            var input = el.querySelector('input');
            var list = el.querySelectorAll('li');
            var menu = el.querySelector('.mdl-js-menu');
            input.onkeydown = function (event) {
                if (event.keyCode == 38 || event.keyCode == 40) {
                    menu['MaterialMenu'].show();
                }
            };

            //return focus to input
            menu.onkeydown = function (event) {
                if (event.keyCode == 13) {
                    input.focus();
                }
            };

            [].forEach.call(list, function (li) {
                li.onclick = function () {
                    input.value = li.textContent;
                    el.MaterialTextfield.change(li.textContent); // handles css class changes
                    setTimeout(function () {
                        el.MaterialTextfield.updateClasses_(); //update css class
                    }, 250);

                    // update input with the "id" value
                    input.dataset.val = li.dataset.val || '';

                    if ("createEvent" in document) {
                        var evt = document.createEvent("HTMLEvents");
                        evt.initEvent("change", false, true);
                        menu['MaterialMenu'].hide();
                        input.dispatchEvent(evt);
                    } else {
                        input.fireEvent("onchange");
                    }
                };
            });
            var width = (el.querySelector('.mdl-menu').offsetWidth ? el.querySelector('.mdl-menu').offsetWidth : getmdlSelect.defaultValue.width);
            el.style.width = width + 'px'
        }
    }
})

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
    });
Vue.directive('mdl-check-refresh', {
    update: function (el, binding) {
        var checked = binding.value.value;
        if ($(el).parent().hasClass('is-checked') !== checked) {
            $(el).parent().toggleClass('is-checked');
        }
    }
})


function querySettings() {
    chrome.runtime.sendMessage({ type: 'QUERY_SETTINGS' }, function (response) {
        vm.items = response.sources;
        vm.settings = response.settings;
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
    // clean background when do google search
    var urlWatcher = setInterval(function () {
        var url = window.location.href;
        if (url !== ORIGIN_URL) {
            console.log('[Random Background]:remove all');
            $('#setting-panel').remove();
            $('#rbkstyle').remove();
            clearInterval(urlWatcher)
        }
    }, 500);
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
                chrome.runtime.sendMessage({ type: 'APPLY_SETTINGS', data: { sources: vm.items, settings: vm.settings } });
                hideDrawer();
            },
            downloadImage: function() {
                var url = base64Url;
                var saveName = 'bg_download_' + Date.parse(new Date()) + '.' + imageType;

                var aLink = document.createElement('a');
                aLink.href = url;
                aLink.download = saveName || '';
                var event = new MouseEvent('click');

                aLink.dispatchEvent(event);
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
            },
            timeToString: function (time) {
                var hour = parseInt(time / HOUR);
                if (hour) {
                    return hour + this.getString(this.strings, 'hour');
                }
                var minute = parseInt(time / MINUTE);
                if (minute) {
                    return minute + this.getString(this.strings, 'minute');
                }
                var second = parseInt(time / SECOND);
                if (second) {
                    return second + this.getString(this.strings, 'second');
                }
                return "";
            },
            wallpaperTimeChange: function (event) {
                var dataval = event.target.dataset.val;
                this.settings.wallpaperUpdateTime = parseInt(dataval);
            }
        }
    })
})

