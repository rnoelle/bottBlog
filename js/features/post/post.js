angular.module('bottBlog')
  .directive('post', function () {
    return {
      restrict: 'EA',
      templateUrl: './js/features/post/post.html',
      scope: {
        postData: '=',
        showFile: '='
      },
      controller: function ($scope, $firebaseArray, $sce) {
        var storage = firebase.storage();
        var storageRef = storage.ref();

         $scope.$watch('postData', function () {
           if ($scope.postData.file) {
             var pathReference = storageRef.child($scope.postData.file);
             pathReference.getDownloadURL().then(function (url) {
               $scope.fileUrl = $sce.trustAsResourceUrl(url);
               $scope.$apply()
             }).catch(function (err) {
               console.log(err);
             })
           }

         })

      },
      link: function (scope, element, attr) {
        if (attr.showFile == 'false') {
        var p = element[0].children[0].children[1].children[0]
        $clamp(p, {clamp:7});
      }
      // console.log(element[0].children[0].children[1].children[0]);

      }
    }


  });
