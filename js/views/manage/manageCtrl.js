angular.module('bottBlog')
  .controller('manageCtrl', function ($scope, $firebaseArray, $firebaseObject, $window) {

    var ref = firebase.database().ref('posts/');
    $scope.posts = $firebaseArray(ref.orderByChild('post_date'));

    $scope.deletePost = function (id) {
      $scope.currentPost = id;
      $scope.modalOpen = true;
    }

    $scope.delete = function () {
      var post = $firebaseObject(ref.child($scope.currentPost))
      post.$remove().then(function () {
        $window.location.reload()
      })
    }

    $scope.cancel = function () {
      delete $scope.currentPost;
      $scope.modalOpen = false;
    }
  })
