angular.module('bottBlog', ['ui.router'])
  .config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        templateUrl: './views/home/home.html',
        controller: 'homeCtrl',
        controllerAs: 'hc'
      })
  })
