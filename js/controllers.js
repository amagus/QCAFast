'use strict';

/* Controllers */

var FinScope;

var Nids;

var phonecatControllers = angular.module('qcaControllers', []);

phonecatControllers.controller('qca', ['$scope', '$http',
  function($scope,$http) {
	FinScope = $scope;
	$scope.CellMatrix = [];
	$scope.size = 0;
	$scope.cells = [];
	$scope.inputs = [];
	$scope.outputs = [];
	$scope.displayProp = '99';
	$scope.curStep = 0;
	$scope.justLooped = false;
	
	$scope.step = function(a){
    	if($scope.steps.length == 0) 
    	    return;
	    $scope.curStep += a;
	    $scope.justLooped = false;
	    if($scope.curStep >= $scope.steps.length){
    	    if($scope.stepLoop > -1){
                $scope.curStep = parseInt($scope.stepLoop);
                $scope.justLooped = true;
            }else{
	            $scope.curStep = $scope.steps.length-1;
	        }
	    }else if($scope.curStep < 0)
	        $scope.curStep = 0; 
	};
	
	$scope.CELL_INPUT = CELL_INPUT;
	$scope.CELL_OUTPUT = CELL_OUTPUT;
	$scope.CELL_FIXED_0 = CELL_FIXED_0;
	$scope.CELL_FIXED_1 = CELL_FIXED_1;
	$scope.CELL_VERTICAL = CELL_VERTICAL;
	$scope.CELL_CROSSOVER = CELL_CROSSOVER;
	
	$scope.currHover = null;
	$scope.plzChange = false;
	
	$scope.stepsText = "";
	
	$http({
	  method: 'GET',
	  url: 'js/cx.txt?' + Math.random()
	}).then(function successCallback(response) {
    	$scope.stepsText = response.data.toString();
    });

	$scope.steps = [];
	$scope.stepLoop = -1;
	$scope.stepsFun = function(){
    	$scope.steps = [];
    	$scope.stepLoop = -1;
	    $scope.curStep = 0;
	    var tokenizer = $scope.stepsText.split("-> State:");
	    tokenizer.shift();
	    for (var i in tokenizer){
	        var tokens = tokenizer[i].split("\n");
	        tokens.shift();
	        $scope.steps[i] = {}
	        tokens && tokens.forEach(function(token){
	            var found = token.match(/(INPUT|CELL)([0-9]+)\s=\s([0-9]+|TRUE|FALSE)/);
	            if(found){
	                $scope.steps[i][parseInt(found[2])] = {changed: true,  val: found[3]};
	            }else{
    	            if(token.lastIndexOf("-- Loop starts here")!= -1){
        	            $scope.stepLoop = parseInt(i) + 1;
    	            }
	            }
	        });
	        if (i>0) for (var j in $scope.steps[i-1]){
	            if(!$scope.steps[i][j])
	                 $scope.steps[i][j] = {changed: false,  val: $scope.steps[i-1][j].val};
	            else if($scope.steps[i][j].val == $scope.steps[i-1][j].val)
	                 $scope.steps[i][j].changed = false;
	        }
	    }
	    console.log($scope.steps);
	}
	
	$scope.setInf = function(infBy){
		if(infBy){
			$scope.currHover = infBy;
			$scope.plzChange = false;
		}else{
			$scope.plzChange = true;
			setTimeout(function(){ if($scope.plzChange) $scope.$apply(function(){ $scope.currHover = null }) }, 50);
		}
	}
	
	$scope.inInfBy = function(cell){
		if($scope.currHover){
			return cell == $scope.currHover || $scope.currHover.infBy.lastIndexOf(cell) != -1;
		}
		return true;	
		
	}
	
	$http({
	  method: 'GET',
	  url: 'matrix.txt?' + Math.random()
	}).then(function successCallback(response) {
	    var a = response.data.toString().split("\n");
	    for(var x in a){
			if(a[x].length == 0)
				continue;
	        var c = a[x].split(/\s/);
	        if(!$scope.size)
	            $scope.size = c.length;
	        var line = [];
	        for(var y in c){
	            var val = parseInt(c[y]);
	            if(val < 0)
	                line.push(null);
	            else{
	                var cell = new Cell(Math.floor(val/10),val % 10,parseInt(x),parseInt(y));
	                $scope.cells.push(cell);
	                if(cell.type == CELL_INPUT)
	                    $scope.inputs.push({x:x,y:y});
	                if(cell.type == CELL_OUTPUT)
	                    $scope.outputs.push({x:x,y:y});
	                line.push(cell);
	            }
	                
	        }
	        $scope.CellMatrix.push(line);
    	}
    	Nids = analisaMatriz($scope.CellMatrix,$scope.cells,$scope.inputs,$scope.outputs);
	  }, function errorCallback(response) {
	    // called asynchronously if an error occurs
	    // or server returns response with an error status.
	  });
  }]);
