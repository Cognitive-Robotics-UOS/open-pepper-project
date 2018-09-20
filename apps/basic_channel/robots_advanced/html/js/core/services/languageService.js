define(['./module'], function (services) {
    'use strict';
    services.factory('sLanguages', function($q, $qi) {
        var getList = function(){
            var deferred = $q.defer();
            var list = new Object();
            $qi.call(function(ALTextToSpeech){
                ALTextToSpeech.getAvailableLanguages().then(function (languages){
                    angular.forEach(languages, function (value, key) {
                        var language_class = "language-flag-"+value;
                        if (language_class){
                            //console.log({lang:value, css:language_class});
                            list[value] = {lang:value, css:language_class, select:"disabled"};
                        }
                    });
                    ALTextToSpeech.getLanguage().then(function(language){
                        list[language]['select'] = "selected";
                        deferred.resolve(list);
                    }, function(error){
                        //console.log(error);
                        deferred.resolve(list);
                    });
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var getLang = function(){
            var deferred = $q.defer();
            var list = new Object();
            $qi.call(function(ALTextToSpeech){
                ALTextToSpeech.getLanguage().then(function(language){
                    deferred.resolve(language);
                }, $qi.onQimError);
            });
            return deferred.promise;
        }
        var setLang = function(data){
            var deferred = $q.defer();
            var cpt =0;
            function setDefaultLanguage(service){
                service._setDefaultLanguage(data).then(null, $qi.onQimError);
            }
            function setLanguage(service){
                service.setLanguage(data).then(function(reply) {
                    //console.log("setLanguage reply: " + reply);
                    cpt++;
                    if (cpt==3){
                        // first set the actual language, then set the default language.
                        // (don't wait for them, only wait for the three "main" ones)
                        deferred.resolve();
                    }
            }, $qi.onQimError);
            }
            $qi.call(function(ALTextToSpeech, ALSpeechRecognition, ALDialog){
                setLanguage(ALTextToSpeech);
                setLanguage(ALSpeechRecognition);
                setLanguage(ALDialog);
                setDefaultLanguage(ALTextToSpeech);
                setDefaultLanguage(ALSpeechRecognition);
            });
            return deferred.promise;
        }

        return {
            getList: getList,
            getLang: getLang,
            setLang: setLang
        };
    });
});