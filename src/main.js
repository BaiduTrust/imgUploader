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
        ALLOWED_TYPE: 'image/png;image/jpeg;image/jpg;image/gif;image/bmp;',
        HASH_PRE: '_kb_hash'
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
        NOT_SUPPORT_BROWSER: 'WebUploader does not support the browser you are using.'
    };

    // 如果不支持base64
    // 改用flash预览
    var filePrevPool = {};

    if (!lib.isSupportBase64) {
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
                alert('您的浏览器版本过低！');
                throw new Error(ERROR_MSG.NOT_SUPPORT_BROWSER);
            }

            this.opts = opts || {};

            var main = $(opts.main);

            this.opts.btnAddId = 'add-btn-' + lib.randomString(6);

            // web uploader实例
            this.uploader = null;

            var queue = $('<ul class="filelist"><div id="' + this.opts.btnAddId + '"></div></ul>');
            queue.appendTo(main.find('.queue-list'));

            // 组件元素
            this.elements = {
                // 上传组件最外层dom
                main: main,
                // 上传组件容器
                wrap: main.find('.kb-uploader'),
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
                progress: main.find('.progress')
            };

            // 添加的文件数量
            this.fileCount = 0;

            // 添加的文件总大小
            this.fileSize = 0;

            // 优化retina
            this.ratio = window.devicePixelRatio || 1;

            // 缩略图大小
            this.thumbnailWidth = 100 * this.ratio;
            this.thumbnailHeight = 100 * this.ratio;

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

            var defaultOpts = {
                pick: {
                    id: main.find('.file-picker'),
                    label: '点击选择图片'
                },
                formData: {
                    uid: 'koubei'
                },
                auto: true,
                dnd: main.find('.kb-uploader'),
                paste: main.find('.kb-uploader'),
                // TODO 编译时需要替换swf中的地址
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
                // TODO 由于webuploader先验证是否超过总大小，因此这儿设置一个大的数值
                fileSizeLimit: 60 * 1024 * 1024, // 60 M
                fileSingleSizeLimit: 2 * 1024 * 1024 // 2 M
            };

            this.opts = $.extend(true, {}, defaultOpts, this.opts);

            if (!this.uploader) {
                this.uploader = WebUploader.create(this.opts);

                this.uploader.addButton({
                    id: '#' + this.opts.btnAddId,
                    label: '继续添加'
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
         * 销毁控件
         *
         * @public
         */
        dispose: function () {
            this.elements.main.html('');
            this.unbindDomEvent();
        },

        /**
         * uploader事件处理
         *
         * @private
         */
        initUploaderEvent: function () {
            var self = this;
            var uploader = this.uploader;

            // 拖放过滤
            // 只允许图片格式的文件拖拽进来
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
                // TODO webuplaoder swf有bug，percentage会返回Infinity，简单屏蔽下
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
                    alert('最多只能上传' + self.opts.fileNumLimit + '张哦~');
                    return false;
                }
            };

            // 文件入队列
            uploader.onFileQueued = function (file) {
                self.fileCount++;
                self.fileSize += file.size;

                if (self.fileCount === 1) {
                    self.elements.statusBar.show();
                }

                self.addFile(file);
                self.setState('ready');
                self.updateTotalProgress();

                if ($(self.elements.queue).find('li').length) {
                    $(self.elements.main).find('.placeholder').height(0);
                }
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

                if (!$(self.elements.queue).find('li').length) {
                    $(self.elements.main).find('.placeholder').height('auto');
                }
            };

            // 上传成功
            uploader.onUploadAccept = function (object, ret) {
                if (ret && ret.status === 0) {
                    var data = ret.data || {};
                    self.uploadedFiles[object.file.__hash + CONSTS.HASH_PRE] = { // jshint ignore:line
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
         * 显示上传错误
         *
         * @private
         * @param {string} code 错误代码
         */
        showUploadErrorTip: function (code) {
            var tipMap = {
                Q_EXCEED_NUM_LIMIT: '一次最多可选' + this.opts.fileNumLimit + '张哦~',
                Q_EXCEED_SIZE_LIMIT: '文件总大小过大啦~',
                F_EXCEED_SIZE: '文件大小超出限制啦~',
                F_DUPLICATE: '文件不要重复上传哦~'
            };
            alert(tipMap[code]);
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

            this.elements.upload.on('click', function () {
                var state = self.state;
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                if (state === 'ready') {
                    uploader.upload();
                }
                else if (state === 'paused') {
                    uploader.upload();
                }
                else if (state === 'uploading') {
                    uploader.stop(true);
                }
            });

            info.on('click', '.retry', function () {
                uploader.retry();
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
                +   '<p class="imgWrap"></p>'
                +   '<p class="progress" style="display:none;">'
                +       '<span class="text">0%</span>'
                +       '<span class="percent"></span>'
                +   '</p>'
                + '</li>';
            var li = $(liHtml);

            var btnsHtml = ''
                + '<div class="file-panel">'
                +   '<span class="cancel">X</span>'
                +   '<span class="rotate-right">右边</span>'
                + '</div>';

            var btns = $(btnsHtml).appendTo(li);


            var progress = li.find('p.progress');
            var wrap = li.find('p.imgWrap');
            var info = $('<p class="error"></p>');

            function showError(code) {
                var text = '';
                switch (code) {
                    case 'exceed_size':
                        text = '文件大小超出';
                        break;

                    case 'interrupt':
                        text = '上传暂停';
                        break;

                    default:
                        text = '上传失败';
                        break;
                }

                info.text(text).appendTo(li);
            }

            // 是否是已经上传的图片
            var isImgUploaded = (file.progress === 'uploaded') ? true : false;

            if (file.getStatus() === 'instateid') {
                showError(file.statusText);
            }
            else {
                if (isImgUploaded) {
                    wrap.text('预览中');
                    var img = $('<img src="' + file.thumb + '">');
                    img.width(100);
                    img.height(100);
                    wrap.empty().append(img);
                    percentages[file.id] = [file.size, 1];
                    lib.rotateFile(wrap, file.rotation);
                }
                else {
                    wrap.text('预览中');
                    var opts = uploader.options || {};
                    uploader.makeThumb(
                        file,
                        function (error, src) {
                            if (error) {
                                wrap.text('不能预览');
                                return;
                            }

                            if (!lib.isSupportBase64) {

                                // 创建flash(多个实例的话，只通过hash无法保证id唯一)
                                var hash = +new Date();
                                var id = 'kb-img-prev' + hash;

                                var html = lib.createSwfHTML({ // jshint ignore:line
                                    id: id,
                                    url: opts.imgPrevSwf,
                                    width: 100,
                                    height: 100,
                                    wmode: 'transparent',
                                    allowscriptaccess: 'always'
                                });

                                wrap.empty().append($(html));

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
                        showError(file.statusText);
                        percentages[file.id][1] = 1;
                    }
                    else if (cur === 'interrupt') {
                        showError('interrupt');
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
                            delete self.uploadedFiles[file.__hash + CONSTS.HASH_PRE]; // jshint ignore:line
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
            var stats = null;
            var uploader = this.uploader;
            var uploadEle = this.elements.upload;
            var queueEle = this.elements.queue;
            var statusBarEle = this.elements.statusBar;
            var progressEle = this.elements.progress;

            if (state === this.state) {
                return;
            }

            uploadEle.removeClass('state-' + state);
            uploadEle.addClass('state-' + state);
            this.state = state;

            var lis = this.elements.main.find('.filelist li');

            switch (state) {
                case 'pedding':
                    lis.removeClass('no-del');
                    queueEle.hide();
                    statusBarEle.addClass('element-invisible');
                    uploader.refresh();
                    break;

                case 'ready':
                    lis.removeClass('no-del');
                    uploadEle.text('开始上传').removeClass('disabled');
                    queueEle.show();
                    statusBarEle.removeClass('element-invisible');
                    uploader.refresh();
                    break;

                case 'uploading':
                    lis.addClass('no-del');
                    progressEle.show();
                    uploadEle.addClass('disabled');
                    break;

                case 'paused':
                    lis.addClass('no-del');
                    progressEle.show();
                    uploadEle.text('继续上传');
                    break;

                case 'confirm':
                    lis.removeClass('no-del');
                    progressEle.hide();
                    uploadEle.text('开始上传').addClass('disabled');

                    stats = uploader.getStats();
                    if (stats.successNum && !stats.uploadFailNum) {
                        this.setState('finish');
                        return;
                    }
                    break;

                case 'finish':
                    lis.removeClass('no-del');
                    stats = uploader.getStats();
                    if (!stats.successNum) {
                        state = 'done';
                    }
                    break;
            }

            this.updateStatus();
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
                text = '选中' + fileCount + '张图片，共' +
                        WebUploader.formatSize(fileSize) + '。';
            }
            else if (state === 'confirm') {
                stats = uploader.getStats();
                if (stats.uploadFailNum) {
                    text = ''
                        + '成功上传：'
                        + stats.successNum
                        + '张，失败：'
                        + stats.uploadFailNum
                        + '张，<a class="retry" href="javascript:;">重新上传</a>';
                }
            }
            else {
                stats = uploader.getStats();
                text = '共' + fileCount + '张，已上传' + stats.successNum + '张';

                if (stats.uploadFailNum) {
                    text += '，失败' + stats.uploadFailNum + '张';
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
            // !!!遍历的时候，object会对number自动排序
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

                self.uploadedFiles[file.__hash + CONSTS.HASH_PRE] = { // jshint ignore:line
                    file: object,
                    info: file.key
                };

                // 样式更新
                if (self.elements.queue.find('li').size()) {
                    self.elements.queue.show();
                    self.elements.placeHolder.height(0);
                }
            });
        }
    };

    return Uploader;
});
