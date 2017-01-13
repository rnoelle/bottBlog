angular.module('bottBlog')
  .controller('newPostCtrl', function ($scope, $firebaseArray, $window) {
    var ref = firebase.database().ref('posts/');
    var storageRef = firebase.storage().ref();


    var data = $firebaseArray(ref);


    $scope.addPost = function (post) {
      if (!post) return;
      post.post_date = new Date();
      post.post_date = post.post_date.getTime()
      var postRef = storageRef.child(post.title + post.post_date);
      var theFile = document.getElementById('file').files[0];
      if (theFile) {
        postRef.put(theFile).then(function (snap) {
        post.file = snap.a.fullPath;
          data.$add(post)
          $scope.post = {}
          $window.location.reload();
        })

      } else {
        console.log(post);
        data.$add(post)
        $scope.post = {}
      }

    }

  })
