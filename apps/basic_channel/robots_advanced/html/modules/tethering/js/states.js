define([

    'angularUiRouter',
    '../js/controllers/index',

], function() {

    'use strict';

    angular.module('app.states.tethering', [
        'ui.router',
        'app.tethering'
    ]).config(['$stateProvider', function($stateProvider) {
        $stateProvider
            .state('root.tethering', {
                url: '/tethering',
                templateUrl:'modules/tethering/partials/base.html'+appVersion,
                controller: "TetheringController"
            })
        }
    ]);
});