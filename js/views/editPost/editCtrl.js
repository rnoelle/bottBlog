angular.module('bottBlog')
  .controller('editCtrl', function ($scope, $firebaseArray, $stateParams, $sce) {

    var storage = firebase.storage();
    var storageRef = storage.ref();

    firebase.database().ref('/posts/' + $stateParams.id)
      .once('value').then(function (snap) {


        $scope.post = snap.val();

        if ($scope.post.file) {
          var pathReference = storageRef.child($scope.post.file);
          pathReference.getDownloadURL().then(function(url) {
            $scope.fileUrl = $sce.trustAsResourceUrl(url);
            $scope.$apply();
          }).catch(function(err) {
            console.log(err);
          })
        }
        $scope.$apply();
    });

    $scope.deleteFile = function () {
      $scope.deleteFile = true;
      $scope.fileUrl = null;
    }

    $scope.editPost = function () {
      var ref = firebase.database().ref('/posts/' + $stateParams.id);
      var postToEdit = $firebaseArray(ref);

      if (!$scope.post) return;
      var theFile = document.getElementById('file').files[0];
      var postRef = storageRef.child($scope.post.title + $scope.post.post_date);
      if (theFile) {
        postRef.put(theFile).then(function (snap) {
        $scope.post.file = snap.a.fullPath;
          postToEdit.$save($scope.post)

          console.log('saved with new file!');
        })

      } else {
        postToEdit.$save($scope.post);
        console.log('saved!', $scope.post);
      }

    }

  });
