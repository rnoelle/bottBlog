angular.module('bottBlog')
  .controller('homeCtrl', function ($scope, $firebaseArray) {
    var ref = firebase.database().ref('posts/');
    var storageRef = firebase.storage().ref();


    $scope.posts = $firebaseArray(ref);

  })
