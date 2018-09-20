define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('MemoryController', [
                                                  '$rootScope',
                                                  '$scope',
                                                  '$q',
                                                  '$qi',
                                                  '$translate',
                                                  '$timeout',
                                                  '$filter',
                                                  'ngTableParams',
                                                  function(
                                                           $rootScope,
                                                           $scope,
                                                           $q,
                                                           $qi,
                                                           $translate,
                                                           $timeout,
                                                           $filter,
                                                           ngTableParams
                                                           ) {
        $scope.getMemoryList = function(search){
            $scope.dataTable = [];
            $scope.loadTable = 1;
            if (search!= null && search.length > 0){
                $qi.call(function(ALMemory){
                    var deferred = $q.defer();
                    ALMemory.getDataListName().then(function(completeList){
                        var data = [];
                        data = $filter('getElementByRegexp')(completeList, search);
                        ALMemory.getListData(data).then(function(result){
                            deferred.resolve({"keys":data, "values":result});
                        });
                    });
                    deferred.promise.then(function(result){
                        //console.log(result);
                        angular.forEach(result.keys, function(memoryKey, memoryIndex){
                            $scope.dataTable.push({'title': memoryKey, 'value':result.values[memoryIndex]});
                        });
                        $scope.loadTable = 0;
                        $scope.tableParams.page(1);
                        $scope.tableParams.reload();
                    });
                });
            }
            else{
                $scope.loadTable = 0;
                $scope.tableParams.page(1);
                $scope.tableParams.reload();
            }
        }
        $qi.call(function(ALNotificationManager){
            ALNotificationManager.notifications().then(function(result){
                console.log(result);
            })
        });
        $scope.dataTable = [];
        $scope.loadTable = 0;
        $scope.tableParams = new ngTableParams({
            page: 1,            // show first page
            count: 10           // count per page
        }, {
            total: $scope.dataTable.length, // length of data
            getData: function($defer, params) {
                params.total($scope.dataTable.length);
                $defer.resolve($scope.dataTable.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
        });
    }]);
});