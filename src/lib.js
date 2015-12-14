/**
 * @file 上传图片基础库
 * @author chengong03(chengong03@baidu.com)
 * @date 2015-05-05
 */

define(function (require) {

    /**
     * 基础库
     *
     * @exports lib
     */
    var lib = {};

    /**
     * 字符串格式化
     *
     * @param {string} tpl 模板
     * @param {Object} data 传入变量
     * @return {string} 格式化后的字符串
     */
    lib.stringFormat = function (tpl, data) {
        return tpl.replace(
            /\$\{([-a-z0-9_]+)\}/ig,
            function (all, name) {
                return data[name] || '';
            }
        );
    };

    /**
     * 将一个变量转换成array
     *
     * @public
     * @param {*} source 需要转换成array的变量
     * @return {Array} 转换后的array
     */
    lib.toArray = function (source) {
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
    };

    /**
     * 移除数组中的项
     *
     * @public
     * @param {Array} source 需要移除项的数组
     * @param {*} match 要移除的项
     *
     * @return {Array} 移除后的数组
     */
    lib.arrayRemove = function (source, match) {
        var len = source.length;

        while (len--) {
            if (len in source && source[len] === match) {
                source.splice(len, 1);
            }
        }
        return source;
    };

    /**
     * 是否支持css3的transition
     *
     * @public
     * @return {boolean} 支持状态
     */
    lib.supportTransition = (function () {
        var s = document.createElement('p').style;
        var r = 'transition' in s
            || 'WebkitTransition' in s
            || 'MozTransition' in s
            || 'msTransition' in s
            || 'OTransition' in s;
        s = null;
        return r;
    })();

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
     * @public
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
     * @public
     * @return {boolean} 是否支持base64
     */
    lib.isSupportBase64 = (function () {
        var data = new Image();
        var support = true;

        data.onload = data.onerror = function () {
            if (this.width !== 1 || this.height !== 1) {
                support = false;
            }
        };
        data.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        return support;
    })();

    /**
     * 选中图片
     *
     * @public
     * @param {HTMLElement} elem 旋转的对象
     * @param {number} rotation 旋转角度
     */
    lib.rotateFile = function (elem, rotation) {
        elem = $(elem);
        if (lib.supportTransition) {
            var deg = 'rotate(' + rotation + 'deg)';
            elem.css({
                '-webkit-transform': deg,
                '-mos-transform': deg,
                '-o-transform': deg,
                'transform': deg
            });
        }
        else {
            var ieRotate = +((rotation / 90) % 4 + 4) % 4;
            elem.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + ieRotate + ')');
        }
    };

    /**
     * 随机字符串
     *
     * @public
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
     * @public
     * @param {string} name flash对象的名称
     * @return {HTMLElement} flash对象的实例
     */
    lib.getSwfMovie = function (name) {
        // ie9下, Object标签和embed标签嵌套的方式生成flash时,
        // 会导致document[name]多返回一个Object元素,而起作用的只有embed标签
        var movie = document[name];
        var ret;

        if (lib.browser.ie === 9) {
            if (movie && movie.length) {
                ret = lib.arrayRemove(
                    lib.toArray(movie),
                    function (item) {
                        return item.tagName.toLowerCase() !== 'embed';
                    }
                );

                return (ret.length === 1) ? ret[0] : ret;
            }
        }
        else {
            return movie || window[name];
        }
    };

    /**
     * 创建flash对象的html字符串
     * @name createSwfHTML
     * @function
     * @grammar createSwfHTML(options)
     *
     * @param {Object} options 创建flash的选项参数
     * @param {string} options.id 要创建的flash的标识
     * @param {string} options.url flash文件的url
     * @param {string} options.width flash的宽度
     * @param {string} options.height flash的高度
     *
     * @meta standard
     * @return {string} flash对象的html字符串
     */
    lib.createSwfHTML = function (options) {
        options = options || {};

        var i;
        var k;
        var len;
        var item;
        var tmpOpt = {};

        // 复制options，避免修改原对象
        for (k in options) {
            if (options.hasOwnProperty(k)) {
                tmpOpt[k] = options[k];
            }
        }
        options = tmpOpt;

        var objProperties = ['classid', 'codebase', 'id', 'width', 'height', 'align'];

        // 初始化object标签需要的classid、codebase属性值
        options.align = 'middle';
        options.classid = 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000';
        options.codebase = 'http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0';
        options.movie = options.url || '';
        options.wmode = 'transparent';
        options.allowscriptaccess = 'always';

        // 使用embed时，flash地址的属性名是src，并且要指定embed的type和pluginspage属性
        options.src  = options.movie;
        options.name = options.id;
        options.type = 'application/x-shockwave-flash';
        options.pluginspage = 'http://www.macromedia.com/go/getflashplayer';

        // fixed 构建IE下支持的object字符串，包括属性和参数列表，非ie浏览器下面使用embed！
        var str = ['<object '];

        var strEmbed = ['<embed'];
        for (i = 0, len = objProperties.length; i < len; i++) {
            item = objProperties[i];
            str.push(' ', item, '="', lib.encodeHTML(options[item]), '"');
        }
        str.push('>');
        var params = {
            wmode: 1,
            allowscriptaccess: 1,
            movie: 1
        };

        for (k in options) {
            if (options.hasOwnProperty(k)) {
                item = options[k];
                k = k.toLowerCase();
                if (params[k] && (item || item === false || item === 0)) {
                    str.push('<param name="' + k + '" value="' + lib.encodeHTML(item) + '" />');
                }
            }
        }

        // 构建embed标签的字符串
        str.push('<embed');

        for (k in options) {
            if (options.hasOwnProperty(k)) {
                item = options[k];
                if (item || item === false || item === 0) {
                    str.push(' ', k, '="', lib.encodeHTML(item), '"');
                    // modify
                    strEmbed.push(' ', k, '="', lib.encodeHTML(item), '"');
                }
            }
        }

        str.push('></embed></object>');
        strEmbed.push('></embed>');

        return lib.browser.ie ? str.join('') : strEmbed.join('');
    };

    return lib;
});
