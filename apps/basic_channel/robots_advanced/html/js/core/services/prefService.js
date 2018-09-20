define(['./module'], function (services) {
    'use strict';
    services.factory('sPref', function($q, $qi) {
        var getPref = function(domain, key){
            var deferred = $q.defer();
            $qi.call(function(ALPreferenceManager) {
              ALPreferenceManager.getValue(domain, key).then(function(result) {
                  //console.log("getPref:", domain, key, result);
                  deferred.resolve(result);
              });
            });
            return deferred.promise;
        };
        var setPref = function(domain, key, value){
            var deferred = $q.defer();
            $qi.call(function(ALPreferenceManager) {
              ALPreferenceManager.setValue(domain, key, value).then(function(result) {
                  //console.log("setPref:", domain, key, value, result);
                  deferred.resolve(result);
              }, $qi.onQimError);
            });
            return deferred.promise;
        };

        return {
            setPref: setPref,
            getPref: getPref,
        };
    });
});