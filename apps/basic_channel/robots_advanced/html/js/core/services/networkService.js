define(['./module'], function (services) {
    'use strict';
    function getNetworkIcon(type, state, security, strength) {
        if (type != "wifi" && type != "ethernet") {
            return "";
        }
        if (type == "ethernet") {
            return "img/ethernet40.png";
        }
        else if (security.search("psk")>=0){
          /*security = "Wpa/Wpa2 personal";*/
            if (strength < 40){
                return "img/wifi_locked_1sur3.png";
            }
            else if (strength < 80){
                return "img/wifi_locked_2sur3.png";
            }
            else{
                return "img/wifi_locked.png";
            }
            if (state == "ready") {
                return "img/wifi_locked.png";
            }
            else {
                return "img/wifi_locked_grey.png";
            }
        }
        else {
            if (strength < 40){
                return "img/wifi_free_1sur3.png";
            }
            else if (strength < 80){
                return "img/wifi_free_2sur3.png";
            }
            else{
                return "img/wifi_free.png";
            }
            if (state == "ready") {
                return "img/wifi_free.png";
            }
            else {
                return "img/wifi_free_grey.png";
            }
        }
    }
    services.factory('sNetworks', function($q, $qi, $timeout, $filter) {
        var NET_SERVICEID   = 0;
        var NET_NAME        = 1;
        var NET_TYPE        = 2;
        var NET_STATE       = 3;
        var NET_FAVORITE    = 4;
        var NET_AUTOCONNECT = 5;
        var NET_SECURITY    = 6;
        var NET_DOMAINS     = 7;
        var NET_NAMESERVER  = 8;
        var NET_IPV4        = 9;
        var NET_IPV6        = 10;
        var NET_PROXY       = 11;
        var NET_STRENGTH    = 12;
        var NET_ERROR       = 13;

        var getList = function(enable_hidden){
            enable_hidden = typeof enable_hidden !== 'undefined' ? enable_hidden : false;
            var deferred = $q.defer();
            var list = new Array();
            var connect = false;
            function refreshNetworkList(connectionManager){
                /* Load availables services and parse them */
                function handleServicesList(networkInfo) {
                    var data_service, state, strength, type, security;
                    $.each(networkInfo, function(key, data) {
                        data_service = new Object();
                        data_service['id'] = data[NET_SERVICEID][1];
                        data_service['type'] = type = data[NET_TYPE][1];
                        data_service['state'] = state = data[NET_STATE][1];
                        data_service['strength'] = strength = data[NET_STRENGTH][1];
                        data_service['security'] = security = String(data[NET_SECURITY][1])
                        data_service['favorite'] = data[NET_FAVORITE][1];
                        if (data_service['security'].search("psk")>=0){
                          data_service['security'] = "WPA2";
                        }
                        else if (data_service['security'].search("wep")>=0){
                          data_service['security'] = "WEP";
                        }
                        else if (data_service['security'].search("none")>=0){
                          data_service['security'] = "None";
                        }
                        else if (data_service['security'].search("ieee8021x")>=0){
                          data_service['security'] = "802.1x";
                        }
                        data_service['highlight'] = "";
                        if (state == "association" || state == "configuration") {
                            data_service['statemsg'] = $filter('translate')("NETWORK_AUTH");
                        }
                        else if (state == "disconnect"){
                            data_service['statemsg'] = $filter('translate')("NETWORK_DISCONNECT");
                        }
                        else if (state == "online") {
                            data_service['highlight'] = "lightgreen";
                            data_service['statemsg'] = $filter('translate')("NETWORK_CONNECTED_ONLINE");
                            connect = true;
                        }
                        else if (state == "ready") {
                            data_service['highlight'] = "lightgray";
                            data_service['statemsg'] = $filter('translate')("NETWORK_CONNECTED");
                            connect = true;
                        }
                        else if (state == "failure") {
                            data_service['statemsg'] = $filter('translate')("NETWORK_FAILURE");
                        }
                        else{
                            if (data_service['favorite']){
                                data_service['statemsg'] = $filter('translate')("NETWORK_KNOWN");
                            }
                            else if (data_service['security']!="None"){
                                data_service['statemsg'] = $filter('translate')("NETWORK_SECURE", {value:data_service['security']});
                            }
                            else{
                                data_service['statemsg'] = "";
                            }
                        }
                        data_service['name'] = data[NET_NAME][1];
                        if (type == "ethernet") {
                            data_service['name'] = $filter('translate')(data_service['name']);
                        }
                        data_service['method'] = data[NET_IPV4][1][0][1]
                        data_service['ipv4'] = "N/A";
                        data_service['netmask'] = "N/A";
                        data_service['gateway'] = "N/A";
                        if (data[9][1][1]){
                          data_service['ipv4'] = data[NET_IPV4][1][1][1];
                        }
                        if (data[9][1][2])
                          data_service['netmask'] = data[NET_IPV4][1][2][1];
                        if (data[9][1][3])
                          data_service['gateway'] = data[NET_IPV4][1][3][1];
                        data_service['domains'] = data[NET_DOMAINS][1].join();
                        data_service['nameserver'] = data[NET_NAMESERVER][1].join();
                        data_service['error'] = data[NET_ERROR][1];
                        if (data_service['error']){
                            data_service['statemsg'] = $filter('translate')("NETWORK_FAILURE");
                        }
                        data_service['iconImg'] = getNetworkIcon(type, state, security, strength);
                        if (data_service['security'] != "802.1x"){
                            if (data_service['name'] == "" && data_service['highlight']){
                                /*We only display networks to which we're connecting*/
                                data_service['name'] = "(hidden)";
                            }
                            if (data_service['name'].length > 0 || data_service['highlight']){
                                list.push(data_service);
                            }
                            else if (enable_hidden==true){
                                data_service['name'] = "(hidden)";
                                list.push(data_service);
                            }
                        }

                    });
                    deferred.resolve({"list":list, "connect":connect});
                }
                connectionManager.services().then(handleServicesList, $qi.onQimError);
            }
            $qi.call(function(ALConnectionManager){
                refreshNetworkList(ALConnectionManager);
            });
            return deferred.promise;
        }
        var disconnectNetwork = function(data){
            $qi.call(function(ALConnectionManager) {
                ALConnectionManager.disconnect(data);
            });
        }
        var forgetNetwork = function(data){
            $qi.call(function(ALConnectionManager) {
                ALConnectionManager.forget(data);
            });
        }
        var scanNetwork = function(){
            var deferred = $q.defer();
            $qi.call(function(ALConnectionManager) {
                ALConnectionManager.scan().then(function(scanDone){
                    deferred.resolve(scanDone);
                }, function(scanFail){
                    deferred.reject(scanFail);
                });
            });
            return deferred.promise;
        }
        var stateNetwork = function(){
            var deferred = $q.defer();
            $qi.call(function(ALConnectionManager) {
                ALConnectionManager.state().then(function(neededNetworkInfo){
                    deferred.resolve(neededNetworkInfo);
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var tryConnect = function(data){
            $qi.call(function(ALConnectionManager){
                ALConnectionManager.connect(data).then(null, $qi.onQimError);
            });
        }
        var connectWithData = function(data){
            $qi.call(function(ALConnectionManager){
                ALConnectionManager.setServiceInput(data).then(function(neededNetworkInfo){
                }, $qi.onQimError);
            });
        }
        var inputRequiredEvent = function(){
            var deferred = $q.defer();
            function handleInputRequired(serviceParams){
                deferred.notify(serviceParams);
            }
            $qi.subscribeEvent('NetworkServiceInputRequired', handleInputRequired);
            return deferred.promise;
        }
        var statusNetworkEvent = function(){
            var deferred = $q.defer();
            function handleStateChanged(status){
                deferred.notify(status);
            }
            $qi.subscribeEvent('NetworkStateChanged', handleStateChanged, true);
            return deferred.promise;
        }
        var connectStatusEvent = function(){
            var deferred = $q.defer();
            function handleRefresh(data){
                deferred.notify(data);
            }
            $qi.subscribeEvent('NetworkConnectStatus', handleRefresh);
            return deferred.promise;
        }
        var refreshEvent = function(){
            var deferred = $q.defer();
            function handleRefresh(data){
                deferred.notify(data);
            }
            $qi.subscribeEvent('NetworkServiceAdded', handleRefresh);
            $qi.subscribeEvent('NetworkServiceRemoved', handleRefresh);
            $qi.subscribeEvent('NetworkServiceStateChanged', handleRefresh);
            return deferred.promise;
        }
        var getCCList = function(){
            var deferred = $q.defer();
            $qi.call(function(ALConnectionManager){
                ALConnectionManager.countries().then(function(listCC){
                    deferred.resolve(listCC);
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var getCC = function(){
            var deferred = $q.defer();
            $qi.call(function(ALConnectionManager){
                ALConnectionManager.country().then(function(cc){
                    deferred.resolve(cc);
                }, function(error){
                    deferred.resolve(null);
                });
            });
            return deferred.promise;
        }
        var setCC = function(cc){
            var deferred = $q.defer();
            $qi.call(function(ALConnectionManager){
                ALConnectionManager.setCountry(cc).then(function(result){
                    deferred.resolve(result);
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var getInterfaces = function(){
            var deferred = $q.defer();
            var result = [];
            $qi.call(function(ALConnectionManager){
                ALConnectionManager.interfaces().then(function(list){
                    angular.forEach(list, function(elem){
                        if (elem[0].search("eth")){
                            result.push({
                                'type': 'ethernet',
                                'mac': elem[1],
                                'IP': "n/a",
                                'TethAc': false,
                                'TethEn': false
                                });
                        }
                        else if (elem[0].search("wlan")){
                            result.push({
                                'type': 'wifi',
                                'mac': elem[1],
                                'IP': "n/a",
                                'TethAc': true,
                                'TethEn': false
                                });
                        }
                        else{
                            result.push({
                                'type': 'bluetooth',
                                'mac': elem[1],
                                'IP': "n/a",
                                'TethAc': true,
                                'TethEn': false
                                });
                        }
                    });
                    deferred.resolve(result);
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var getTetheringEnable = function(technology){
            var deferred = $q.defer();
            $qi.call(function(ALConnectionManager){
                ALConnectionManager.getTetheringEnable(technology).then(function(result){
                    deferred.resolve(result);
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var getTetheringInfo = function(technology){
            var deferred = $q.defer();
            $qi.call(function(ALConnectionManager){
                $q.all([ALConnectionManager.tetheringName(technology),
                        ALConnectionManager.tetheringPassphrase(technology)]).then(function(data){
                    var result = {
                        "technology": technology,
                        "name": data[0],
                        "passphrase": data[1]
                    }
                    deferred.resolve(result);
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var enableTethering = function(technology, name, passphrase){
            var deferred = $q.defer();
            $qi.call(function(ALConnectionManager){
                ALConnectionManager.enableTethering(technology, name, passphrase).then(function(result){
                    deferred.resolve(result);
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var disableTethering = function(technology){
            var deferred = $q.defer();
            $qi.call(function(ALConnectionManager){
                ALConnectionManager.disableTethering(technology).then(function(result){
                    deferred.resolve(result);
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var setPermitDeactivation = function(value){
            $qi.call(function(ALPreferences, ALMotion){
                ALPreferences.readPrefFile("ALMotion", false).then(function(motionPref){
                    var keyExist = false;
                    /*checked is key exist*/
                    for (var i in motionPref){
                        if(motionPref[i][0] == "ENABLE_DEACTIVATION_OF_FALL_MANAGER"){
                            /*key exist so modify the value*/
                            motionPref[i][2] = value;
                            keyExist = true;
                        }
                    }
                    /* key not exist so create it */
                    if(!keyExist){
                        motionPref.push(["ENABLE_DEACTIVATION_OF_FALL_MANAGER",
                                           "If true the deactivation of Fall Manager is allowed",
                                           value, "bool"]);
                    }
                    ALPreferences.writePrefFile("ALMotion", motionPref, true);
                    ALMotion.setMotionConfig([["ENABLE_DEACTIVATION_OF_FALL_MANAGER", value]])
                });
            });
        }
        var getPermitDeactivation = function(){
            var deferred = $q.defer();
            $qi.call(function(ALPreferences){
                var result = false;
                ALPreferences.readPrefFile("ALMotion", false).then(function(motionPref){
                    var keyExist = false;
                    /*checked is key exist*/
                    for (var i in motionPref){
                        if(motionPref[i][0] == "ENABLE_DEACTIVATION_OF_FALL_MANAGER"){
                            /*key exist so modify the value*/
                            result = motionPref[i][2];
                        }
                    }
                    deferred.resolve(result);
                });
            });
            return deferred.promise;
        }
        return {
            getList: getList,
            disconnectNetwork: disconnectNetwork,
            forgetNetwork: forgetNetwork,
            scanNetwork: scanNetwork,
            stateNetwork: stateNetwork,
            tryConnect: tryConnect,
            connectWithData: connectWithData,
            statusNetworkEvent: statusNetworkEvent,
            inputRequiredEvent: inputRequiredEvent,
            connectStatusEvent: connectStatusEvent,
            refreshEvent: refreshEvent,
            getCCList: getCCList,
            getCC: getCC,
            setCC: setCC,
            getInterfaces: getInterfaces,
            getTetheringInfo: getTetheringInfo,
            getTetheringEnable: getTetheringEnable,
            enableTethering: enableTethering,
            disableTethering: disableTethering,
            setPermitDeactivation: setPermitDeactivation,
            getPermitDeactivation: getPermitDeactivation
        };
    });
});