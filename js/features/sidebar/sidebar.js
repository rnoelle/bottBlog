angular.module('bottBlog')
  .directive('sidebar', function ($firebaseArray) {
    return {
      restrict: 'E',
      templateUrl: './js/features/sidebar/sidebar.html',
      controller: function ($scope) {
        var ref = firebase.database().ref('posts/');
        var posts = $firebaseArray(ref);
        var tags = [];

        posts.$loaded()
          .then(function (postsArray) {
            // handle tags
            postsArray.map(e => {
              tags = _.union(tags, e.tags)
            })
            tags = _.union(tags.map(e => e.text))
            $scope.tags = tags;

            // handle searchByTag
            $scope.searchByTag = function (tag) {
              var filteredPosts = posts.filter(el => {
                                    if (!el.tags) return false;

                                    for (let i = 0; i < el.tags.length; i++) {
                                      if (el.tags[i].text == tag) {
                                        return true;
                                      }
                                    }
                                    return false;
                                  })
              $scope.posts = filteredPosts;
            }
          })

      }

    }
  })
