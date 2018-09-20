define(['./module'], function (services) {
    'use strict';
    services.factory('sTelepathe', function($q, $qi) {
        var getAssociatedUser = function(){
            var deferred = $q.defer();
            $qi.call(function(_ALCloud) {
                _ALCloud.associatedUser().then(function(result) {
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        };
        var setAssociateUser = function(user, password){
            var deferred = $q.defer();
            $qi.call(function(_ALCloud) {
                _ALCloud.associateUser(user, password).then(function(result) {
                    deferred.resolve(result);
                }, function(result){
                    deferred.reject(result);
                });
            });
            return deferred.promise;
        };
        var dissociateUser = function(){
            var deferred = $q.defer();
            $qi.call(function(_ALCloud) {
                _ALCloud.dissociateUser().then(function(result) {
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        };
        var connectNetwork = function(){
            var deferred = $q.defer();
            $qi.call(function(ALTelepathe) {
                ALTelepathe.connectNetwork().then(function(result) {
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        };
        var disconnectNetwork = function(){
            var deferred = $q.defer();
            $qi.call(function(ALTelepathe) {
                ALTelepathe.disconnectNetwork().then(function(result) {
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        };
        var isConnected = function(){
            var deferred = $q.defer();
            $qi.call(function(ALTelepathe) {
                ALTelepathe.isConnected().then(function(result) {
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        };

        return {
            getAssociatedUser: getAssociatedUser,
            setAssociateUser: setAssociateUser,
            dissociateUser: dissociateUser,
            connectNetwork: connectNetwork,
            disconnectNetwork: disconnectNetwork,
            isConnected: isConnected,
        };
    });
});
