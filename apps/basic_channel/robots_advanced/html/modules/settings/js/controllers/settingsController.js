define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('SettingsController', [
                                                  '$rootScope',
                                                  '$scope',
                                                  '$q',
                                                  '$qi',
                                                  '$translate',
                                                  '$timeout',
                                                  '$filter',
                                                  '$modal',
                                                  'sNetworks',
                                                  'sTelepathe',
                                                  function(
                                                           $rootScope,
                                                           $scope,
                                                           $q,
                                                           $qi,
                                                           $translate,
                                                           $timeout,
                                                           $filter,
                                                           $modal,
                                                           sNetworks,
                                                           sTelepathe
                                                           ) {
        $scope.init = function(){
            $scope.store={
                login: "",
                password: "",
                error: "",
                isConnected: false,
                isLoading: false
            }
            sTelepathe.getAssociatedUser().then(function(login){
                //console.log(login);
                if (login){
                    $scope.store.login = login;
                    sTelepathe.isConnected().then(function(isconnect){
                        //console.log(isconnect);
                        if (isconnect){
                            $scope.store.password = "xxxxxxxx";
                            $scope.store.isConnected = true;
                        }
                    });
                }
            });
            sNetworks.getPermitDeactivation().then(function(result){
                $scope.permitDeactivation = result;
            });
        }
        $scope.init();
        /* MANAGE CONNEXION STORE */
        $scope.connect = function(){
            if ($scope.store.login && $scope.store.password){
                $scope.store.isLoading = true;
                $scope.store.error = ""
                sTelepathe.setAssociateUser($scope.store.login, $scope.store.password).then(function(){
                    $scope.init();
                }, function(result){
                    console.log(result);
                    $scope.store.error = "Incorrect data..."
                    $scope.store.isLoading = false;
                });
            }
            else{
                $scope.store.error = "Fields are required..."
            }
        }
        $scope.disconnect = function(){
            $scope.store.isLoading = true;
            sTelepathe.dissociateUser().then(function(){
                $scope.init();
            });
        }
        /* MODAL PERMITDEACTIVATION */
        $scope.confirmPermitDeactivation = function () {
            var modalInstance = $modal.open({
                //backdrop: 'static',
                templateUrl: 'partials/modal/permitDeactivation.html?1',
                controller: ModalInstancePermitDeactivationCtrl,
                size: 'md'
            });
            modalInstance.result.then(function () {
                console.log("gogo");
                sNetworks.setPermitDeactivation(true);
            }, function () {
                $scope.permitDeactivation = false;
                console.log('Modal dismissed at: ' + new Date());
            });
        };
        $scope.$watch("permitDeactivation", function(value, oldvalue){
            if (oldvalue!==undefined && value!=oldvalue){
                if (value){
                    $scope.confirmPermitDeactivation();
                }
                else{
                    sNetworks.setPermitDeactivation(false);
                    console.log("nogo");
                }
            }
        });
    }]);
    var ModalInstancePermitDeactivationCtrl = function ($scope, $modalInstance) {
        $scope.ok = function () {
            $modalInstance.close();
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };
});