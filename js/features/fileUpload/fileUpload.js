angular.module('bottBlog')
  .directive('fileUpload', function () {
    return {
      restrict: 'E',
      templateUrl: '/js/features/fileUpload/fileUpload.html',
      link: function (scope, element, attrs) {
        $('#file').on('change', function () {
          console.log(document.getElementById('file').files[0].name);
          scope.fileName = document.getElementById('file').files[0].name;
          scope.$apply()
        })
      }
    }
  })
