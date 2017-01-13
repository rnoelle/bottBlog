angular.module('bottBlog')
  .controller('postCtrl', function ($scope, $firebaseArray, $stateParams) {
    $scope.post = 'lalala'
    firebase.database().ref('/posts/' + $stateParams.id)
      .once('value').then(function (snap) {
        $scope.post = snap.val();
        console.log($scope.post);
        $scope.$apply();
    })

  })