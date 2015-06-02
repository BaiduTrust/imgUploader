/**
 * @file main.js 测试用例
 * @author chengong03(chengong03@baidu.com)
 * @date 2015-05-05
 */

define(function (require) {

    var Uploader = require('main');

    var TPL = ''
        + '<div id="uploader">'
        +   '<div class="img-uploader">'
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
        +   '<div class="img-upload-tip">最多可上传3张图片，图片类型应为jpg、png、gif、bmp，单张大小不超过2M</div>'
        + '</div>';

    var uploader;

    beforeEach(function () {
        // 阻止alert
        window.alert = function (){};
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
        });

        it('基本方法', function() {
            var uploader = new Uploader({
                main: '#uploader',
                server: '../example/fileuploadajax.php',
                fileNumLimit: 3
            });

            expect(uploader.updateUploadedFile()).toBeFalsy();

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

                uploader.showUploadErrorTip('Q_EXCEED_NUM_LIMIT');
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

            $(uploader.elements.main.find('.cancel')).trigger('click');

            expect(uploader.getUploadedFiles().length).toBe(0);
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

            $(uploader.elements.main.find('.rotate-right')).trigger('click');

            expect(uploader.getUploadedFiles()[0].file.file.rotation).toBe(90);
        });
    });
});
