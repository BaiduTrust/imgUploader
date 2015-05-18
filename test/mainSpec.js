define(function (require) {

    var Uploader = require('main');

    var TPL = ''
        + '<div id="uploader">'
        +   '<div class="kb-uploader">'
        +       '<p class="uploader-title">'
        +           '<label class="title-name">上传图片</label>'
        +       '</p>'
        +       '<div class="queue-list">'
        +           '<div class="placeholder">'
        +               '<div class="file-picker"></div>'
        +               '<p class="drag-tip">拖放图片到这里</p>'
        +           '</div>'
        +       '</div>'
        +       '<div class="status-bar" style="display:none;">'
        +           '<div class="progress">'
        +               '<span class="text">0%</span>'
        +               '<span class="percentage"></span>'
        +           '</div><div class="info"></div>'
        +           '<div class="btns">'
        +               '<em>（审核后可见）</em>'
        +           '</div>'
        +       '</div>'
        +   '</div>'
        +   '<div class="kb-upload-tip">最多可上传3张图片，图片类型应为jpg、png、gif、bmp，单张大小不超过2M</div>'
        + '</div>';

    var uploader;

    beforeEach(function () {
        $(TPL).appendTo(document.body);
    });

    afterEach(function () {
        uploader && uploader.dispose();
    });

    describe('基本接口', function() {
        it('基本参数', function() {
            expect(function () {
                new Uploader();
            })
            .toThrow();

            expect(function () {
                new Uploader({});
            })
            .toThrow();

            expect(function () {
                new Uploader({
                    main: '#uploader'
                });
            })
            .toThrow();

            expect(function () {
                new Uploader({
                    main: '#uploader',
                    server: '../example/fileuploadajax.php',
                    fileNumLimit: 3,
                    onStart: function () {},
                    onFinished: function () {}
                });
            }).not.toThrow();
        });

        it('基本方法', function() {
            var uploader = new Uploader({
                main: '#uploader',
                server: '../example/fileuploadajax.php',
                fileNumLimit: 3
            });

            expect(uploader.updateUploadedFile()).toBe(false);
            expect(uploader.updateUploadedFile([])).not.toBe(false);

            expect(function () {
                expect(uploader.state).toBe('pedding');
                uploader.updateUploadedFile(
                    [
                        {
                            key: '/comt/1409728740_9f9cba76ced3e8167be9adc0fe317b121111111111.png',
                            thumb: 'http://koubei.baidu.com/photo/gift/3.png',
                            rotate: 0
                        }
                    ]
                );
                expect(uploader.state).toBe('finish');
                console.log(uploader.getUploadedFiles());
                expect(uploader.getUploadedFiles().length).toBe(1);
            })
            .not.toThrow();

        });

        it('删除图片事件', function() {
            var uploader = new Uploader({
                main: '#uploader',
                server: '../example/fileuploadajax.php',
                fileNumLimit: 3
            });

            uploader.updateUploadedFile(
                [
                    {
                        key: '/comt/1409728740_9f9cba76ced3e8167be9adc0fe317b121111111111.png',
                        thumb: 'http://koubei.baidu.com/photo/gift/3.png',
                        rotate: 0
                    }
                ]
            );

            console.log(uploader);

            expect(function () {
                $(uploader.elements.main.find('.cancel')).trigger('click');
            })
            .not.toThrow();
        });

        it('图片旋转事件', function() {
            var uploader = new Uploader({
                main: '#uploader',
                server: '../example/fileuploadajax.php',
                fileNumLimit: 3
            });

            uploader.updateUploadedFile(
                [
                    {
                        key: '/comt/1409728740_9f9cba76ced3e8167be9adc0fe317b121111111111.png',
                        thumb: 'http://koubei.baidu.com/photo/gift/3.png',
                        rotate: 0
                    }
                ]
            );

            expect(function () {
                $(uploader.elements.main.find('.rotate-right')).trigger('click');
            })
            .not.toThrow();
        });
    });
});
