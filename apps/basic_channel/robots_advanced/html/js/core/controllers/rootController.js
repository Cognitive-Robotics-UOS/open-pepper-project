define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('RootController', ['$rootScope', '$scope', '$qi', '$translate', 'sSystem', function($rootScope, $scope, $qi, $translate, sSystem) {
        //$rootScope.robotname = "";
        sSystem.getRobotName().then(function(robotname){
           $rootScope.robotname = robotname;
        });
    }]);
});