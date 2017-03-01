angular.module('bottBlog')
  .directive('searchBar', function($firebaseArray) {
    return {
      scope: {},
      template: '<input ng-blur="blurred()" ng-model="val" ng-change="update(val)" />' +
        '<ul class="suggestions">' +
        '<li ng-repeat="suggestion in suggestions track by $index | limitTo: 5">' +
        '<a ui-sref="post({id: suggestion.$id})"' +
        ' target="_blank">{{ suggestion.title }}</a>' +
        '</li>' +
        '</ul>',
      link: function(scope, element) {
        var ref = firebase.database().ref('posts/');
        var posts = $firebaseArray(ref);

        scope.update = function(term) {
          if (term.length < 1) {
            return scope.suggestions = [];
          }
          var byTitle = posts.filter(function(el) {
            return el.title.toLowerCase().indexOf(term.toLowerCase()) > -1;
          })
          var byTag = posts.filter(function (el) {
            if (el.tags) {
              return el.tags.filter(function (tag) {
                return tag.text.indexOf(term) > -1
              }).length > 0
            }
          })
          scope.suggestions = _.union(byTitle, byTag);
        }

        scope.blurred = function () {
          scope.suggestions = [];
        }
      }

    }
  });
