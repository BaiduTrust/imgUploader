
/**
 * @file 上传图片基础库
 * @author chengong03(chengong03@baidu.com)
 * @date 2015-05-05
 */

define(function (require) {

    /**
     * 将一个变量转换成array
     *
     * @inner
     * @param {*} source 需要转换成array的变量
     * @return {Array} 转换后的array
     */
    function toArray(source) {
        if (source === null || source === undefined) {
            return [];
        }

        if (Object.prototype.toString.call(source) === '[Object Array]') {
            return source;
        }

        // The strings and functions also have 'length'
        if (typeof source.length !== 'number'
            || typeof source === 'string'
            || Object.prototype.toString.call(source) === '[Object Function]'
        ) {
            return [source];
        }

        // nodeList, IE 下调用 [].slice.call(nodeList) 会报错
        if (source.item) {
            var l = source.length;
            var array = new Array(l);
            while (l--) {
                array[l] = source[l];
            }

            return array;
        }

        return [].slice.call(source);
    }

    /**
     * 移除数组中的项
     *
     * @inner
     * @param {Array} source 需要移除项的数组
     * @param {*} match 要移除的项
     *
     * @return {Array} 移除后的数组
     */
    function arrayRemove(source, match) {
        var len = source.length;

        while (len--) {
            if (len in source && source[len] === match) {
                source.splice(len, 1);
            }
        }
        return source;
    }

    /**
     * 是否支持css3的transition
     *
     * @inner
     * @return {boolean} 支持状态
     */
    function supportTransition() {
        var s = document.createElement('p').style;
        var r = 'transition' in s
            || 'WebkitTransition' in s
            || 'MozTransition' in s
            || 'msTransition' in s
            || 'OTransition' in s;
        s = null;
        return r;
    }

    /**
     * flash版本
     *
     * @public
     * @return {number} flash版本号
     */
    /* eslint-disable */
    function flashVersion() {
        var flashVer = NaN;

        if (window.ActiveXObject) {
            var swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');

            if (swf) {
                var ver = swf.GetVariable('$version')
                    .split(' ')[1].replace(/\,/g, '.')
                    .replace(/^(\d+\.\d+).*$/, '$1');
                flashVer = Number(ver);
            }
        }
        else {
            if (navigator.plugins && navigator.plugins.length) {
                var swf = navigator.plugins['Shockwave Flash'];

                if (swf) {
                    var arr = swf.description.split(' ');
                    for (var i = 0, len = arr.length; i < len; i++) {
                        var ver = Number(arr[i]);

                        if (!isNaN(ver)) {
                            flashVer = ver;
                            break;
                        }
                    }
                }
            }
        }

        return flashVer;
    }

    /**
     * 基础库
     *
     * @exports lib
     */
    var lib = {};

    /**
     * 浏览器判断及版本
     * IE 8下，以documentMode为准
     */
    lib.browser = {
        ie: /msie (\d+\.\d+)/i.test(navigator.userAgent)
            ? (document.documentMode || +RegExp.$1)
            : undefined,
        firefox: /firefox\/(\d+\.\d+)/i.test(navigator.userAgent)
            ? +RegExp.$1
            : undefined,
        chrome: /chrome\/(\d+\.\d+)/i.test(navigator.userAgent)
            ? +RegExp.$1
            : undefined
    };

    /**
     * 对目标字符串进行html编码
     *
     * @inner
     * @param {string} source 目标字符串
     * @return {string} html编码后的字符串
     */
    lib.encodeHTML = function (source) {
        return String(source)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    /**
     * 判断是否支持base64
     *
     * @inner
     * @return {boolean} 是否是base64
     */
    lib.isSupportBase64 = function () {
        var data = new Image();
        var support = true;

        data.onload = data.onerror = function () {
            if (this.width !== 1 || this.height !== 1) {
                support = false;
            }
        };
        data.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        return support;
    };

    /**
     * 选中图片
     *
     * @inner
     * @param {HTMLElement} elem 旋转的对象
     * @param {number} rotation 旋转角度
     */
    lib.rotateFile = function (elem, rotation) {
        elem = $(elem);
        if (supportTransition) {
            var deg = 'rotate(' + rotation + 'deg)';
            elem.css({
                '-webkit-transform': deg,
                '-mos-transform': deg,
                '-o-transform': deg,
                'transform': deg
            });
        }
        else {
            var ieRotate = ~~((rotation / 90) % 4 + 4) % 4;
            elem.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + ieRotate + ')');
        }
    };

    /**
     * 随机字符串
     *
     * @inner
     * @param  {number} len 字符串长度
     * @return {string} 随机字符串
     */
    lib.randomString = function (len) {
        len = len || 32;
        var chars = ''
            + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            + 'abcdefghijklmnopqrstuvwxyz'
            + '0123456789';
        var maxPos = chars.length;
        var pwd = '';
        for (var i = 0; i < len; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    };

    /**
     * 获得flash对象的实例
     *
     * @inner
     * @param {string} name flash对象的名称
     * @return {HTMLElement} flash对象的实例
     */
    lib.getSwfMovie = function (name) {
        // ie9下, Object标签和embed标签嵌套的方式生成flash时,
        // 会导致document[name]多返回一个Object元素,而起作用的只有embed标签
        var movie = document[name];
        var ret;
        return lib.browser.ie === 9 ?
            movie && movie.length ?
                (ret = arrayRemove(toArray(movie), function (item) {
                    return item.tagName.toLowerCase() !== 'embed';
                })).length === 1 ? ret[0] : ret
                : movie
            : movie || window[name];
    };

    /* eslint-enable */

    /**
     * 创建flash对象的html字符串
     * @name createSwfHTML
     * @function
     * @grammar createSwfHTML(options)
     *
     * @param {Object}  options                     创建flash的选项参数
     * @param {string}  options.id                  要创建的flash的标识
     * @param {string}  options.url                 flash文件的url
     * @param {String}  options.errorMessage        未安装flash player或flash player版本号过低时的提示
     * @param {string}  options.ver                 最低需要的flash player版本号
     * @param {string}  options.width               flash的宽度
     * @param {string}  options.height              flash的高度
     * @param {string}  options.align               flash的对齐方式，允许值：middle/left/right/top/bottom
     * @param {string}  options.base                设置用于解析swf文件中的所有相对路径语句的基本目录或URL
     * @param {string}  options.bgcolor             swf文件的背景色
     * @param {string}  options.salign              设置缩放的swf文件在由width和height设置定义的区域内的位置。允许值：l/r/t/b/tl/tr/bl/br
     * @param {boolean} options.menu                是否显示右键菜单，允许值：true/false
     * @param {boolean} options.loop                播放到最后一帧时是否重新播放，允许值： true/false
     * @param {boolean} options.play                flash是否在浏览器加载时就开始播放。允许值：true/false
     * @param {string}  options.quality             设置flash播放的画质，允许值：low/medium/high/autolow/autohigh/best
     * @param {string}  options.scale               设置flash内容如何缩放来适应设置的宽高。允许值：showall/noborder/exactfit
     * @param {string}  options.wmode               设置flash的显示模式。允许值：window/opaque/transparent
     * @param {string}  options.allowscriptaccess   设置flash与页面的通信权限。允许值：always/never/sameDomain
     * @param {string}  options.allownetworking     设置swf文件中允许使用的网络API。允许值：all/internal/none
     * @param {boolean} options.allowfullscreen     是否允许flash全屏。允许值：true/false
     * @param {boolean} options.seamlesstabbing     允许设置执行无缝跳格，从而使用户能跳出flash应用程序。
     *                                              该参数只能在安装Flash7及更高版本的Windows中使用。允许值：true/false
     * @param {boolean} options.devicefont          设置静态文本对象是否以设备字体呈现。允许值：true/false
     * @param {boolean} options.swliveconnect       第一次加载flash时浏览器是否应启动Java。允许值：true/false
     * @param {Object}  options.vars                要传递给flash的参数，支持JSON或string类型
     *
     * @meta standard
     * @returns {string} flash对象的html字符串
     */
    /* eslint-disable */
    lib.createSwfHTML = function (options) {
        options = options || {};
        var version = flashVersion;
        var needVersion = options.ver || '10';
        var i;
        var k;
        var len;
        var item;
        var tmpOpt = {};

        // 复制options，避免修改原对象
        for (k in options) {
            tmpOpt[k] = options[k];
        }
        options = tmpOpt;

        // 浏览器支持的flash插件版本判断
        if (!version || version < needVersion) {
            return;
        }

        var vars = options.vars;
        var objProperties = ['classid', 'codebase', 'id', 'width', 'height', 'align'];

        // 初始化object标签需要的classid、codebase属性值
        options.align = options.align || 'middle';
        options.classid = 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000';
        options.codebase = 'http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0';
        options.movie = options.url || '';
        delete options.vars;
        delete options.url;

        // 初始化flashvars参数的值
        if ('string' === typeof vars) {
            options.flashvars = vars;
        }
        else {
            var fvars = [];
            for (k in vars) {
                item = vars[k];
                fvars.push(k + '=' + encodeURIComponent(item));
            }
            options.flashvars = fvars.join('&');
        }

        // fixed 构建IE下支持的object字符串，包括属性和参数列表，非ie浏览器下面使用embed！
        var str = ['<object '];
        // modify
        var strEmbed = ['<embed'];
        for (i = 0, len = objProperties.length; i < len; i++) {
            item = objProperties[i];
            str.push(' ', item, '="', lib.encodeHTML(options[item]), '"');
        }
        str.push('>');
        var params = {
            'wmode'             : 1,
            'scale'             : 1,
            'quality'           : 1,
            'play'              : 1,
            'loop'              : 1,
            'menu'              : 1,
            'salign'            : 1,
            'bgcolor'           : 1,
            'base'              : 1,
            'allowscriptaccess' : 1,
            'allownetworking'   : 1,
            'allowfullscreen'   : 1,
            'seamlesstabbing'   : 1,
            'devicefont'        : 1,
            'swliveconnect'     : 1,
            'flashvars'         : 1,
            'movie'             : 1
        };

        for (k in options) {
            item = options[k];
            k = k.toLowerCase();
            if (params[k] && (item || item === false || item === 0)) {
                str.push('<param name="' + k + '" value="' + lib.encodeHTML(item) + '" />');
            }
        }

        // 使用embed时，flash地址的属性名是src，并且要指定embed的type和pluginspage属性
        options.src  = options.movie;
        options.name = options.id;
        delete options.id;
        delete options.movie;
        delete options.classid;
        delete options.codebase;
        options.type = 'application/x-shockwave-flash';
        options.pluginspage = 'http://www.macromedia.com/go/getflashplayer';


        // 构建embed标签的字符串
        str.push('<embed');
        // 在firefox、opera、safari下，salign属性必须在scale属性之后，否则会失效
        // 经过讨论，决定采用BT方法，把scale属性的值先保存下来，最后输出
        var salign;
        for (k in options) {
            item = options[k];
            if (item || item === false || item === 0) {
                if ((new RegExp('^salign\x24', 'i')).test(k)) {
                    salign = item;
                    continue;
                }

                str.push(' ', k, '="', lib.encodeHTML(item), '"');
                // modify
                strEmbed.push(' ', k, '="', lib.encodeHTML(item), '"');
            }
        }

        if (salign) {
            str.push(' salign="', lib.encodeHTML(salign), '"');
            // modify
            strEmbed.push(' salign="', lib.encodeHTML(salign), '"');
        }
        str.push('></embed></object>');
        // modify
        strEmbed.push('></embed>');

        // modify
        return lib.browser.ie ? str.join('') : strEmbed.join('');
    };
    /* eslint-enable */

    return lib;
});
