define(['./module'], function (services) {
    'use strict';
    services.factory('sStore', function($q, $qi) {
        var PKGSTATUS = {NONE: 0, UPTODATE: 1, DOWNLOADING: 2, UPDATEAVAILABLE: 3};
        var updateStatus = function(){
            var deferred = $q.defer();
            var result = {
                "needed_updates": 0,
                "ok_packages": 0,
                "total_packages": 0,
                "downloading": false,
                "system": false,
                "system_percent": 0
            }
            var system_index = null;
            $qi.call(function(ALStore, ALMemory) {
                ALStore.status().then(function(packages) {
                    angular.forEach(packages, function(pkg, index) {
                        if (pkg.uuid == "system-image"){
                            //console.log(pkg);
                            result.system = pkg.status;
                            system_index = index;
                            result.system_percent = pkg.percent
                        }
                        else if (pkg.status == PKGSTATUS.DOWNLOADING) {
                            result.downloading = true;
                            result.needed_updates += 1;
                            result.total_packages += 1;
                        }
                        else if (pkg.status == PKGSTATUS.UPDATEAVAILABLE) {
                            result.needed_updates += 1;
                            result.total_packages += 1;
                        }
                        else {
                            result.ok_packages += 1;
                            result.total_packages += 1;
                        }
                    });
                    if (system_index >= 0){
                        packages.splice(system_index, 1);
                    }
                    //console.log(result);
                    if (result.system != false){
                        ALMemory.getData("ALStore/Updated").then(function(data){
                            if (result.system==3 && data!=null){
                                result.system = PKGSTATUS.UPTODATE;
                            }
                            deferred.resolve([packages, result]);
                        });
                    }
                    else{
                        deferred.resolve([packages, result]);
                    }
                }, $qi.onQimError);
            });
            return deferred.promise;
        };
        var update = function(){
            $qi.call(function(ALStore) {
                ALStore.update();
            });
        };
        var updatedEvent = function(){
            var deferred = $q.defer();
            function handleState(data){
                //console.log(data);
                deferred.notify(data);
            }
            $qi.subscribeEvent('ALStore/Updated', handleState, true);
            return deferred.promise;
        };

        return {
            updateStatus: updateStatus,
            update: update,
            updatedEvent: updatedEvent,
        };
    });
});