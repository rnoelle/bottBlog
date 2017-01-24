angular.module('bottBlog')
  .controller('homeCtrl', function ($scope, $firebaseArray) {
    var ref = firebase.database().ref('posts/');
    var storageRef = firebase.storage().ref();
    ref.orderByChild('post_date').limitToLast(10).on("child_added", function (snap) {
      $scope.posts = $firebaseArray(ref);
    })




  })
