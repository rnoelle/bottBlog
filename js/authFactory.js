angular.module('bottBlog')
  .factory("Auth", ['$firebaseAuth', function ($firebaseAuth) {
    // var ref = firebase.database().ref()
    return $firebaseAuth();
  }])
