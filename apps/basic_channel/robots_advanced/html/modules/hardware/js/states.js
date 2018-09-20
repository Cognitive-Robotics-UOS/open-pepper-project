define([

    'angularUiRouter',
    '../js/controllers/index',

], function() {

    'use strict';

    angular.module('app.states.hardware', [
        'ui.router',
        'app.hardware'
    ]).config(['$stateProvider', function($stateProvider) {
        $stateProvider
            .state('root.hardware', {
                url: '/hardware',
                templateUrl: 'modules/hardware/partials/base.html'+appVersion,
                controller: "HardwareController"
            })
        }
    ]);
});