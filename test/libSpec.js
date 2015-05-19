define(function (require) {

    var lib = require('lib');

    describe('lib函数', function() {
        it('toArray', function () {
            expect(lib.toArray(null)).toEqual([]);
            expect(lib.toArray([1, 2, 3])).toEqual([1, 2, 3]);
            expect(lib.toArray('hello')).toEqual(['hello']);
        });

        it('encodeHTML', function () {
            expect(lib.encodeHTML('&<>\'"')).toBe('&amp;&lt;&gt;&#39;&quot;');
        });

        it('randomString', function () {
            expect(lib.randomString(16)).toMatch(/^[A-Za-z0-9]{16}$/);
            expect(lib.randomString().length).toBe(32);
        });

        it('createSwfHTML & getSwfMovie', function () {
            var swfTpl;

            expect(function () {
                swfTpl = lib.createSwfHTML({
                    id: '1234567',
                    imgPrevSwf: '/src/swf/showPicDemo.swf',
                    width: 100,
                    height: 100,
                    salign: 'l',
                    wmode: 'transparent',
                    allowscriptaccess: 'always'
                });
            })
            .not.toThrow();

            var swfElem = $(swfTpl);

            $(document.body).append(swfElem);

            expect(lib.getSwfMovie('1234567')).toBe(swfElem.get(0));

        });

    });
});
