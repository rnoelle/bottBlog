angular.module('bottBlog')
  .controller('postCtrl', function ($scope, $firebaseArray, $stateParams) {
    firebase.database().ref('/posts/' + $stateParams.id)
      .once('value').then(function (snap) {
        $scope.post = snap.val();
        $scope.postId = $stateParams.id;
        console.log($scope.post);
        $scope.$apply();
    })

  })
