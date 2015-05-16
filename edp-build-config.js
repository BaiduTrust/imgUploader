exports.input = __dirname;

var path = require( 'path' );
exports.output = path.resolve( __dirname, 'output' );

// var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';

exports.getProcessors = function () {
    var lessProcessor = new LessCompiler();
    var cssCompressor = new CssCompressor({files: ['*.css', '*.less']});
    var moduleProcessor = new ModuleCompiler();
    var jsProcessor = new JsCompressor();
    var pathMapperProcessor = new PathMapper();
    var addCopyright = new AddCopyright();
    var html2jsPorcessor = new Html2JsCompiler({
        extnames: 'jstpl',
        combine: true
    });
    var html2jsClearPorcessor = new Html2JsCompiler({
        extnames: 'jstpl',
        clean: true
    });

    return {
        'default': [
            lessProcessor, cssCompressor, html2jsPorcessor, moduleProcessor,
            html2jsClearPorcessor, jsProcessor, pathMapperProcessor, addCopyright
        ],
        'release': [
            lessProcessor, cssCompressor, html2jsPorcessor, moduleProcessor,
            html2jsClearPorcessor, jsProcessor, pathMapperProcessor, addCopyright
        ]
    };
};

exports.exclude = [
    '/tool',
    '/doc',
    '/test',
    '/templates_c',
    '/module.conf',
    '/node_modules',
    '/nohup.out',
    '*~',
    '._*',
    '/dep/packages.manifest',
    '/dep/*/test',
    '/dep/*/doc',
    '/dep/*/demo',
    '/dep/*/tool',
    '/dep/*/*.md',
    '/dep/*/package.json',
    '/dep/etpl',
    '/dep/Respond',
    '/edp-*',
    '/.edpproj',
    '.svn',
    '.git',
    '.gitignore',
    '.idea',
    '.project',
    'Desktop.ini',
    'Thumbs.db',
    '.DS_Store',
    '*.tmp',
    '*.bak',
    '*.swp',
    '*.php',
    '/build.sh',
    'favicon.ico',
    '/upload',
    '/upload_tmp'
];

exports.injectProcessor = function ( processors ) {
    for ( var key in processors ) {
        global[ key ] = processors[ key ];
    }
};

