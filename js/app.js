angular.module('bottBlog', ['ui.router'])
  .config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: '/js/views/home/home.html',
        controller: 'homeCtrl',
        controllerAs: 'hc'
      })
      .state('newPost', {
        url: '/newPost',
        templateUrl: '/js/views/newPost/newPost.html',
        controller: 'newPostCtrl',
        controllerAs: 'npc'
      })
  })
