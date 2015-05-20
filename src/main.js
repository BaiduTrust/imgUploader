/**
 * @file 上传图片业务组件
 * @author chengong03(chengong03@baidu.com)
 * @date 2015-05-05
 */

define(function (require) {

    var WebUploader = require('../dep/webuploader/webuploader');
    var lib = require('./lib');

    /**
     * 常量
     *
     * @const
     * @type {Object}
     */
    var CONSTS = {
        // 可以上传的图片类型
        ALLOWED_TYPE: 'image/png;image/jpeg;image/jpg;image/gif;image/bmp;',
        // 哈希前缀
        HASH_PRE: '_hash',
        // flash文件id前缀
        SWF_ID_PRE: 'img-pref'
    };

    /**
     * 错误信息常量
     *
     * @const
     * @type {Object}
     */
    var ERROR_MSG = {
        REQUIRE_PARAM_MAIN: 'required param "main" wrong',
        REQUIRE_PARAM_SERVER: 'required param "server" wrong',
        NOT_SUPPORT_BROWSER: 'WebUploader does not support the browser you are using.',
        REQUIRE_DOM_WRAP: 'img-uploader dom is required',
        REQUIRE_DOM_STATUSBAR: 'status-bar dom is required',
        REQUIRE_DOM_INFO: 'info dom is required',
        REQUIRE_DOM_UPLOAD: 'upload-btn dom is required',
        REQUIRE_DOM_PLACEHOLDER: 'placeholder dom is required',
        REQUIRE_DOM_PROGRESS: 'progress dom is required',
        REQUIRE_DOM_PICKER: 'file-picker dom is required'
    };

    /**
     * 文案常量
     *
     * @const
     * @type {Object}
     */
    var MSG = {
        BROWSER_TOO_OLD: '您的浏览器版本过低！',
        CHOOSE_IMG: '点击选择图片',
        ADD_IMG: '继续添加',
        START_TO_UPLOAD: '开始上传',
        CONTINUE_TO_UPLOAD: '继续上传',

        EXCEED_NUM_LIMIT: '一次最多可选${num}张哦~',
        EXCEED_SIZE_LIMIT: '文件总大小过大啦~',
        EXCEED_SIZE: '文件大小超出限制啦~',
        DUPLICATE: '文件不要重复上传哦',
        EXCEED_TOTAL_LIMIT: '最多只能上传${num}张哦~',

        SHOW_EXCEED_SITE: '文件大小超出',
        SHOW_INTERRUPT: '上传暂停',
        SHOW_FAILURE: '上传失败',
        SHOW_PREVIEW: '预览中',
        SHOW_NOT_PREVIEW: '不能预览',

        STATUS_TOTAL_SIZE: '选中${count}张图片，共${size}。',
        STATUS_SUCCESS_COUNT: ''
            + '成功上传：${successNum}张，失败：${failNum}张'
            + '<a class="retry" href="#" onclick="return false;">重新上传</a>',
        STATUS_PROGRESS: '共${total}张，已上传${successNum}张',
        STATUS_FAIL_COUNT: '，失败${failNum}张'
    };

    // 如果不支持base64，改用flash预览
    var filePrevPool = {};

    if (lib.isSupportBase64) {
        window.onFlashReady = function (id) {
            if (id && filePrevPool[id]) {
                lib.getSwfMovie(id).showPic(filePrevPool[id].replace(/data:image\/.*;base64,/, ''));
            }
        };
    }

    /**
     * 构造函数
     *
     * @constructor
     * @public
     * @exports Uploader
     * @example
     * new Uploader({
     *     main: '#Main',
     *     server: '/a/upload.php'
     * });
     *
     * @param {Object} opts 控件配置项
     * @param {(string | HTMLElement)} opts.main 上传组件初始化父节点
     * @param {number} opts.fileNumLimit 最多上传文件的数量
     * @param {string} opts.server 后端上传图片地址
     * @param {Funtion} opts.onStart 上传开始时的回调
     * @param {Funtion} opts.onFinished 上传结束时的回调
     */
    function Uploader(opts) {
        return this.init(opts);
    }

    Uploader.prototype = {

        /**
         * 控件初始化
         *
         * @private
         * @param {Object} opts 控件配置项
         * @see module:Uploader#opts
         */
        init: function (opts) {

            if (!opts || !$(opts.main).size()) {
                throw new Error(ERROR_MSG.REQUIRE_PARAM_MAIN);
            }

            if (!opts.server) {
                throw new Error(ERROR_MSG.REQUIRE_PARAM_SERVER);
            }

            if (!WebUploader.Uploader.support()) {
                alert(MSG.BROWSER_TOO_OLD);
                throw new Error(ERROR_MSG.NOT_SUPPORT_BROWSER);
            }

            this.opts = opts || {};

            var main = $(opts.main);

            var btnAddId = this.btnAddId = 'add-btn-' + lib.randomString(6);

            // web uploader实例
            this.uploader = null;

            var queue = $('<ul class="filelist"><div id="' + btnAddId + '"></div></ul>');
            queue.appendTo(main.find('.queue-list'));

            // 组件元素
            this.elements = {
                // 上传组件最外层dom
                main: main,
                // 上传组件容器
                wrap: main.find('.img-uploader'),
                // 图片容器
                queue: queue,
                // 状态栏
                statusBar: main.find('.status-bar'),
                // 文件总体选择信息
                info: main.find('.info'),
                // 上传按钮
                upload: main.find('.upload-btn'),
                // 没选择文件之前的内容
                placeHolder: main.find('.placeholder'),
                // 进度条
                progress: main.find('.progress'),
                // 上传框
                picker: main.find('.file-picker')
            };

            var elems = this.elements;
            var domMap = [
                {
                    elem: elems.wrap,
                    msg: ERROR_MSG.REQUIRE_DOM_WRAP
                },
                {
                    elem: elems.statusBar,
                    msg: ERROR_MSG.REQUIRE_DOM_STATUSBAR
                },
                {
                    elem: elems.info,
                    msg: ERROR_MSG.REQUIRE_DOM_INFO
                },
                {
                    elem: elems.upload,
                    msg: ERROR_MSG.REQUIRE_DOM_UPLOAD
                },
                {
                    elem: elems.placeHolder,
                    msg: ERROR_MSG.REQUIRE_DOM_PLACEHOLDER
                },
                {
                    elem: elems.progress,
                    msg: ERROR_MSG.REQUIRE_DOM_PROGRESS
                },
                {
                    elem: elems.picker,
                    msg: ERROR_MSG.REQUIRE_DOM_PICKER
                }
            ];

            // 错误处理
            $.each(domMap, function(i, item) {
                if (!item.elem) {
                    throw new Error(item.msg);
                }
            });

            // 初始化webuploader的默认参数
            this.defaultOpts = {
                pick: {
                    id: elems.picker,
                    label: MSG.CHOOSE_IMG
                },
                auto: true,
                dnd: elems.wrap,
                paste: elems.wrap,
                swf: '/src/swf/Uploader.swf',
                imgPrevSwf: '/src/swf/showPicDemo.swf',
                chunked: false,
                chunkSize: 512 * 1024,
                sendAsBinary: true,
                accept: {
                    title: 'Images',
                    extensions: 'jpg,jpeg,png,gif,bmp',
                    mimeTypes: 'image/*'
                },
                // 禁掉全局的拖拽功能。这样不会出现图片拖进页面的时候，把图片打开。
                disableGlobalDnd: true,
                fileNumLimit: 30,
                // 由于webuploader先验证是否超过总大小，因此这儿设置一个大的数值
                // 60 M
                fileSizeLimit: 60 * 1024 * 1024,
                // 2 M
                fileSingleSizeLimit: 2 * 1024 * 1024
            };

            // 添加的文件数量
            this.fileCount = 0;

            // 添加的文件总大小
            this.fileSize = 0;

            // 优化retina
            var ratio = window.devicePixelRatio || 1;

            // 缩略图大小
            this.thumbnailWidth = 100 * ratio;
            this.thumbnailHeight = 100 * ratio;

            // 可能有pedding, ready, uploading, confirm, done.
            this.state = 'pedding';

            // 所有文件的进度信息，key为file id
            this.percentages = {};

            // 上传成功后的文件信息
            this.uploadedFiles = {};

            this.render();
        },

        /**
         * 绘制控件
         *
         * @private
         */
        render: function () {
            var main = this.elements.main;

            this.opts = $.extend(true, {}, this.defaultOpts, this.opts);

            if (!this.uploader) {
                this.uploader = WebUploader.create(this.opts);

                this.uploader.addButton({
                    id: '#' + this.btnAddId,
                    label: MSG.ADD_IMG
                });

                this.initUploaderEvent();
                this.initDomEvent();

                this.elements.upload.addClass('state-' + this.state);
                this.updateTotalProgress();

                // 不支持html5的不出拖拽提示
                if (!(window.Blob && window.FileReader && window.DataView)) {
                    main.find('.drag-tip').hide();
                }
            }
        },

        /**
         * 更新样式
         * 如果没有图片的话恢复成初始样式
         * 如果有图片的话变成上传图片的样式
         *
         * @private
         */
        refreshStyle: function () {
            var elems = this.elements;

            if (!elems.queue.find('li').size()) {
                elems.placeHolder.height('auto');
            }
            else {
                elems.queue.show();
                elems.placeHolder.height(0);
            }
        },

        /**
         * 显示上传错误
         *
         * @private
         * @param {string} code 错误代码
         */
        showUploadErrorTip: function (code) {
            var tipMap = {
                Q_EXCEED_NUM_LIMIT: lib.stringFormat(
                    MSG.EXCEED_NUM_LIMIT,
                    {
                        num: this.opts.fileNumLimit
                    }
                ),
                Q_EXCEED_SIZE_LIMIT: MSG.EXCEED_SIZE_LIMIT,
                F_EXCEED_SIZE: MSG.EXCEED_SIZE,
                F_DUPLICATE: MSG.DUPLICATE
            };
            alert(tipMap[code]);
        },

        /**
         * uploader事件处理
         *
         * @private
         */
        initUploaderEvent: function () {
            var self = this;
            var uploader = this.uploader;
            var elems = self.elements;

            // 拖放过滤，只允许图片格式的文件拖拽进来
            uploader.on('dndAccept', function (items) {
                var denied = false;
                var len = items.length;

                for (var i = 0; i < len; i++) {
                    // 如果不在列表里面
                    if (!~CONSTS.ALLOWED_TYPE.indexOf(items[i].type)) {
                        denied = true;
                        break;
                    }
                }

                return !denied;
            });

            // 上传进度
            uploader.onUploadProgress = function (file, percentage) {
                // webuplaoder swf有bug，percentage会返回Infinity，简单屏蔽下
                if (!isFinite(percentage)) {
                    percentage = 1;
                }

                var li = $('#' + file.id);
                var percent = li.find('.progress .percent');
                var text = li.find('.progress .text');

                var percentVar = parseInt(percentage * 100, 10) + '%';
                li.find('.progress').show();
                text.text(percentVar);
                percent.css('width', percentVar);
                self.percentages[file.id][1] = percentage;
                self.updateTotalProgress();
            };

            // 即将进入队列
            uploader.onBeforeFileQueued = function (file) {
                // 不在列表里面
                if (!~CONSTS.ALLOWED_TYPE.indexOf(file.type)) {
                    return false;
                }

                // 超出最大允许上传的限制
                var stats = self.uploader.getStats();
                // 需要考虑失败的文件数!
                if (stats.successNum + stats.queueNum + stats.uploadFailNum >= self.opts.fileNumLimit) {
                    alert(
                        lib.stringFormat(
                            MSG.EXCEED_TOTAL_LIMIT,
                            {
                                num: self.opts.fileNumLimit
                            }
                        )
                    );
                    return false;
                }
            };

            // 文件入队列
            uploader.onFileQueued = function (file) {
                self.fileCount++;
                self.fileSize += file.size;

                if (self.fileCount === 1) {
                    elems.statusBar.show();
                }

                self.addFile(file);
                self.setState('ready');
                self.updateTotalProgress();

                self.refreshStyle();
            };

            // 文件出队列
            uploader.onFileDequeued = function (file) {
                self.fileCount--;
                self.fileSize -= file.size;

                if (!self.fileCount) {
                    self.setState('pedding');
                }

                self.removeFile(file);
                self.updateTotalProgress();

                self.refreshStyle();
            };

            // 上传成功
            uploader.onUploadAccept = function (object, ret) {
                if (ret && ret.status === 0) {
                    var data = ret.data || {};
                    self.uploadedFiles[object.file.__hash + CONSTS.HASH_PRE] = {
                        file: object,
                        info: data
                    };
                }
                else {
                    return false;
                }
            };

            // 开始上传
            uploader.onStartUpload = function () {
                if (self.opts.onStart) {
                    self.opts.onStart();
                }
            };

            // 全部文件上传完成
            uploader.onUploadFinished = function () {
                var files = self.getUploadedFiles();
                if (self.opts.onFinished) {
                    self.opts.onFinished(files);
                }
            };

            // all
            uploader.on('all', function (type) {
                switch (type) {
                    case 'uploadFinished':
                        self.setState('confirm');
                        break;
                    case 'startUpload':
                        self.setState('uploading');
                        break;
                    case 'stopUpload':
                        self.setState('paused');
                        break;
                }
            });

            uploader.onError = function (code) {
                self.showUploadErrorTip(code);
            };
        },

        /**
         * 相关dom事件处理
         *
         * @private
         */
        initDomEvent: function () {
            var self = this;

            var uploader = this.uploader;
            var info = this.elements.info;

            // 点击上传时的事件处理
            this.elements.upload.on('click', function () {
                var state = self.state;
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                if (state === 'ready' || state === 'paused') {
                    uploader.upload();
                }
                else if (state === 'uploading') {
                    uploader.stop(true);
                }
            });

            // 点击重新上传时的事件处理
            info.on('click', '.retry', function () {
                uploader.retry();
            });
        },

        /**
         * 展示错误信息
         *
         * @private
         * @param  {string} code 错误文案
         * @param  {(HTMLElement | object)} elem 容器
         */
        showError: function (code, elem) {
            var textWrap = $('<p class="error"></p>');
            var text = '';
            switch (code) {
                case 'exceed_size':
                    text = MSG.SHOW_EXCEED_SITE;
                    break;

                case 'interrupt':
                    text = MSG.SHOW_INTERRUPT;
                    break;

                default:
                    text = MSG.SHOW_FAILURE;
                    break;
            }

            textWrap.text(text).appendTo($(elem));
        },

        /**
         * 创建flash对象
         *
         * @private
         * @param  {num} id 唯一标识id
         * @param  {(HTMLElement | string)} wrap 放flash的容器
         */
        createSwf: function (id, wrap) {
            var html = lib.createSwfHTML({
                id: id,
                url: this.opts.imgPrevSwf,
                width: 100,
                height: 100
            });

            $(wrap).empty().append(html);
        },

        /**
         * 添加文件，添加之后，创建view
         *
         * @private
         * @param {Object} file 文件uploader封装的file对象
         */
        addFile: function (file) {
            var self = this;

            var uploader = this.uploader;
            var percentages = this.percentages;

            var liHtml = ''
                + '<li id="' + file.id + '">'
                +     '<p class="imgWrap"></p>'
                +     '<p class="progress" style="display:none;">'
                +         '<span class="text">0%</span>'
                +         '<span class="percent"></span>'
                +     '</p>'
                + '</li>';
            var li = $(liHtml);

            var btnsHtml = ''
                + '<div class="file-panel">'
                +     '<span class="cancel">X</span>'
                +     '<span class="rotate-right">右边</span>'
                + '</div>';

            var btns = $(btnsHtml).appendTo(li);


            var progress = li.find('p.progress');
            var wrap = li.find('p.imgWrap');
            var info = $('<p class="error"></p>');

            // 是否是已经上传的图片
            var isImgUploaded = file.progress === 'uploaded';

            if (file.getStatus() === 'instateid') {
                self.showError(file.statusText, li);
            }
            else {
                if (isImgUploaded) {
                    wrap.text(MSG.SHOW_PREVIEW);
                    var img = $('<img src="' + file.thumb + '">');
                    img.width(100);
                    img.height(100);
                    wrap.empty().append(img);
                    percentages[file.id] = [file.size, 1];
                    lib.rotateFile(wrap, file.rotation);
                }
                else {
                    wrap.text(MSG.SHOW_PREVIEW);

                    uploader.makeThumb(
                        file,
                        function (error, src) {
                            if (error) {
                                wrap.text(MSG.SHOW_NOT_PREVIEW);
                                return;
                            }

                            if (lib.isSupportBase64) {
                                var hash = +new Date();
                                var id = CONSTS.SWF_ID_PRE + hash;

                                self.createSwf(id, wrap);
                                filePrevPool[id] = src;
                                return;
                            }

                            var img = $('<img src="' + src + '">');
                            wrap.empty().append(img);
                        },
                        self.thumbnailWidth,
                        self.thumbnailHeight
                    );

                    percentages[file.id] = [file.size, 0];
                    file.rotation = 0;
                }
            }

            if (!isImgUploaded) {
                file.on('statuschange', function (cur, prev) {
                    if (prev === 'progress') {
                        progress.hide().width(0);
                    }

                    // 成功
                    if (cur === 'error' || cur === 'invalid') {
                        self.showError(file.statusText, li);
                        percentages[file.id][1] = 1;
                    }
                    else if (cur === 'interrupt') {
                        self.showError('interrupt', li);
                    }
                    else if (cur === 'queued') {
                        percentages[file.id][1] = 0;
                    }
                    else if (cur === 'progress') {
                        info.remove();
                        progress.css('display', 'block');
                    }
                    else if (cur === 'complete') {
                        li.append('<span class="success"></span>');
                    }

                    li.removeClass('state-' + prev).addClass('state-' + cur);
                });
            }
            else {
                li.append('<span class="success"></span>');
                li.addClass('state-complete');
            }

            li.hover(
                function () {
                    if (!li.hasClass('no-del')) {
                        btns.fadeIn(50);
                    }
                },
                function () {
                    if (!li.hasClass('no-del')) {
                        btns.fadeOut(50);
                    }
                }
            );

            // 暂时不用rotate
            btns.on('click', 'span', function () {
                var index = $(this).index();

                switch (index) {
                    case 0:
                        // 删除上传成功的
                        if (file.getStatus() === 'complete') {
                            self.uploader.request('get-stats').numOfSuccess--;
                            delete self.uploadedFiles[file.__hash + CONSTS.HASH_PRE];
                        }
                        uploader.removeFile(file);
                        return;
                    case 1:
                        file.rotation += 90;
                        break;
                    case 2:
                        file.rotation -= 90;
                        break;
                }

                lib.rotateFile(wrap, file.rotation);
            });

            li.appendTo(this.elements.queue);
        },

        /**
         * 移除文件
         *
         * @private
         * @param {Object} file 文件uploader封装的file对象
         */
        removeFile: function (file) {
            var li = $('#' + file.id);

            delete this.percentages[file.id];
            this.updateTotalProgress();
            li.off().find('.file-panel').off().end().remove();
        },

        /**
         * 移除所有文件
         *
         * @private
         */
        removeAllFiles: function () {
            this.percentages = {};
            this.updateTotalProgress();
            this.elements.queue
                .find('li').off()
                .find('.file-panel').off()
                .end().remove();
        },

        /**
         * 设置上传状态
         *
         * @private
         * @param {string} state 状态
         */
        setState: function (state) {
            var self = this;
            var stats = null;
            var elems = self.elements;
            var uploader = self.uploader;
            var uploadEle = elems.upload;
            var queueEle = elems.queue;
            var statusBarEle = elems.statusBar;
            var progressEle = elems.progress;

            if (state === self.state) {
                return;
            }

            uploadEle.removeClass('state-' + state);
            uploadEle.addClass('state-' + state);
            self.state = state;

            var lis = elems.main.find('.filelist li');

            switch (state) {
                // 待上传状态
                case 'pedding':
                    lis.removeClass('no-del');
                    queueEle.hide();
                    statusBarEle.addClass('element-invisible');
                    uploader.refresh();
                    break;

                // 准备上传状态
                case 'ready':
                    lis.removeClass('no-del');
                    uploadEle.text(MSG.START_TO_UPLOAD).removeClass('disabled');
                    queueEle.show();
                    statusBarEle.removeClass('element-invisible');
                    uploader.refresh();
                    break;

                // 上传状态
                case 'uploading':
                    lis.addClass('no-del');
                    progressEle.show();
                    uploadEle.addClass('disabled');
                    break;

                // 暂停状态
                case 'paused':
                    lis.addClass('no-del');
                    progressEle.show();
                    uploadEle.text(MSG.CONTINUE_TO_UPLOAD);
                    break;

                // 上传后状态，可能有上传失败的图片
                case 'confirm':
                    lis.removeClass('no-del');
                    progressEle.hide();
                    uploadEle.text(MSG.START_TO_UPLOAD).addClass('disabled');

                    stats = uploader.getStats();
                    if (stats.successNum && !stats.uploadFailNum) {
                        self.setState('finish');
                        return;
                    }
                    break;

                // 上传完毕状态，无上传失败的图片
                case 'finish':
                    lis.removeClass('no-del');
                    stats = uploader.getStats();
                    if (!stats.successNum) {
                        state = 'done';
                    }
                    break;
            }

            self.updateStatus();
        },

        /**
         * 更新上传状态信息
         *
         * @private
         */
        updateStatus: function () {
            var text = '';
            var stats = null;
            var state = this.state;
            var uploader = this.uploader;
            var fileCount = this.fileCount;
            var fileSize = this.fileSize;

            if (state === 'ready') {
                text = lib.stringFormat(
                    MSG.STATUS_TOTAL_SIZE,
                    {
                        count: fileCount,
                        size: WebUploader.formatSize(fileSize)
                    }
                );
            }
            else if (state === 'confirm') {
                stats = uploader.getStats();
                if (stats.uploadFailNum) {
                    text = lib.stringFormat(
                        MSG.STATUS_SUCCESS_COUNT,
                        {
                            successNum: stats.successNum,
                            failNum: stats.uploadFailNum
                        }
                    );
                }
            }
            else {
                stats = uploader.getStats();
                text = lib.stringFormat(
                    MSG.STATUS_PROGRESS,
                    {
                        total: fileCount,
                        successNum: stats.successNum
                    }
                );

                if (stats.uploadFailNum) {
                    text += lib.stringFormat(
                        MSG.STATUS_FAIL_COUNT,
                        {
                            failNum: stats.uploadFailNum
                        }
                    );
                }
            }

            this.elements.info.html(text);
        },

        /**
         * 更新进度条
         *
         * @private
         */
        updateTotalProgress: function () {
            var loaded = 0;
            var total = 0;
            var spans = this.elements.progress.children();
            var percent = 0;

            $.each(this.percentages, function (k, v) {
                total += v[0];
                loaded += v[0] * v[1];
            });

            percent = total ? loaded / total : 0;

            spans.eq(0).text(Math.round(percent * 100) + '%');
            spans.eq(1).css('width', Math.round(percent * 100) + '%');
            this.updateStatus();
        },

        /**
         * 获取上传成功的文件的信息
         *
         * @public
         * @return {Object} 文件信息对象
         */
        getUploadedFiles: function () {
            var arr = [];
            // 遍历的时候，object会对number自动排序
            $.each(this.uploadedFiles, function (k, v) {
                arr.push(v);
            });
            return arr;
        },

        /**
         * 更新已上传的文件
         *
         * @public
         * @param {Array} imgArr 已经上传的图片地址数组
         * @return {boolean} 是否上传状态
         */
        updateUploadedFile: function (imgArr) {
            // 清空原有图片
            this.removeAllFiles();

            if (!imgArr) {
                return false;
            }

            var self = this;
            var files = [];

            // 构造file列表，将图片地址放入每个file中
            $.each(imgArr, function (i, item) {
                files[i] = {};
                var randomStr = lib.randomString(16);

                files[i] = {
                    /* eslint-disable */
                    __hash: randomStr,
                    /* eslint-enable */
                    progress: 'uploaded',
                    id: 'WU_FILE_' + randomStr,
                    size: 0,
                    key: item.key,
                    thumb: item.thumb.replace(/&rotate=\d+/, ''),
                    rotation: item.rotate,
                    getStatus: function () {
                        return 'complete';
                    },
                    setStatus: function () {}
                };
            });

            // 设置每个file为上传完毕状态
            $.each(files, function (i, file) {
                self.fileCount++;
                if (self.fileCount === 1) {
                    self.elements.statusBar.show();
                }
                self.addFile(file);
                self.setState('finish');

                // 重置上传数量
                self.uploader.request('get-stats').numOfSuccess++;

                // 更新状态栏
                self.updateTotalProgress();

                // 更新图片上传列表
                var object = {
                    file: file
                };

                self.uploadedFiles[file.__hash + CONSTS.HASH_PRE] = {
                    file: object,
                    info: file.key
                };

                // 样式更新
                self.refreshStyle();
            });
        },

        /**
         * 相关dom事件解绑
         *
         * @private
         */
        unbindDomEvent: function () {
            this.elements.upload.unbind('click');
            this.elements.info.unbind('click');
        },

        /**
         * 销毁控件
         *
         * @public
         */
        dispose: function () {
            this.elements.main.html('');
            this.unbindDomEvent();
        }
    };

    return Uploader;
});
