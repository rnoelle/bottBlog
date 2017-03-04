angular.module('bottBlog')
  .controller('manageCtrl', function ($scope, $firebaseArray) {

    var ref = firebase.database().ref('posts/');
    $scope.posts = $firebaseArray(ref.orderByChild('post_date'));

  })
