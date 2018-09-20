define(['./module'], function (services) {
    'use strict';
    services.factory('sSystem', function($q, $qi) {
        var getSystemVersion = function(){
            var deferred = $q.defer();
            $qi.call(function(ALSystem) {
                ALSystem.systemVersion().then(function(result) {
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        };
        var getSystemInfo = function(){
            var deferred = $q.defer();
            $qi.call(function(ALSystem) {
                ALSystem.systemInfo().then(function(result) {
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        };
        var getRobotName = function(){
            var deferred = $q.defer();
            $qi.call(function(ALSystem) {
                ALSystem.robotName().then(function(result) {
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        };
        var setRobotName = function(new_robotname){
            var deferred = $q.defer();
            $qi.call(function(ALSystem) {
                ALSystem.setRobotName(new_robotname).then(function(result) {
                    deferred.resolve(result);
                }, $qi.onQimError);
            });
            return deferred.promise;
        };
        var changePassword = function(old_password, new_password){
            var deferred = $q.defer();
            $qi.call(function(ALSystem) {
                ALSystem.changePassword(old_password, new_password).then(function(result) {
                    deferred.resolve(result);
                }, function(result){
                    deferred.reject(result);
                });
            });
            return deferred.promise;
        };
        var getTimezone = function(){
            var deferred = $q.defer();
            $qi.call(function(ALSystem) {
                ALSystem.timezone().then(function(result) {
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        };
        var setTimezone = function(timezone){
            $qi.call(function(ALSystem) {
                ALSystem.setTimezone(timezone);
            });
        };
        var rebootRobot = function(){
            $qi.call(function(ALSystem) {
                ALSystem.reboot();
            });
        };
        var shutdownRobot = function(){
            $qi.call(function(ALSystem) {
                ALSystem.shutdown();
            });
        };

        return {
            getSystemVersion: getSystemVersion,
            getSystemInfo: getSystemInfo,
            getRobotName: getRobotName,
            setRobotName: setRobotName,
            changePassword: changePassword,
            getTimezone: getTimezone,
            setTimezone: setTimezone,
            rebootRobot: rebootRobot,
            shutdownRobot: shutdownRobot,
        };
    });
});