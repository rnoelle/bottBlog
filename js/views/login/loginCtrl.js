angular.module('bottBlog')
  .controller('loginCtrl', function ($scope, $stateParams, $firebaseAuth, $state) {
    var auth = $firebaseAuth();

    if ($stateParams.error == 'error') {
      $scope.isError = true;
    } else if ($stateParams == 'register') {
      $scope.register = true;
    }

    $scope.getRegister = function () {
      $scope.register = !$scope.register;
    }

    $scope.createUser = function (email, password) {


      auth.$createUserWithEmailAndPassword(email, password).then(function (firebaseUser) {
        console.log('signed in as', firebaseUser);
        $state.go('home')
      }).catch(function (error) {
        $state.go('login({error: "error"})')
      })
    }

    $scope.loginEmail = function (email, password) {
      $scope.firebaseUser = null;
      $scope.error = null;

      auth.$signInWithEmailAndPassword(email, password).then(function (firebaseUser) {
        console.log('signed in as', firebaseUser);
        $state.go('home')
      }).catch(function (error) {
        console.log('error', error);
        $state.go('login({error: "error"})')
      })
    }

    $scope.loginGoogle = function() {
      $scope.firebaseUser = null;
      $scope.error = null;

      auth.$signInWithPopup("google").then(function (firebaseUser) {
        console.log('signed in as', firebaseUser);
        $state.go('home')
      }).catch(function (error) {
        console.log('error', error);
        $state.go('login({error: "error"})')
      })
    }

  })
