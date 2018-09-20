define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('TetheringController', [
                                                  '$rootScope',
                                                  '$scope',
                                                  '$q',
                                                  '$qi',
                                                  '$translate',
                                                  '$timeout',
                                                  '$filter',
                                                  '$modal',
                                                  'sNetworks',
                                                  function(
                                                           $rootScope,
                                                           $scope,
                                                           $q,
                                                           $qi,
                                                           $translate,
                                                           $timeout,
                                                           $filter,
                                                           $modal,
                                                           sNetworks
                                                           ) {
        $scope.init = function(){
            $scope.interface_list = [];
            sNetworks.getInterfaces().then(function(result){
                $scope.interface_list = result;
                sNetworks.getList().then(function(result){
                    var ethernet = $filter('getElementBy')(result.list, 'type', 'ethernet');
                    var wifiList = $filter('getListElementBy')(result.list, 'type', 'wifi');
                    var ethernetSubElem = $filter('getElementBy')($scope.interface_list, 'type', 'ethernet');
                    var wifiSubElem = $filter('getElementBy')($scope.interface_list, 'type', 'wifi');
                    if (ethernet){
                        ethernetSubElem.IP = ethernet.ipv4;
                    }
                    else{
                        ethernetSubElem.IP = "n/a";
                    }
                    var wifi = $filter('getElementBy')(wifiList, 'state', 'online');
                    if (wifi){
                        wifiSubElem.IP = wifi.ipv4;
                    }
                    else{
                        wifi = $filter('getElementBy')(wifiList, 'state', 'ready');
                        if (wifi){
                            wifiSubElem.IP = wifi.ipv4;
                        }
                        else{
                            wifiSubElem.IP = "n/a";
                        }
                    }
                    sNetworks.getTetheringEnable("wifi").then(function(tethering){
                        console.log(tethering);
                        wifiSubElem.TethEn = tethering;
                    });
                });
            });
        }
        $scope.init();
        $scope.disable = function (technology) {
            sNetworks.disableTethering(technology).then(function(result){
                $scope.init();
            });
        };
        /* MODAL TETHERING */
        $scope.openAskTethering = function (size, technology) {
            sNetworks.getTetheringInfo(technology).then(function(result){
                var modalInstance = $modal.open({
                    backdrop: 'static',
                    keyboard: false,
                    templateUrl: 'partials/modal/askTethering.html?1',
                    controller: ModalInstanceAskTetheringCtrl,
                    size: size,
                    resolve: {
                        params: function () {
                            return result;
                        }
                    }
                });
                modalInstance.result.then(function (params) {
                    sNetworks.enableTethering(params.technology, params.name, params.passphrase).then(function(result){
                        $scope.init();
                    });
                }, function () {
                    console.log('Modal dismissed at: ' + new Date());
                });
            });
        };
    }]);

    var ModalInstanceAskTetheringCtrl = function ($scope, $modalInstance, params) {
        $scope.params = params;
        $scope.showPassphrase = false;
        $scope.formFlags = {
            showpass: false,
            minpasslength: 8,
            tempPass: ''
        };
        $scope.ok = function () {
            $modalInstance.close($scope.params);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };
});