define(['./module'], function (directives) {
    'use strict';

    var blurFocusDirective = function () {
        return {
            restrict: 'E',
            require: '?ngModel',
            link: function (scope, elm, attr, ctrl) {
                if (!ctrl) {
                    return;
                }

                elm.on('focus', function () {
                    elm.addClass('has-focus');

                    scope.$apply(function () {
                        ctrl.hasFocus = true;
                    });
                });

                elm.on('blur', function () {
                    elm.removeClass('has-focus');
                    elm.addClass('has-visited');

                    scope.$apply(function () {
                        ctrl.$pristine = false;
                        ctrl.hasFocus = false;
                        ctrl.hasVisited = true;
                        scope.$emit("elemBlur", ctrl);
                    });
                });

                elm.closest('form').on('submit', function () {
                    elm.addClass('has-visited');

                    scope.$apply(function () {
                        ctrl.hasFocus = false;
                        ctrl.hasVisited = true;
                    });
                });

            }
        };
    };
    directives.directive('dropdownSelect', [
      '$document', function($document) {
        return {
          restrict: 'A',
          replace: true,
          scope: {
            dropdownSelect: '=',
            dropdownModel: '=',
            dropdownDisplay: '@',
            dropdownParseSelected: '@',
            dropdownSubclassMain: '@',
            dropdownOnchange: '&'
          },
          controller: [
            '$scope', '$element', '$attrs', '$translate', function($scope, $element, $attrs, $translate) {
              var body;
                $translate.refresh();
              $scope.classDown = $attrs.dropdownDisplay != null ? $attrs.dropdownDisplay : 'dropdown';
              $scope.classParseSelected = $attrs.dropdownParseSelected != null ? $attrs.dropdownParseSelected : 'selected';
              $scope.classGeneral = $attrs.dropdownParseSelected != null ? 'wrap-dd' : 'wrap-dd-select';
              $scope.subclassMain = $attrs.dropdownSubclassMain != null ? $attrs.dropdownSubclassMain : '';
              $scope.labelField = $attrs.dropdownItemLabel != null ? $attrs.dropdownItemLabel : 'text';
              $scope.displayField = $attrs.dropdownItemDisplay != null ? $attrs.dropdownItemDisplay : $scope.labelField;
              this.select = function(selected) {
                angular.forEach($scope.dropdownSelect, function(value, key){
                  if (!angular.equals(selected, value)){
                    value.is_select = false;
                  }
                });
                angular.copy(selected, $scope.dropdownModel);
                //console.log($scope.dropdownModel, selected);
                $scope.dropdownOnchange({
                  selected: selected
                });
                $translate.refresh();
              };
              body = $document.find("body");
              body.bind("click", function() {
                $element.removeClass('active');
              });
              $element.bind('click', function(event) {
                event.stopPropagation();
                $(".wrap-dd-select").not($element).removeClass('active'); //unactive other dropdown
                $(".wrap-dd").not($element).removeClass('active'); //unactive other dropdown
                $element.toggleClass('active');
              });
            }
          ],
          template: "<div class='{{classGeneral}} {{subclassMain}}'><span class='{{classParseSelected}}' translate='{{dropdownModel[displayField]}}'></span><perfect-scrollbar ng-class='classDown' wheel-propagation='true' refresh-on-change='dropdownSelect' wheel-speed='50'><div ng-repeat='item in dropdownSelect' dropdown-select-item='item' dropdown-item-label='labelField'></div></perfect-scrollbar></div>"
        };
      }
    ]);
    directives.directive('dropdownSelectItem', [
      function() {
        return {
          require: '^dropdownSelect',
          replace: true,
          scope: {
            dropdownItemLabel: '=',
            dropdownSelectItem: '='
          },
          link: function(scope, element, attrs, dropdownSelectCtrl) {
            scope.selectItem = function() {
              if (scope.dropdownSelectItem.href) {
                return;
              }
              //console.log(scope.dropdownSelectItem);
              scope.dropdownSelectItem.is_select = true;
              dropdownSelectCtrl.select(scope.dropdownSelectItem);
            };
          },
          template: "<li ng-class='{is_select: dropdownSelectItem.is_select}'><a href='' class='dropdown-item' ng-if='!dropdownSelectItem.divider' ng-href='{{dropdownSelectItem.href}}' target='_blanck' ng-click='selectItem()' translate='{{dropdownSelectItem[dropdownItemLabel]}}'></a></li>"
        };
      }
    ]);
    directives.
    directive('perfectScrollbar', function($parse) {
        return {
            restrict: 'E',
            transclude: true,
            template:  '<div><div ng-transclude></div></div>',
            replace: true,
            link: function($scope, $elem, $attr) {
                $elem.perfectScrollbar({
                    wheelSpeed: $parse($attr.wheelSpeed)() || 50,
                    wheelPropagation: $parse($attr.wheelPropagation)() || false,
                    minScrollbarLength: $parse($attr.minScrollbarLength)() || false,
                });
                if ($attr.refreshOnChange) {
                    $scope.$watchCollection($attr.refreshOnChange, function(newNames, oldNames) {
                        // I'm not crazy about setting timeouts but it sounds like thie is unavoidable per
                        // http://stackoverflow.com/questions/11125078/is-there-a-post-render-callback-for-angular-js-directive
                        setTimeout(function() { $elem.perfectScrollbar('update'); }, 10);
                    });
                }
            }
        }
    });
    directives.directive("inputTablet", function($compile) {
        var textTemplate = '<form name="test"><input ng-enter="enter()" ng-escape="escape()" type="text" ng-model="value" name="text" ng-focus="focusOnInput();" />' +
                            '<span style="color:red" ng-show="test.text.$invalid">WRONG!</span></form>';
        var passwordTemplate = '<form name="test"><input ng-enter="enter()" ng-escape="escape()" type="password" ng-model="value" name="text" ng-focus="focusOnInput();" />' +
                            '<span style="color:red" ng-show="test.text.$invalid">WRONG!</span></form>';

        var getTemplate = function(contentType) {
            var template = '';

            switch(contentType) {
                case 'password':
                    template = passwordTemplate;
                    break;
                default:
                    template = textTemplate;
                    break;
            }

            return template;
        }

        var linker = function(scope, element, attrs) {
            element.html(getTemplate(scope.type)).show();
            $compile(element.contents())(scope);
        }

        return {
            restrict: "A",
            replace: true,
            scope: {
                text: "@textTablet",
                type: "@typeTablet",
                value: "=inputTablet",
                enter: "&functionEnter",
                escape: "&functionEscape",
            },
            link: linker,
            controller: function($scope, $rootScope, $qi, $translate, $element, $q) {
                $scope.focusOnInput = function(event) {
                    //console.log($scope.text, $scope.type, $scope.value);
                    if ($rootScope.on_tablet) {
                        $qi.call(function(ALTabletService) {
                            $q.all([$translate($scope.text), $translate('BTN_OK'), $translate('BTN_CANCEL')]).then(function(result){
                                var inputLabel = result[0];
                                var btnOK = result[1];
                                var btnCancel = result[2];
                                ALTabletService.onInputText.connect(function(state, text) {
                                    if (state==1){
                                        $scope.$apply(function(){
                                            $scope.value = text;
                                            //console.log($element);
                                        });
                                    }
                                    $element.blur();
                                    //console.log("unsubscribe to: onInputText", $scope.signalLink);
                                    ALTabletService.onInputText.disconnect($scope.signalLink);
                                }).then(function(link){
                                  //console.log("subscribe to: onInputText", link);
                                  $scope.signalLink = link;
                                  if ($scope.type){
                                    ALTabletService.showInputDialog($scope.type, inputLabel, btnOK, btnCancel);
                                  }
                                  else{
                                    ALTabletService.showInputTextDialog(inputLabel, btnOK, btnCancel);
                                  }
                                }, $qi.onQimError);
                            });
                        });
                    }
                }
            }
        };
    });
    directives.directive("clickToEdit", function($compile, $timeout, $http, $templateCache) {
        var getTemplate = function(contentType) {
            var templateLoader,
            baseUrl = 'partials/directives/',
            templateUrl = '';

            switch(contentType) {
                case 'password':
                    templateUrl = baseUrl + "password-classic.html";
                    break;
                default:
                    templateUrl = baseUrl + "text-classic.html";
                    break;
            }
            templateLoader = $http.get(templateUrl, {cache: $templateCache});

            return templateLoader;

        }

        var linker = function(scope, element, attrs) {

            var loader = getTemplate(scope.fieldType);

            var promise = loader.success(function(html) {
                element.html(html);
            }).then(function (response) {
                $compile(element.contents())(scope);
            });
        }
        return {
            restrict: "E",
            replace: true,
            scope: {
                value: "=fieldValue",
                fieldName: "@fieldName",
                fieldType: "@fieldType",
                saveFunction: '&',
            },
            link: linker,
            controller: function($scope) {
                $scope.saveInProgress=false;
                $scope.cancel = angular.copy($scope.value);
                $scope.view = {
                    editableValue: $scope.value,
                    editorEnabled: false
                };

                $scope.enableEditor = function() {
                    $scope.view.editorEnabled = true;
                    $scope.view.editableValue = $scope.value;
                    $scope.form.$setPristine();
                    $scope.cancel = angular.copy($scope.value);
                };

                $scope.disableEditor = function(cancel) {
                    if (cancel){
                        $scope.value = $scope.cancel;
                    }
                    $scope.view.editorEnabled = false;
                };
                $scope.save = function() {
                    $scope.value = $scope.view.editableValue;
                    $scope.saveInProgress=true;
                    $scope.$on("changeOk", function(event, result){
                        //console.log(result);
                        if (result == true){
                            $scope.disableEditor(false);
                            $scope.saveSucceeded=true;
                            $timeout(function(){
                                $scope.saveSucceeded=false;
                            }, 2000)
                        }
                        else{
                            if (result == false && $scope.form.old_robotpassword){
                                $scope.form.old_robotpassword.$setValidity("robotPasswordVerify", false);
                            }
                            if (result == "confirm" && $scope.form.old_robotpassword){
                                $scope.form.confirm_robotpassword.$setValidity("passwordVerify", false);
                            }
                        }
                        $scope.saveInProgress=false;
                    });
                    $scope.saveFunction({
                      robotname: $scope.value
                    });
                };
            }
        };
    });
    directives.directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    scope.$apply(function (){
                        scope.$eval(attrs.ngEnter);
                    });
                    event.preventDefault();
                }
            });
        };
    });
    directives.directive('ngEscape', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 27) {
                    scope.$apply(function (){
                        scope.$eval(attrs.ngEscape);
                    });
                    event.preventDefault();
                }
            });
        };
    });
    directives.directive("passwordVerify", function() {
       return {
          require: "ngModel",
          scope: {
            passwordVerify: '='
          },
          link: function(scope, element, attrs, ctrl) {
            scope.$watch(function() {
                var combined;

                if (scope.passwordVerify || ctrl.$viewValue) {
                   combined = scope.passwordVerify + '_' + ctrl.$viewValue;
                }
                return combined;
            }, function(value) {
                if (value) {
                    //console.log(value);
                    ctrl.$parsers.unshift(function(viewValue) {
                        var origin = scope.passwordVerify;
                        if (origin !== viewValue) {
                            ctrl.$setValidity("passwordVerify", false);
                            return viewValue;
                        } else {
                            ctrl.$setValidity("passwordVerify", true);
                            return viewValue;
                        }
                    });
                }
            });
         }
       };
    });
    directives.directive("robotPasswordVerify", function(sSystem) {
       return {
          require: "ngModel",
          link: function(scope, element, attrs, ctrl) {
            scope.$on("elemBlur", function(event, result) {
                if (ctrl.$name == result.$name && ctrl.hasVisited && !ctrl.hasFocus) {
                    //console.log(ctrl.hasVisited ,  ctrl.hasFocus, ctrl);
                    if (ctrl.$viewValue){
                        ctrl.waitValidation = true;
                        sSystem.changePassword(ctrl.$viewValue, ctrl.$viewValue).then(function(result) {
                            //console.log(result);
                            ctrl.waitValidation = false;
                            ctrl.$setValidity("robotPasswordVerify", true);
                        }, function(result){
                            //console.log(result);
                            ctrl.waitValidation = false;
                            ctrl.$setValidity("robotPasswordVerify", false);
                        });
                    }
                }
            });
         }
       };
    });
    directives.directive('validatePass', function() {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$parsers.unshift(function(viewValue) {
                    console.log("parsers", viewValue);
                    if (viewValue.length >= scope.formFlags.minpasslength) {
                        // it is valid
                        ctrl.$setValidity('pass', true);
                    } else {
                        // it is invalid
                        ctrl.$setValidity('pass', false);
                    }
                    // update model anyway to sync password fields
                    return viewValue;
                });
               ctrl.$formatters.unshift(function(viewValue) {
                    console.log("formatters", viewValue);
                    if (viewValue.length >= scope.formFlags.minpasslength) {
                        // it is valid
                        ctrl.$setValidity('pass', true);
                    } else {
                        // it is invalid
                        ctrl.$setValidity('pass', false);
                    }
                    // update model anyway to sync password fields
                    return viewValue;
                });
            }
        };
    });
    directives.directive('input[type="text"]', blurFocusDirective);
});
