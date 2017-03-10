'use strict';

angular.module('bottBlog', ['ui.router', 'firebase', 'ngTagsInput', 'td.easySocialShare']).constant('_', window._).run(function ($rootScope) {
  $rootScope._ = window._;
}).config(function ($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/');

  var authResolve = {
    currentAuth: function currentAuth(Auth, $state) {
      return Auth.$requireSignIn().then(function (el) {
        console.log('email', el.email);
        if (el.email !== 'reidnoelle2@gmail.com' && el.email !== 'cjamesbott@gmail.com') {
          $state.go('home');
        }
      }).catch(function (error) {
        if (error == 'AUTH_REQUIRED') {
          $state.go('login');
        }
      });
    }
  };

  $stateProvider.state('home', {
    url: '/',
    templateUrl: '/js/views/home/home.html',
    controller: 'homeCtrl'
  }).state('newPost', {
    url: '/newPost',
    templateUrl: '/js/views/newPost/newPost.html',
    controller: 'newPostCtrl',
    resolve: authResolve
  }).state('post', {
    url: '/post/:id',
    templateUrl: '/js/views/post/post.html',
    controller: 'postCtrl'
  }).state('login', {
    url: '/login/:error',
    templateUrl: '/js/views/login/login.html',
    controller: 'loginCtrl'
  }).state('about', {
    url: '/about',
    templateUrl: '/js/views/about/about.html'
  }).state('manage', {
    url: '/manage',
    templateUrl: '/js/views/manage/manage.html',
    controller: 'manageCtrl',
    resolve: authResolve

  }).state('editPost', {
    url: '/editPost/:id',
    templateUrl: '/js/views/editPost/editPost.html',
    controller: 'editCtrl',
    resolve: authResolve
  });
});

angular.module('bottBlog').run(function ($rootScope, $location, $state) {
  $rootScope.$on("$routeChangeError", function (event, toState, toParams, fromState, fromParams, error) {
    // We can catch the error thrown when the $requireAuth promise is rejected
    // and redirect the user back to the home page
    if (error === "AUTH_REQUIRED") {
      $state.go("/login");
    }
  });
});
'use strict';

angular.module('bottBlog').factory("Auth", ['$firebaseAuth', function ($firebaseAuth) {
  // var ref = firebase.database().ref()
  return $firebaseAuth();
}]);
'use strict';

angular.module('bottBlog').directive('adminNav', function () {
  return {
    restrict: 'EA',
    templateUrl: '/js/features/adminNav/adminNav.html'
  };
});
'use strict';

angular.module('bottBlog').directive('passConfirm', function () {
  return {
    require: 'ngModel',
    scope: {
      otherModelValue: "=passConfirm"
    },
    link: function link(scope, element, attr, ngModel) {

      ngModel.$validators.compareTo = function (modelValue) {
        return modelValue == scope.otherModelValue;
      };
      scope.$watch('otherModelValue', function () {
        ngModel.$validate();
      });
    }
  };
});
'use strict';

angular.module('td.easySocialShare', []).directive('shareLinks', ['$location', function ($location) {
  return {
    link: function link(scope, elem, attrs) {
      var i,
          sites = ['twitter', 'facebook', 'linkedin', 'google-plus'],
          theLink,
          links = attrs.shareLinks.toLowerCase().split(','),
          pageLink = encodeURIComponent($location.absUrl()),
          pageTitle = attrs.shareTitle,
          pageTitleUri = encodeURIComponent(pageTitle),
          shareLinks = [],
          square = '';

      elem.addClass('td-easy-social-share');

      // check if square icon specified
      square = attrs.shareSquare && attrs.shareSquare.toString() === 'true' ? '-square' : '';

      // assign share link for each network
      angular.forEach(links, function (key) {
        key = key.trim();

        switch (key) {
          case 'twitter':
            theLink = 'https://twitter.com/intent/tweet?text=' + pageTitleUri + '%20' + pageLink;
            break;
          case 'facebook':
            theLink = 'https://facebook.com/sharer.php?u=' + pageLink;
            break;
          case 'linkedin':
            theLink = 'https://www.linkedin.com/shareArticle?mini=true&url=' + pageLink + '&title=' + pageTitleUri;
            break;
          case 'google-plus':
            theLink = 'https://plus.google.com/share?url=' + pageLink;
            break;
        }

        if (sites.indexOf(key) > -1) {
          shareLinks.push({ network: key, url: theLink });
        }
      });

      for (i = 0; i < shareLinks.length; i++) {
        var anchor = '';
        anchor += '<a href="' + shareLinks[i].url + '"';
        anchor += ' class="fa fa-' + shareLinks[i].network + square + '" target="_blank"';
        anchor += '></a>';
        elem.append(anchor);
      }
    }
  };
}]);
'use strict';

angular.module('bottBlog').directive('fileUpload', function () {
  return {
    restrict: 'E',
    templateUrl: '/js/features/fileUpload/fileUpload.html',
    link: function link(scope, element, attrs) {
      $('#file').on('change', function () {
        console.log(document.getElementById('file').files[0].name);
        scope.fileName = document.getElementById('file').files[0].name;
        scope.$apply();
      });
    }
  };
});
'use strict';

angular.module('bottBlog').directive('post', function () {
  return {
    restrict: 'EA',
    templateUrl: './js/features/post/post.html',
    scope: {
      postData: '=',
      showFile: '=',
      postId: '='
    },
    controller: function controller($state, $scope, $firebaseArray, $sce, Auth, $window) {
      var storage = firebase.storage();
      var storageRef = storage.ref();
      var ref;
      var commentRef;

      $scope.$watch('postData', function () {
        if ($scope.postData) {
          if (!ref && $scope.showFile) {
            ref = firebase.database().ref('/posts/' + $scope.postId + '/comments');

            commentRef = $firebaseArray(ref);
            $scope.comments = commentRef;
          }

          if ($scope.postData.file && $scope.showFile) {
            var pathReference = storageRef.child($scope.postData.file);
            pathReference.getDownloadURL().then(function (url) {
              $scope.fileUrl = $sce.trustAsResourceUrl(url);
              $scope.$apply();
            }).catch(function (err) {
              console.log(err);
            });
          }
        }
      });

      $scope.comment = function () {
        Auth.$requireSignIn().then(function (el) {
          console.log('email', el.email);
          $scope.user = el;
          $scope.commenting = true;
        }).catch(function (error) {
          if (error == 'AUTH_REQUIRED') {
            $state.go("login");
          }
        });
      };

      $scope.submitComment = function () {
        var commentDate = new Date();
        var user = {
          displayName: $scope.user.displayName,
          photoURL: $scope.user.photoURL,
          uid: $scope.user.uid,
          email: $scope.user.email
        };
        var comment = {
          user: user,
          text: $scope.newComment,
          comment_date: commentDate.getTime()
        };
        console.log(comment);
        commentRef.$add(comment).then(function (ref) {
          console.log('I think it worked!');
        }, function (err) {
          console.log('I think it failed', err);
        });
        $scope.newComment = '';
        $scope.commenting = false;
      };
    },
    link: function link(scope, element, attr) {
      if (attr.showFile == 'false') {
        var p = element[0].children[0].children[1].children[0];
        $clamp(p, {
          clamp: 7,
          originalText: scope.postData.text,
          truncationChar: ''
        });
      }
    }

  };
});
'use strict';

angular.module('bottBlog').directive('searchBar', function ($firebaseArray) {
  return {
    scope: {},
    template: '<input ng-blur="blurred()" ng-model="val" ng-change="update(val)" />' + '<ul class="suggestions">' + '<li ng-repeat="suggestion in suggestions track by $index | limitTo: 5">' + '<a ui-sref="post({id: suggestion.$id})"' + ' target="_blank">{{ suggestion.title }}</a>' + '</li>' + '</ul>',
    link: function link(scope, element) {
      var ref = firebase.database().ref('posts/');
      var posts = $firebaseArray(ref);

      scope.update = function (term) {
        if (term.length < 1) {
          return scope.suggestions = [];
        }
        var byTitle = posts.filter(function (el) {
          return el.title.toLowerCase().indexOf(term.toLowerCase()) > -1;
        });
        var byTag = posts.filter(function (el) {
          if (el.tags) {
            return el.tags.filter(function (tag) {
              return tag.text.indexOf(term) > -1;
            }).length > 0;
          }
        });
        scope.suggestions = _.union(byTitle, byTag);
      };

      scope.blurred = function () {
        scope.suggestions = [];
      };
    }

  };
});
'use strict';

angular.module('bottBlog').directive('sidebar', function ($firebaseArray) {
  return {
    restrict: 'E',
    templateUrl: '/js/features/sidebar/sideBar.html',
    controller: function controller($scope) {
      var ref = firebase.database().ref('posts/');
      var posts = $firebaseArray(ref);
      var tags = [];

      posts.$loaded().then(function (postsArray) {
        // handle tags
        postsArray.map(function (e) {
          tags = _.union(tags, e.tags);
        });
        tags = _.union(tags.map(function (e) {
          return e.text;
        }));
        $scope.tags = tags;

        // handle searchByTag
        $scope.searchByTag = function (tag) {
          var filteredPosts = posts.filter(function (el) {
            if (!el.tags) return false;

            for (var i = 0; i < el.tags.length; i++) {
              if (el.tags[i].text == tag) {
                return true;
              }
            }
            return false;
          });
          $scope.posts = filteredPosts;
        };
      });
    }

  };
});
'use strict';

angular.module('bottBlog').controller('aboutCtrl', function ($scope) {});
'use strict';

angular.module('bottBlog').controller('editCtrl', function ($scope, $firebaseObject, $stateParams, $sce, $state) {

  var storage = firebase.storage();
  var storageRef = storage.ref();

  firebase.database().ref('/posts/' + $stateParams.id).once('value').then(function (snap) {

    $scope.post = snap.val();

    if ($scope.post.file) {
      var pathReference = storageRef.child($scope.post.file);
      pathReference.getDownloadURL().then(function (url) {
        $scope.fileUrl = $sce.trustAsResourceUrl(url);
        $scope.$apply();
      }).catch(function (err) {
        console.log('error getting file', err);
      });
    }
    $scope.$apply();
  });

  $scope.deleteFile = function () {
    $scope.deleteFile = true;
    $scope.fileUrl = null;
  };

  $scope.editPost = function () {
    var ref = firebase.database().ref('/posts/' + $stateParams.id);
    var postToEdit = $firebaseObject(ref);

    if (!$scope.post) return;
    var theFile = document.getElementById('file').files[0];
    var postRef = storageRef.child($scope.post.title + $scope.post.post_date);

    if ($scope.deleteFile) {
      var pathReference = storageRef.child($scope.post.title + $scope.post.post_date);
      pathReference.delete();
      $scope.post.file = null;
    }
    //Final step
    if (theFile) {

      postRef.put(theFile).then(function (snap) {
        $scope.post.file = snap.a.fullPath;
        for (var prop in $scope.post) {
          postToEdit[prop] = $scope.post[prop];
        }
        postToEdit.$save().then(function (ref) {
          $state.go('manage');
        }, function (error) {
          alert('There was an error with the update.', error);
        });
      });
    } else {

      for (var prop in $scope.post) {
        postToEdit[prop] = $scope.post[prop];
      }
      postToEdit.$save().then(function (ref) {
        $state.go('manage');
      }, function (error) {
        alert('There was an error with the update.', error);
      });
    }
  };
});
'use strict';

angular.module('bottBlog').controller('homeCtrl', function ($scope, $firebaseArray) {
  var ref = firebase.database().ref('posts/');
  $scope.posts = $firebaseArray(ref.orderByChild('post_date').limitToLast(6));
});
'use strict';

angular.module('bottBlog').controller('loginCtrl', function ($scope, $stateParams, $firebaseAuth, $state) {
  var auth = $firebaseAuth();

  if ($stateParams.error == 'error') {
    $scope.isError = true;
  } else if ($stateParams == 'register') {
    $scope.register = true;
  }

  $scope.getRegister = function () {
    $scope.register = !$scope.register;
  };

  $scope.createUser = function (email, password) {

    auth.$createUserWithEmailAndPassword(email, password).then(function (firebaseUser) {
      console.log('signed in as', firebaseUser);
      $state.go('home');
    }).catch(function (error) {
      alert(error);
    });
  };

  $scope.loginEmail = function (email, password) {
    $scope.firebaseUser = null;
    $scope.error = null;

    auth.$signInWithEmailAndPassword(email, password).then(function (firebaseUser) {
      console.log('signed in as', firebaseUser);
      $state.go('home');
    }).catch(function (error) {
      console.log('error', error);
      alert(error);
    });
  };

  $scope.loginGoogle = function () {
    $scope.firebaseUser = null;
    $scope.error = null;

    auth.$signInWithPopup("google").then(function (firebaseUser) {
      console.log('signed in as', firebaseUser);
      $state.go('home');
    }).catch(function (error) {
      console.log('error', error);
      alert(error);
    });
  };
});
'use strict';

angular.module('bottBlog').controller('manageCtrl', function ($scope, $firebaseArray, $firebaseObject, $window) {

  var ref = firebase.database().ref('posts/');
  $scope.posts = $firebaseArray(ref.orderByChild('post_date'));

  $scope.deletePost = function (id) {
    $scope.currentPost = id;
    $scope.modalOpen = true;
  };

  $scope.delete = function () {
    var post = $firebaseObject(ref.child($scope.currentPost));
    post.$remove().then(function () {
      $window.location.reload();
    });
  };

  $scope.cancel = function () {
    delete $scope.currentPost;
    $scope.modalOpen = false;
  };
});
'use strict';

angular.module('bottBlog').controller('newPostCtrl', function ($scope, $state, currentAuth, $firebaseArray, $window) {
  var ref = firebase.database().ref('posts/');
  var storageRef = firebase.storage().ref();

  var data = $firebaseArray(ref);

  $scope.addPost = function (post) {
    if (!post) return;
    post.post_date = new Date();
    post.post_date = post.post_date.getTime();
    var postRef = storageRef.child(post.title + post.post_date);
    var theFile = document.getElementById('file').files[0];
    if (theFile) {
      postRef.put(theFile).then(function (snap) {
        post.file = snap.a.fullPath;
        data.$add(post);
        $scope.post = {};
        $state.go('manage');
      });
    } else {
      console.log(post);
      data.$add(post);
      $scope.post = {};
    }
  };
});
'use strict';

angular.module('bottBlog').controller('postCtrl', function ($scope, $firebaseArray, $stateParams) {
  firebase.database().ref('/posts/' + $stateParams.id).once('value').then(function (snap) {
    $scope.post = snap.val();
    $scope.postId = $stateParams.id;
    console.log($scope.post);
    $scope.$apply();
  });
});