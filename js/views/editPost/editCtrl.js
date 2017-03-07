angular.module('bottBlog')
  .controller('editCtrl', function($scope, $firebaseObject, $stateParams, $sce, $state) {

    var storage = firebase.storage();
    var storageRef = storage.ref();

    firebase.database().ref('/posts/' + $stateParams.id)
      .once('value').then(function(snap) {


        $scope.post = snap.val();

        if ($scope.post.file) {
          var pathReference = storageRef.child($scope.post.file);
          pathReference.getDownloadURL().then(function(url) {
            $scope.fileUrl = $sce.trustAsResourceUrl(url);
            $scope.$apply();
          }).catch(function(err) {
            console.log('error getting file', err);
          })
        }
        $scope.$apply();
      });

    $scope.deleteFile = function() {
      $scope.deleteFile = true;
      $scope.fileUrl = null;
    }

    $scope.editPost = function() {
      var ref = firebase.database().ref('/posts/' + $stateParams.id);
      var postToEdit = $firebaseObject(ref);

      if (!$scope.post) return;
      var theFile = document.getElementById('file').files[0];
      var postRef = storageRef.child($scope.post.title + $scope.post.post_date);

      if ($scope.deleteFile) {
        var pathReference = storageRef.child($scope.post.title + $scope.post.post_date);
        pathReference.delete()
        $scope.post.file = null;
      }
      //Final step
      if (theFile) {

        postRef.put(theFile).then(function(snap) {
          $scope.post.file = snap.a.fullPath;
          for (var prop in $scope.post) {
            postToEdit[prop] = $scope.post[prop];
          }
          postToEdit.$save().then(function (ref) {
            $state.go('manage')
          }, function (error) {
            alert('There was an error with the update.', error)
          })
        })

      } else {

        for (var prop in $scope.post) {
          postToEdit[prop] = $scope.post[prop];
        }
        postToEdit.$save().then(function (ref) {
          $state.go('manage')
        }, function (error) {
          alert('There was an error with the update.', error)
        })
      }

    }

  });
