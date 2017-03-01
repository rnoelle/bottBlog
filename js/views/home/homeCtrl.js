angular.module('bottBlog')
  .controller('homeCtrl', function ($scope, $firebaseArray) {
    var ref = firebase.database().ref('posts/');
    $scope.posts = $firebaseArray(ref.orderByChild('post_date').limitToLast(6));

  })
