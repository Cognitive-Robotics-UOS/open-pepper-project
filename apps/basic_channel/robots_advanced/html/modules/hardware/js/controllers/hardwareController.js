define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('HardwareController', [
                                                  '$rootScope',
                                                  '$scope',
                                                  '$q',
                                                  '$qi',
                                                  '$translate',
                                                  '$timeout',
                                                  '$filter',
                                                  function(
                                                           $rootScope,
                                                           $scope,
                                                           $q,
                                                           $qi,
                                                           $translate,
                                                           $timeout,
                                                           $filter
                                                           ) {

        var getMemoryList = function(scope, memoryList, memoryPattern, arrayKeys, sliceValue){
            $qi.call(function(ALMemory){
                ALMemory.getDataList(memoryList).then(function(jointList){
                    var data = {};
                    var deferred = $q.defer();
                    data["title"] = $filter('getElementByRegexp')(jointList, memoryPattern);
                    if (scope.length==0){
                        angular.forEach(data["title"], function(memoryKey, memoryIndex){
                            if (sliceValue.length>0){
                                scope.push({"title": memoryKey.slice(0, -(sliceValue.length))});
                            }
                            else{
                                scope.push({"title": memoryKey});
                            }
                        });
                    }
                    //console.log(data);
                    angular.forEach(arrayKeys, function(value, key){
                        data[key] = [];
                        angular.forEach(scope, function(memoryKey, memoryIndex){
                            data[key].push(memoryKey["title"]+value);
                        });
                        ALMemory.getListData(data[key]).then(function(result){
                            //console.log(data);
                            deferred.notify({"result":result, "key":key});
                        });
                    });
                    deferred.promise.then(null, null, function(result){
                        //console.log(result);
                        angular.forEach(scope, function(memoryKey, memoryIndex){
                            var joint = $filter('getElementBy')(scope, "title", memoryKey["title"]);
                            joint[result.key] = result.result[memoryIndex];
                        });
                    });
                });
            });
        }
        var device_keys = {
            'ack'        : '/Ack',
            'nack'       : '/Nack',
            'version'    : '/ProgVersion',
            'error'      : '/Error',
            'address'    : '/Address',
            'bootloader' : '/BootLoaderVersion',
            'boardid'    : '/BoardId',
            'available'  : '/Available',
            'bus'        : '/Bus',
            'type'       : '/Type'
        }
        $scope.deviceList = [];
        $scope.refreshDevices = function(){
            getMemoryList($scope.deviceList, "Device/DeviceList/", "Device/DeviceList/(?:(?!Plugin|Eeprom).)*/Ack", device_keys, "/Ack");
        }
        $scope.refreshDevices();
        var joint_keys = {
            'temperature' : '/Temperature/Sensor/Value',
            'sensor'      : '/Position/Sensor/Value',
            'actuator'    : '/Position/Actuator/Value',
            'stiffness'   : '/Hardness/Actuator/Value',
            'current'     : '/ElectricCurrent/Sensor/Value',
        }
        $scope.jointList = [];
        $scope.refreshJoints = function(){
            getMemoryList($scope.jointList, "Device/SubDeviceList/", "Device/SubDeviceList/.*/Hardness/Actuator/Value", joint_keys, "/Hardness/Actuator/Value");
        }
        $scope.refreshJoints();
        var config_keys = {
            'value' : '',
        }
        $scope.configList = [];
        $scope.refreshConfig = function(){
            getMemoryList($scope.configList, "RobotConfig/", "RobotConfig/.*", config_keys, "");
        }
        $scope.refreshConfig();

        var headTemp_keys = {
            'value' : '',
        }
        $scope.headTempList = [];
        $scope.refreshHeadTemp = function(){
            getMemoryList($scope.headTempList, "Device/SubDeviceList/Head/Temperature/Sensor/Value", "Device/SubDeviceList/Head/Temperature/Sensor/Value", headTemp_keys, "");
        }
        $scope.refreshHeadTemp();
    }]);
});