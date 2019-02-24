'use strict';

/* App Module */

var phonecatApp = angular.module('qcaApp', [
  'ngRoute',
  'qcaAnimations',
  'qcaControllers'
]);

phonecatApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/qca', {
        templateUrl: 'partials/qca.html',
        controller: 'qca'
      }).
      otherwise({
        redirectTo: '/qca'
      });
  }]);
