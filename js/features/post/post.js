angular.module('bottBlog')
  .directive('post', function() {
    return {
      restrict: 'EA',
      templateUrl: './js/features/post/post.html',
      scope: {
        postData: '=',
        showFile: '=',
        postId: '='
      },
      controller: function($state, $scope, $firebaseArray, $sce, Auth, $window) {
        var storage = firebase.storage();
        var storageRef = storage.ref();
        var ref;
        var commentRef;

        $scope.$watch('postData', function() {
          if ($scope.postData) {
            if (!ref && $scope.showFile) {
              ref = firebase.database().ref('/posts/' + $scope.postId + '/comments')

              commentRef = $firebaseArray(ref);
              $scope.comments = commentRef;
            }

            if ($scope.postData.file && $scope.showFile) {
              var pathReference = storageRef.child($scope.postData.file);
              pathReference.getDownloadURL().then(function(url) {
                $scope.fileUrl = $sce.trustAsResourceUrl(url);
                $scope.$apply()
              }).catch(function(err) {
                console.log(err);
              })
            }

          }
        })

        $scope.comment = function() {
          Auth.$requireSignIn().then(function(el) {
            console.log('email', el.email);
            $scope.user = el;
            $scope.commenting = true;
          }).catch(function(error) {
            if (error == 'AUTH_REQUIRED') {
              $state.go("login")
            }
          })
        }

        $scope.submitComment = function () {
          var commentDate = new Date()
          var user = {
            displayName: $scope.user.displayName,
            photoURL: $scope.user.photoURL,
            uid: $scope.user.uid,
            email: $scope.user.email
          }
          var comment = {
            user: user,
            text: $scope.newComment,
            comment_date: commentDate.getTime()
          }
          console.log(comment);
          commentRef.$add(comment).then(function (ref) {
            console.log('I think it worked!');
          }, function (err) {
            console.log('I think it failed', err);
          })
          $scope.newComment = '';
          $scope.commenting = false;
        }

      },
      link: function(scope, element, attr) {
        if (attr.showFile == 'false') {
          var p = element[0].children[0].children[1].children[0]
          $clamp(p, {
            clamp: 7,
            originalText: scope.postData.text,
            truncationChar: ''
          })

        }
      }

    }
  });
