

define([

    'angular',
    'angularTouch',
    'angularSanitize',
    'angularTranslate',
    'angularTranslateLoaderPartial',
    'angularUiRouter',
    'uiBootstrapTpls',
    'angularTable',
    'uiRouterExtras',
    'ocLazyLoad',
    'core/services/index',
    'core/filters/index',
    'core/directives/index',
    'core/services/settings',
    'states/core'
], function (angular) {

    'use strict';

    return angular.module('app',
        [
            'ngTouch',
            'ngSanitize',
            'pascalprecht.translate',
            'ui.router',
            'ui.bootstrap',
            'ngTable',
            'ct.ui.router.extras',
            'oc.lazyLoad',
            'app.services',
            'app.filters',
            'app.directives',
            'app.states.core'
        ]).
        /* ADDING INTERNATIONNALIZATION */
        config(['$translateProvider', '$translatePartialLoaderProvider', function($translateProvider, $translatePartialLoaderProvider) {
            $translatePartialLoaderProvider.addPart('languages');
            $translateProvider.useLoader('$translatePartialLoader', {
              urlTemplate: '{part}/{lang}.json'+appVersion
            });
            $translateProvider.preferredLanguage('English');
            $translateProvider.fallbackLanguage('English');
        }]).
        config([
           '$ocLazyLoadProvider',
           '$futureStateProvider',
           'SettingsServiceProvider',
           function($ocLazyLoadProvider,
                    $futureStateProvider,
                    SettingsServiceProvider) {
                $ocLazyLoadProvider.config ({
                    debug: true,
                    jsLoader: requirejs,
                    loadedModules: ['app'],
                    modules: []
                });

                var ocLazyLoadStateFactory = function ($q, $ocLazyLoad, futureState) {
                    var deferred = $q.defer();
                    $ocLazyLoad.load(futureState.module).then(function(name) {
                        deferred.resolve();
                    }, function() {
                        deferred.reject();
                    });
                    return deferred.promise;
                };

                $futureStateProvider.stateFactory('ocLazyLoad', ocLazyLoadStateFactory);

                $futureStateProvider.futureState({
                    'stateName': 'root.settings',
                    'urlPrefix': '/settings',
                    'type': 'ocLazyLoad',
                    'module': {
                        reconfig: true,
                        name: 'app.states.settings',
                        files: ['../modules/settings/js/states']
                    }
                });

                $futureStateProvider.futureState({
                    'stateName': 'root.hardware',
                    'urlPrefix': '/hardware',
                    'type': 'ocLazyLoad',
                    'module': {
                        reconfig: true,
                        name: 'app.states.hardware',
                        files: ['../modules/hardware/js/states']
                    }
                });

                $futureStateProvider.futureState({
                    'stateName': 'root.memory',
                    'urlPrefix': '/memory',
                    'type': 'ocLazyLoad',
                    'module': {
                        reconfig: true,
                        name: 'app.states.memory',
                        files: ['../modules/memory/js/states']
                    }
                });

                $futureStateProvider.futureState({
                    'stateName': 'root.tethering',
                    'urlPrefix': '/tethering',
                    'type': 'ocLazyLoad',
                    'module': {
                        reconfig: true,
                        name: 'app.states.tethering',
                        files: ['../modules/tethering/js/states']
                    }
                });

                $futureStateProvider.addResolve(function ($injector) {
                    return $injector.invoke(SettingsServiceProvider.waitExtApp).then(function(appExtList){
                        angular.forEach(appExtList, function(value, key){
                            $futureStateProvider.futureState({
                                'stateName': 'root.'+value,
                                'urlPrefix': '',
                                'type': 'ocLazyLoad',
                                'module': {
                                    reconfig: true,
                                    name: 'app.states.'+value,
                                    files: ['/apps/'+value+'/js/states.js']
                                }
                            });
                        });
                    });
                });
            }
        ]).
        run(function($rootScope, $state, $stateParams, $qi, sSettings){
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            $rootScope.appVersion = appVersion;
            /* DETECT NEW APP OR REMOVED APP */
            $qi.call(function(ALBehaviorManager) {
                ALBehaviorManager.behaviorsAdded.connect(function(appAddedList) {
                    //console.log(appAddedList);
                    sSettings.getAppExt().then(function(appExtList){
                        var appCheckExist = [];
                        angular.forEach(appExtList, function(value, key){
                            appCheckExist.push($http.get('/apps/'+value+'/js/states.js'));
                        });
                        $q.all(appCheckExist).then(function(data){
                            angular.forEach(appExtList, function(value, key){
                                var order = 5+key;
                                var index = $filter('getIndexBy')($rootScope.menuTable, "title", value);
                                if (!index && data[key].status == 200){
                                    $futureState.futureState({
                                        'stateName': 'root.'+value,
                                        'urlPrefix': '',
                                        'type': 'ocLazyLoad',
                                        'module': {
                                             reconfig: true,
                                             name: 'app.states.'+value,
                                             files: ['/apps/'+value+'/js/states.js']
                                         }
                                    });
                                    $rootScope.menuTable.push({title: value, path:"root."+value, order:order});
                                }
                            });
                        });
                    });
                });
            });
            $qi.call(function(ALBehaviorManager) {
                ALBehaviorManager.behaviorsRemoved.connect(function(appRemovedList) {
                    //console.log(appRemovedList);
                    angular.forEach(appRemovedList, function(value, key){
                        value = value.split('/')[0];
                        var index = $filter('getIndexBy')($rootScope.menuTable, "title", value);
                        if (index>0){
                            if ($state.current.name == $rootScope.menuTable[index].path){
                                $rootScope.menuTable.splice(index, 1);
                                $state.go("root.home");
                            }
                            else{
                                $rootScope.$apply(function(){
                                    $rootScope.menuTable.splice(index, 1);
                                });
                            }

                        }
                    });
                });
            });
        });
});