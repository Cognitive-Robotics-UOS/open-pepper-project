define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('HomeController', ['$rootScope',
                                              '$scope',
                                              '$qi',
                                              '$translate',
                                              '$filter',
                                              'sSystem',
                                              'sLanguages',
                                              'sNetworks',
                                              function($rootScope,
                                                       $scope,
                                                       $qi,
                                                       $translate,
                                                       $filter,
                                                       sSystem,
                                                       sLanguages,
                                                       sNetworks
                                                       ) {
        $scope.infoList = [
            {
                "title":"NAOqi",
                "list":[
                    {"title":"Version", "value":""},
                    {"title":"FullHeadId", "value":""},
                    {"title":"BodyId", "value":""},
                    {"title":"Battery", "value":""},
                    {"title":"Language", "value":""}
                ]
            },
            {
                "title":"Network",
                "list":[
                    {"title":"Ethernet", "value":""},
                    {"title":"Wi-Fi", "value":""}
                ]
            }
        ];
        $scope.buildList = [
            {
                "title":"Build",
                "list":[
                    {"title":"Build Date", "value":""},
                    {"title":"Build ID", "value":""}
                ]
            }
        ];
        $qi.call(function(ALMemory){
            ALMemory.getData("RobotConfig/Head/FullHeadId").then(function(fullHeadId){
                var elem = $filter('getElementBy')($scope.infoList, 'title', 'NAOqi');
                var subElem = $filter('getElementBy')(elem.list, 'title', 'FullHeadId');
                subElem.value = fullHeadId;
            });
            ALMemory.getData("Device/DeviceList/ChestBoard/BodyId").then(function(bodyID){
                var elem = $filter('getElementBy')($scope.infoList, 'title', 'NAOqi');
                var subElem = $filter('getElementBy')(elem.list, 'title', 'BodyId');
                subElem.value = bodyID;
            });
        });
        sSystem.getSystemVersion().then(function(version) {
            var elem = $filter('getElementBy')($scope.infoList, 'title', 'NAOqi');
            var subElem = $filter('getElementBy')(elem.list, 'title', 'Version');
            subElem.value = version;
        });
        sSystem.getSystemInfo().then(function(infos) {
            var elem = $filter('getElementBy')($scope.buildList, 'title', 'Build');
            var subElem = $filter('getElementBy')(elem.list, 'title', 'Build Date');
            subElem.value = infos.buildDate;
            subElem = $filter('getElementBy')(elem.list, 'title', 'Build ID');
            subElem.value = infos.buildID;
        });
        $qi.call(function(ALBattery) {
            ALBattery.getBatteryCharge().then(function(battery) {
            var elem = $filter('getElementBy')($scope.infoList, 'title', 'NAOqi');
            var subElem = $filter('getElementBy')(elem.list, 'title', 'Battery');
            subElem.value = battery+"%";
            });
        });
        sLanguages.getLang().then(function(language) {
            var elem = $filter('getElementBy')($scope.infoList, 'title', 'NAOqi');
            var subElem = $filter('getElementBy')(elem.list, 'title', 'Language');
            subElem.value = language;
        });
        sNetworks.getList().then(function(result){
            var ethernet = $filter('getElementBy')(result.list, 'type', 'ethernet');
            var wifiList = $filter('getListElementBy')(result.list, 'type', 'wifi');
            var networkElem = $filter('getElementBy')($scope.infoList, 'title', 'Network');
            var ethernetSubElem = $filter('getElementBy')(networkElem.list, 'title', 'Ethernet');
            var wifiSubElem = $filter('getElementBy')(networkElem.list, 'title', 'Wi-Fi');
            if (ethernet){
                ethernetSubElem.value = ethernet.ipv4;
            }
            else{
                ethernetSubElem.value = "n/a";
            }
            var wifi = $filter('getElementBy')(wifiList, 'state', 'online');
            if (wifi){
                wifiSubElem.value = wifi.ipv4;
            }
            else{
                wifi = $filter('getElementBy')(wifiList, 'state', 'ready');
                if (wifi){
                    wifiSubElem.value = wifi.ipv4;
                }
                else{
                    wifiSubElem.value = "n/a";
                }
            }
        });
        $scope.textToSay = "I am here";
        $scope.sayIt = function(textToSay){
            $qi.call(function(ALTextToSpeech){
                ALTextToSpeech.say(textToSay);
            });
        }
    }]);
});