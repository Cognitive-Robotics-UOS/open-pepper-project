define(['./module'], function (filters) {
    'use strict';
    filters.filter('getListElementBy', function() {
      return function(input, by, res) {
        var i=0, len=input.length, result=new Array();
        for (; i<len; i++) {
          if (input[i][by] == res) {
            result.push(input[i]);
          }
        }
        return result;
      }
    });
    filters.filter('getElementBy', function() {
      return function(input, by, res) {
        var i=0, len=input.length;
        for (; i<len; i++) {
          if (input[i][by] == res) {
            return input[i];
          }
        }
        return null;
      }
    });
    filters.filter('getElementByRegexp', function() {
        return function(input, res) {
            var filterpattern = new RegExp(res,"i")
            var i=0, len=input.length, result=new Array();;
            for (; i<len; i++) {
                if (input[i].match(filterpattern)) {
                    result.push(input[i]);
                }
            }
            return result.sort();
        }
    });
    filters.filter('getIndexBy', function() {
      return function(input, by, res) {
        var i=0, len=input.length;
        for (; i<len; i++) {
          if (input[i][by] == res) {
            return i;
          }
        }
        return null;
      }
    });
    filters.filter('getById', function() {
      return function(input, id) {
        var i=0, len=input.length;
        for (; i<len; i++) {
          if (input[i].id == id) {
            return input[i];
          }
        }
        return null;
      }
    });
    filters.filter('getByLabel', function() {
      return function(input, label) {
        var i=0, len=input.length;
        for (; i<len; i++) {
          if (input[i].label == label) {
            return input[i];
          }
        }
        return null;
      }
    });
    filters.filter('getByOrder', function() {
      return function(input, order) {
        var i=0, len=input.length;
        for (; i<len; i++) {
          if (input[i].order == order) {
            return input[i];
          }
        }
        return null;
      }
    });
    filters.filter('getByType', function() {
      return function(input, type) {
        var i=0, len=input.length, result=new Array();
        for (; i<len; i++) {
          if (input[i][type]) {
            result.push(input[i]);
          }
        }
        return result;
      }
    });
    filters.filter('getByTitle', function() {
      return function(input, title) {
        var i=0, len=input.length;
        for (; i<len; i++) {
          if (input[i].title == title) {
            return i;
          }
        }
        return null;
      }
    });
});
