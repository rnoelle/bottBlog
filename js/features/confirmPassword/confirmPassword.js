angular.module('bottBlog')
  .directive('passConfirm', function () {
    return {
      require: 'ngModel',
      scope: {
        otherModelValue: "=passConfirm"
      },
      link: function (scope, element, attr, ngModel) {

        ngModel.$validators.compareTo = function (modelValue) {
                return modelValue == scope.otherModelValue;

        }
        scope.$watch('otherModelValue', function () {
          ngModel.$validate()
        })
      }
    }
  })
