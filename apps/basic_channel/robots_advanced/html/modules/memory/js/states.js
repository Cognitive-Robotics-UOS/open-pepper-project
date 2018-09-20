define([

    'angularUiRouter',
    '../js/controllers/index',

], function() {

    'use strict';

    angular.module('app.states.memory', [
        'ui.router',
        'app.memory'
    ]).config(['$stateProvider', function($stateProvider) {
        $stateProvider
            .state('root.memory', {
                url: '/memory',
                templateUrl:'modules/memory/partials/base.html'+appVersion,
                controller: "MemoryController"
            })
        }
    ]);
});