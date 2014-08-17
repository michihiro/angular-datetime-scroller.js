angular-datetime-scroller
=========================

A directive of date and time scroller for AngularJS

#Requirements
- [AngularJS](https://angularjs.org/) 1.2
- [jQuery](http://jquery.com/) 1.11/2.0
- [Moment.js](http://momentjs.com/)
- [Hammer.js](http://hammerjs.github.io/) 2.0
- [Hamster.js](http://monospaced.github.io/hamster.js/)

#Usage
Attach the stylesheet and the scripts to your page.
```
  <link href="css/mm-datetime-scroller.min.css" rel="stylesheet">
  <script src="js/jquery.min.js"></script>
  <script src="js/angular.min.js"></script>
  <script src="js/moment.min.js"></script>
  <script src="js/hammer.min.js"></script>
  <script src="js/hamster.js"></script>
  <script src="js/mm-datetimescroller.min.js"></script>
```
You can put an element that has mm-datetime attribute, and use from your controller.
```
<div ng-controll="yourCtrl">

  <div mm-datetime="datetime" option="{
    datetime: datetime,
    formats: ['MM/D(ddd)', '', 'HH', ':' 'mm'],
  }"></div>

</div>
<script>

  angular.module('your-app', ['mm-datetime']);

  angular.controller('yourCtrl', ['$scope', 
    function($scope) {

      $scope.datetime = new Date(); // or Date.now()

      $scope.$watch('datetime', function() {

        ...

      });
    }
  ]);
</script>
```
