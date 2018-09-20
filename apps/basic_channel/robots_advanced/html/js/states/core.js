define([

    'angularUiRouter',
    'core/controllers/index',

], function() {

    'use strict';

    angular.module('app.states.core', [
        'ui.router',
        'app.controllers',
    ]).config(function($stateProvider) {
        // Waiting prefs
        $stateProvider
            .state('root', {
                abstract: true,
                controller: "RootController",
                templateUrl:'partials/app/base.html'+appVersion
            })
            .state('root.home', {
                url: '/',
                templateUrl:'partials/app/home.html'+appVersion,
                controller: "HomeController"
            })
    });
});