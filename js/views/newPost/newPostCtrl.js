angular.module('bottBlog')
  .controller('newPostCtrl', function ($scope, $firebaseArray) {
    var ref = firebase.database().ref('posts/');
    var storageRef = firebase.storage().ref();


    var data = $firebaseArray(ref);


    $scope.addPost = function (post) {
      if (!post) return;
      post.date = new Date()
      var postRef = storageRef.child(post.title + post.date);

      postRef.put(document.getElementById('file').files[0]).then(function (snap) {
        post.file = snap.a.fullPath;
        data.$add(post)
        $scope.post = {}
      })

    }

  })
