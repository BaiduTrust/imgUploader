// Auto load specs
// Generated on Fri Dec 27 2013 15:11:09 GMT+0800 (CST)

(function() {
    console.log(111111);

var tests = [];
for (var file in window.__karma__.files) {
    if (/Spec\.js$/.test(file)) {
        tests.push(file);

    }
}


require.config({
    // Karma serves files from '/base'
    baseUrl: '/base/',

    paths: {
//        webuploader: './dep/webuploader'
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});
})();
