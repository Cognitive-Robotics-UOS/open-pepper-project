'use strict';

var appVersion = "?v=1.1.0";
var libVersion = "v=1.1.0";
require.config({

    deps: ['main'],

    // Cache busting
    // Enable for production only
    urlArgs: libVersion,
    /*timeout update from 7 seconds to 300... No more "LOAD TIMEOUT FOR MODULES"*/
    waitSeconds: 30,

    paths: {
        'qimessaging': '/libs/qimessaging/1.0/qimessaging',
        angular: '../lib/angular/angular',
        angularResource: '../lib/angular-resource/angular-resource',
        angularSanitize: '../lib/angular-sanitize/angular-sanitize.min',
        angularTouch: "../lib/angular-touch/angular-touch.min",
        angularTranslate: "../lib/angular-translate/angular-translate.min",
        angularTranslateLoaderPartial: "../lib/angular-translate/angular-translate-loader-partial/angular-translate-loader-partial.min",
        angularUiRouter: '../lib/angular-ui-router/angular-ui-router',
        angularTable: '../lib/ng-table/ng-table.min',
        async: '../lib/requirejs-plugins/src/async',
        jquery: '../lib/jquery/jquery.min',
        ocLazyLoad: '../lib/ocLazyLoad/ocLazyLoad.min',
        uiRouterExtras: '../lib/ui-router-extras/ct-ui-router-extras',
        uiBootstrapTpls: '../lib/angular-bootstrap/ui-bootstrap-tpls'
    },

    shim: {
        qimessaging: {},
        angular: { deps: ['qimessaging', 'jquery'], exports: 'angular' },
        angularResource: { deps: ['angular'] },
        angularSanitize: { deps: ['angular'] },
        angularTouch: { deps: ['angular'] },
        angularTranslate: { deps: ['angular'] },
        angularTranslateLoaderPartial: { deps: ['angularTranslate'] },
        angularUiRouter: {deps: ['angular']},
        angularTable: {deps: ['angular']},
        jquery: { exports: '$' },
        ocLazyLoad: {deps: ['angular']},
        uiRouterExtras: {deps: ['angularUiRouter']},
        uiRouterExtrasStatevis: {deps: ['uiRouterExtras']},
        uiBootstrapTpls: {deps: ['angular']}
    }

});

require.onError = function (err) {
    if (err.requireType === 'timeout') {
        /*tell user*/
        location.reload();
    } else {
        throw err;
    }
};