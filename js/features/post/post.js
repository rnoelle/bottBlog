angular.module('bottBlog')
  .directive('post', function () {
    return {
      restrict: 'E',
      scope: {
        postData: '='
      },
      controller: function ($scope, postService) {
        
      }
    }
  })
