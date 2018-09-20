define([
    './module'
], function (coreModule) {

    'use strict';
    coreModule.provider('SettingsService', function () {

        return {
            $get: function() {
                return this;
            },

            waitExtApp: ['sSettings', '$rootScope', '$http', '$filter', '$q', function (sSettings, $rootScope, $http, $filter, $q) {
                var deferred = $q.defer();
                $q.all([sSettings.getAppExt(), sSettings.createPageList()]).then(function(result){
                    var appExtList = result[0];
                    var appCheckExist = [];
                    angular.forEach(appExtList, function(value, key){
                        appCheckExist.push($http.get('/apps/'+value+'/js/states.js'));
                    });
                    $q.all(appCheckExist).then(function(data){
                        var conformAppList = [];
                        angular.forEach(appExtList, function(value, key){
                            var order = 6+key;
                            var index = $filter('getIndexBy')($rootScope.menuTable, "title", value);
                            //console.log(index, data[key].status);
                            if (!index && data[key].status == 200){
                                conformAppList.push(value);
                                $rootScope.menuTable.push({title: value, path:"root."+value, order:order});
                            }
                        });
                        deferred.resolve(conformAppList);
                    });
                });
                return deferred.promise;
            }]
        };
    });
    coreModule.factory('sSettings', function ($rootScope, $q, $qi) {
        var getAppExt = function(){
            var deferred = $q.defer();
            $qi.call(function(ALBehaviorManager) {
                ALBehaviorManager.getBehaviorsByTag("widgetRobotsAdvanced").then(function(listBehaviors) {
                    var appExtList = new Array();
                    angular.forEach(listBehaviors, function(value, key){
                        //console.log(value, key);
                        value = value.split('/')[0];
                        if (appExtList.indexOf(value)<0){
                            appExtList.push(value);
                        }
                    });
                    //console.log(appExtList);
                    deferred.resolve(appExtList);
                }, $qi.onQimError);
            }, $qi.onQimError);
            return deferred.promise;
        }
        var createPageList = function(){
            var deferred = $q.defer();
            $rootScope.menuTable = [
                {title: "Settings", order:2, path:"root.settings"},
                {title: "Hardware", order:3, path:"root.hardware"},
                {title: "Memory", order:4, path:"root.memory"},
                {title: "Tethering", order:5, path:"root.tethering"},
            ];
            deferred.resolve();
            return deferred.promise;
        }
        return {
            getAppExt: getAppExt,
            createPageList: createPageList,
        };
    });
});
