define(['./module'], function (services) {
    'use strict';
    services.factory('$qi', function($q, $rootScope, $window, $timeout) {
        var qim = new QiSession();
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        $rootScope.event = new Object();
        $rootScope.on_tablet = (navigator.platform == "Linux armv7l");
        qim.socket().on('connect', function() {
            console.log('Qimessaging: connected!');
            $rootScope.$apply(function () {
                $rootScope.connected = true;
                $rootScope.reboot = false;
            });
        });

        qim.socket().on('disconnect', function() {
            console.log('Qimessaging: disconnected!');
            $rootScope.$apply(function () {
                $rootScope.connected = false;
            });
        });
        function getParamNames(func) {
            var fnStr = func.toString().replace(STRIP_COMMENTS, '')
            var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g)
            if(result === null)
                result = []
            return result
        };

        var onQimError = function (data) {
            console.log("Service error: ", data);
        };
        var modulePromises = {};
        function getModulePromise(module) {
              if (!(module in modulePromises)) {
                  modulePromises[module] = qim.service(module);
              }
              return modulePromises[module];
        };
        var call = function (callback) {
            var wantedModules = getParamNames(callback);
            var pendingModules = wantedModules.length;
            var modules = new Array(wantedModules.length);
            var deferred = $q.defer();
            var i;
            for (i = 0; i < wantedModules.length; i++) {
                (function (i){
                    getModulePromise(wantedModules[i]).then(function(module) {
                        modules[i] = module;
                        pendingModules -= 1;
                        if (pendingModules == 0) {
                            deferred.resolve(callback.apply(undefined, modules));
                        }
                    }, function() {
                        var reason = "Failed getting a NaoQi Module: " + wantedModules[i]
                        console.log(reason);
                        deferred.reject(reason);
                    });
                })(i);
            }
            return deferred.promise;
        };
        var subscribeEvent = function (event, handle, global){
            global = typeof global !== 'undefined' ? global : false;
            call(function(ALMemory) {
                ALMemory.subscriber(event).then(function (subscriber){
                    subscriber.signal.connect(handle).then(function(status) {
                        if (!global){
                            $rootScope.event[event] = {subscriber:subscriber.signal, status:status};
                        }
                        //console.log("Connection status: " + status);
                    }, onQimError);
                }, onQimError);
            });
        };
        return {
            onQimError: onQimError,
            call: call,
            subscribeEvent: subscribeEvent,
            unsubscribeEvent: function (event){
                $rootScope.event[event].subscriber.disconnect($rootScope.event[event].status).then(function() {
                    //console.log("Disconnection status: " + $rootScope.event[event].status);
                    delete $rootScope.event[event];
                }, onQimError);
            },
            unsubscribeAllEvents: function (){
                var deferred = $q.defer();
                if (Object.keys($rootScope.event).length==0){
                    deferred.resolve();
                }
                angular.forEach($rootScope.event, function(value, key){
                    value.subscriber.disconnect(value.status).then(function() {
                        //console.log("Disconnection status: " + value.status);
                        delete $rootScope.event[key];
                        if (Object.keys($rootScope.event).length==0){
                            deferred.resolve();
                        }
                    }, onQimError);
                });
                return deferred.promise;
            },
            _qim: qim, // deprecated, only included for backward compatibility;
        };
    });
});