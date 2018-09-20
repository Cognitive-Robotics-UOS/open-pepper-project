define([

    'angularUiRouter',
    '../js/controllers/index',

], function() {

    'use strict';

    angular.module('app.states.settings', [
        'ui.router',
        'app.settings'
    ]).config(['$stateProvider', function($stateProvider) {
        $stateProvider
            .state('root.settings', {
                url: '/settings',
                templateUrl:'modules/settings/partials/base.html'+appVersion,
                controller: "SettingsController"
            })
        }
    ]);
});