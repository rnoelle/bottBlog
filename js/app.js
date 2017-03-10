angular.module('bottBlog', ['ui.router', 'firebase', 'ngTagsInput', 'td.easySocialShare'])
  .constant('_', window._)
  .run(function ($rootScope) {
    $rootScope._ = window._;
  })
  .config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    var authResolve = {
      currentAuth: function(Auth, $state) {
          return Auth.$requireSignIn().then(function (el) {
            console.log('email', el.email);
            if (el.email !== 'reidnoelle2@gmail.com' && el.email !== 'cjamesbott@gmail.com') {
              $state.go('home');
            }
          }).catch(function (error) {
            if (error == 'AUTH_REQUIRED') {
              $state.go('login')
            }
        })
      }
    }

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: '/js/views/home/home.html',
        controller: 'homeCtrl'
      })
      .state('newPost', {
        url: '/newPost',
        templateUrl: '/js/views/newPost/newPost.html',
        controller: 'newPostCtrl',
        resolve: authResolve
      })
      .state('post', {
        url: '/post/:id',
        templateUrl: '/js/views/post/post.html',
        controller: 'postCtrl'
      })
      .state('login', {
        url: '/login/:error',
        templateUrl: '/js/views/login/login.html',
        controller: 'loginCtrl'
      })
      .state('about', {
        url: '/about',
        templateUrl: '/js/views/about/about.html',
        // controller: 'aboutCtrl'
      })
      .state('manage', {
        url: '/manage',
        templateUrl: '/js/views/manage/manage.html',
        controller: 'manageCtrl',
        resolve: authResolve

      })
      .state('editPost', {
        url: '/editPost/:id',
        templateUrl: '/js/views/editPost/editPost.html',
        controller: 'editCtrl',
        resolve: authResolve
      })



  })

  angular.module('bottBlog').run(function($rootScope, $location, $state) {
    $rootScope.$on("$routeChangeError", function(event, toState, toParams, fromState, fromParams, error) {
      // We can catch the error thrown when the $requireAuth promise is rejected
      // and redirect the user back to the home page
      if (error === "AUTH_REQUIRED") {
        $state.go("/login");
      }
    });
  });
