// 
// Here is how to define your module 
// has dependent on mobile-angular-ui
// 
var app = angular.module('MobileAngularUiExamples', [
  'Cordova',                                                   
  'ngRoute',
  'mobile-angular-ui',
  
  // touch/drag feature: this is from 'mobile-angular-ui.gestures.js'
  // it is at a very beginning stage, so please be careful if you like to use
  // in production. This is intended to provide a flexible, integrated and and 
  // easy to use alternative to other 3rd party libs like hammer.js, with the
  // final pourpose to integrate gestures into default ui interactions like 
  // opening sidebars, turning switches on/off ..
  'mobile-angular-ui.gestures',
  'starter.services'
  
]);


// 
// You can configure ngRoute as always, but to take advantage of SharedState location
// feature (i.e. close sidebar on backbutton) you should setup 'reloadOnSearch: false' 
// in order to avoid unwanted routing.
// 
app.config(function($routeProvider) {
  $routeProvider.when('/',              {templateUrl: 'templates/home.html', reloadOnSearch: false});
  $routeProvider.when('/scroll',        {templateUrl: 'templates/scroll.html', reloadOnSearch: false}); 
  $routeProvider.when('/toggle',        {templateUrl: 'templates/toggle.html', reloadOnSearch: false}); 
  $routeProvider.when('/tabs',          {templateUrl: 'templates/tabs.html', reloadOnSearch: false}); 
  $routeProvider.when('/accordion',     {templateUrl: 'templates/accordion.html', reloadOnSearch: false}); 
  $routeProvider.when('/overlay',       {templateUrl: 'templates/overlay.html', reloadOnSearch: false}); 
  $routeProvider.when('/forms',         {templateUrl: 'templates/forms.html', reloadOnSearch: false});
  $routeProvider.when('/dropdown',      {templateUrl: 'templates/dropdown.html', reloadOnSearch: false});
  $routeProvider.when('/drag',          {templateUrl: 'templates/drag.html', reloadOnSearch: false});
  $routeProvider.when('/carousel',      {templateUrl: 'templates/carousel.html', reloadOnSearch: false});
  $routeProvider.when('/useok',      	{templateUrl: 'templates/useok.html', reloadOnSearch: false});
  $routeProvider.when('/tab-charts',    {templateUrl: 'templates/tab-charts.html', reloadOnSearch: false});
  
  $routeProvider.when('/mesurePrise',    {templateUrl: 'templates/mesure-prise.html', reloadOnSearch: false});
  $routeProvider.when('/mesureRecap',    {templateUrl: 'templates/mesure-recap.html', reloadOnSearch: false});
  
  $routeProvider.when('/histo',    {templateUrl: 'templates/histo.html', reloadOnSearch: false});
  
  $routeProvider.when('/param',    {templateUrl: 'templates/or-param.html', reloadOnSearch: false});
});




//
// `$drag` example: drag to dismiss
//
app.directive('dragToDismiss', function($drag, $parse, $timeout){
  return {
    restrict: 'A',
    compile: function(elem, attrs) {
      var dismissFn = $parse(attrs.dragToDismiss);
      return function(scope, elem, attrs){
        var dismiss = false;

        $drag.bind(elem, {
          constraint: {
            minX: 0, 
            minY: 0, 
            maxY: 0 
          },
          move: function(c) {
            if( c.left >= c.width / 4) {
              dismiss = true;
              elem.addClass('dismiss');
            } else {
              dismiss = false;
              elem.removeClass('dismiss');
            }
          },
          cancel: function(){
            elem.removeClass('dismiss');
          },
          end: function(c, undo, reset) {
            if (dismiss) {
              elem.addClass('dismitted');
              $timeout(function() { 
                scope.$apply(function() {
                  dismissFn(scope);  
                });
              }, 400);
            } else {
              reset();
            }
          }
        });
      };
    }
  };
});

//
// Another `$drag` usage example: this is how you could create 
// a touch enabled "deck of cards" carousel. See `carousel.html` for markup.
//
app.directive('carousel', function(){
  return {
    restrict: 'C',
    scope: {},
    controller: function($scope) {
      this.itemCount = 0;
      this.activeItem = null;

      this.addItem = function(){
        var newId = this.itemCount++;
        this.activeItem = this.itemCount == 1 ? newId : this.activeItem;
        return newId;
      };

      this.next = function(){
        this.activeItem = this.activeItem || 0;
        this.activeItem = this.activeItem == this.itemCount - 1 ? 0 : this.activeItem + 1;
      };

      this.prev = function(){
        this.activeItem = this.activeItem || 0;
        this.activeItem = this.activeItem === 0 ? this.itemCount - 1 : this.activeItem - 1;
      };
    }
  };
});

app.directive('carouselItem', function($drag) {
  return {
    restrict: 'C',
    require: '^carousel',
    scope: {},
    transclude: true,
    template: '<div class="item"><div ng-transclude></div></div>',
    link: function(scope, elem, attrs, carousel) {
      scope.carousel = carousel;
      var id = carousel.addItem();
      
      var zIndex = function(){
        var res = 0;
        if (id == carousel.activeItem){
          res = 2000;
        } else if (carousel.activeItem < id) {
          res = 2000 - (id - carousel.activeItem);
        } else {
          res = 2000 - (carousel.itemCount - 1 - carousel.activeItem + id);
        }
        return res;
      };

      scope.$watch(function(){
        return carousel.activeItem;
      }, function(n, o){
        elem[0].style['z-index']=zIndex();
      });
      

      $drag.bind(elem, {
        constraint: { minY: 0, maxY: 0 },
        adaptTransform: function(t, dx, dy, x, y, x0, y0) {
          var maxAngle = 15;
          var velocity = 0.02;
          var r = t.getRotation();
          var newRot = r + Math.round(dx * velocity);
          newRot = Math.min(newRot, maxAngle);
          newRot = Math.max(newRot, -maxAngle);
          t.rotate(-r);
          t.rotate(newRot);
        },
        move: function(c){
          if(c.left >= c.width / 4 || c.left <= -(c.width / 4)) {
            elem.addClass('dismiss');  
          } else {
            elem.removeClass('dismiss');  
          }          
        },
        cancel: function(){
          elem.removeClass('dismiss');
        },
        end: function(c, undo, reset) {
          elem.removeClass('dismiss');
          if(c.left >= c.width / 4) {
            scope.$apply(function() {
              carousel.next();
            });
          } else if (c.left <= -(c.width / 4)) {
            scope.$apply(function() {
              carousel.next();
            });
          }
          reset();
        }
      });
    }
  };
});

function alertDismissed() {
    // do something
	//alert('rr');
}

app.controller('MainController', function(cordovaReady,$rootScope, $scope,$location,$route){
	
	
	
	$scope.appName = "Openradiation";
	
	
	$scope.buttonHome = "off";
	$scope.state = "1";
	$scope.top="0";
	$scope.menu="1";
	
	if (!isMobile)
	{
		var locationPath = $location.path();
	 	if (locationPath != "/")
	 	{
	 		$scope.top="1";
	 	}
	 	if (locationPath == "/mesurePrise" || locationPath == "/mesureRecap")
	 	{
	 		$scope.menu="0";
	 	}
	}
	

	 async.series([	
	               	function(callback){ cordovaReady(callback);},
	               //	function(callback){init_DB(callback);},
	               		
	               	//creta table
		          /*  function(callback){createTableQuestionnaires(callback);},
		            function(callback){createTableHoraires(callback);},
		            function(callback){createTableReponses(callback);},*/
		               	
		             //create db content
		             //function(callback){createQuestionnairesSuccess(callback);},
		               	
		             //test useOk
		            // function(callback){do_MC_UseOk(callback,$location,$route);},
	               	],
	   				 
	   				function(err, results ){
	   			 		console.log(results);
	   			 		//refreshDevices();
		   			 	//init state
		   			 	var locationPath = $location.path();
		   			 	if (locationPath != "/")
			   		 	{
			   		 		$scope.top="1";
			   		 	}
		   			 	if (locationPath == "/mesurePrise" || locationPath == "/mesureRecap")
			   		 	{
			   		 		$scope.menu="0";
			   		 	}
	   		         }
	   		 );//fin  async.series*/
	 
	$scope.buttonSearchCapteur = function(clickEvent){
	console.log('test');
		 fakeSearch($scope);
	}
	
	$scope.doMesure = function(clickEvent){
		console.log('doMesure');
		$location.path('/mesurePrise');
		$scope.top = "1";
		$scope.menu="0";
		 fakeMesure($scope);
	}
	
	$scope.endMesure = function(clickEvent){
		console.log('endMesure');
		$location.path('/mesureRecap');
		$scope.top = "1";
		$scope.menu="0";
		// fakeMesure($scope);
	}
	
	$scope.validMesure = function(clickEvent){
		console.log('validMesure');
		$scope.top = "0";
		$scope.menu="1";
		//$scope.state="1";
		$location.path('/');
		//$location.path('/mesureRecap');
		//$scope.top = "1";
		// fakeMesure($scope);
	}
	
	$scope.doHisto = function(clickEvent){
		console.log('doHisto');
		$location.path('/histo');
		$scope.top = "1";
		//$scope.menu="0";
		 //fakeMesure($scope);
	}
	
	


  // User agent displayed in home page
  $scope.userAgent = navigator.userAgent;
  
  // Needed for the loading screen
  $rootScope.$on('$routeChangeStart', function(){
    $rootScope.loading = true;
  });

  $rootScope.$on('$routeChangeSuccess', function(){
    $rootScope.loading = false;
  });
  
  //Change path
  //$location.path('/scroll'); 
  
 // console.log($rootScope);
  
 
  // Fake text i used here and there.
  $scope.lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vel explicabo, aliquid eaque soluta nihil eligendi adipisci error, illum corrupti nam fuga omnis quod quaerat mollitia expedita impedit dolores ipsam. Obcaecati.';

  // 
  // 'Scroll' screen
  // 
  var scrollItems = [];

  for (var i=1; i<=100; i++) {
    scrollItems.push('Item ' + i);
  }

  $scope.scrollItems = scrollItems;

  $scope.bottomReached = function() {
    alert('Congrats you scrolled to the end of the list!');
  }

  // 
  // Right Sidebar
  // 
  $scope.chatUsers = [
    { name: 'Carlos  Flowers', online: true },
    { name: 'Byron Taylor', online: true },
    { name: 'Jana  Terry', online: true },
    { name: 'Darryl  Stone', online: true },
    { name: 'Fannie  Carlson', online: true },
    { name: 'Holly Nguyen', online: true },
    { name: 'Bill  Chavez', online: true },
    { name: 'Veronica  Maxwell', online: true },
    { name: 'Jessica Webster', online: true },
    { name: 'Jackie  Barton', online: true },
    { name: 'Crystal Drake', online: false },
    { name: 'Milton  Dean', online: false },
    { name: 'Joann Johnston', online: false },
    { name: 'Cora  Vaughn', online: false },
    { name: 'Nina  Briggs', online: false },
    { name: 'Casey Turner', online: false },
    { name: 'Jimmie  Wilson', online: false },
    { name: 'Nathaniel Steele', online: false },
    { name: 'Aubrey  Cole', online: false },
    { name: 'Donnie  Summers', online: false },
    { name: 'Kate  Myers', online: false },
    { name: 'Priscilla Hawkins', online: false },
    { name: 'Joe Barker', online: false },
    { name: 'Lee Norman', online: false },
    { name: 'Ebony Rice', online: false }
  ];

  //
  // 'Forms' screen
  //  
  $scope.rememberMe = true;
  $scope.email = 'me@example.com';
  
  $scope.login = function() {
    alert('You submitted the login form');
  };

  // 
  // 'Drag' screen
  // 
  $scope.notices = [];
  
  for (var j = 0; j < 10; j++) {
    $scope.notices.push({icon: 'envelope', message: 'Notice ' + (j + 1) });
  }

  $scope.deleteNotice = function(notice) {
    var index = $scope.notices.indexOf(notice);
    if (index > -1) {
      $scope.notices.splice(index, 1);
    }
  };
  
  /// openradiation
 // $("#deviceList").touchend(connect);
  
  $scope.getData = function(clickEvent){
	  console.log("getData");
	  alert('getData');
	  $('#stateData span').html('En cours');
	  //rfduino.onData(onData, onRfError);
	  
	  $("#deviceList").on('touchend',connect);
	  //$("#deviceList").on('click',connect);
	  //$("#deviceList").touchend(connect);
	  }
  
  $scope.stopData = function(clickEvent){
	  console.log("stopData");
	  $('#stateData span').html('Stop');}
});
/*app.controller('FormCtrl', function($rootScope, $scope,$location){
	console.log('form');
	console.log(testglobal);
	 $location.path('/toggle'); 
});*/

/* $rootScope.$apply(function() {

$location.path('/scroll'); 
//console.log($location.path());
});*/



//CORDOVA
angular.module('Cordova', [])
.factory('cordovaReady', function(){
  return function(done) {
    if (typeof window.cordova === 'object') {
      document.addEventListener('deviceready', function () {
    	  console.log('cordovaready');
       // done();
    	  done(null,'cordoveaok');
      }, false);
    } else {
      done();
      done(null,'cordoveako');
    }
  };
});