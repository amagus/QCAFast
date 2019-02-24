
var CELL_REGULAR = 0;
var CELL_INPUT = 1;
var CELL_OUTPUT = 2;
var CELL_FIXED_0 = 3;
var CELL_FIXED_1 = 4;
var CELL_VERTICAL = 5;
var CELL_CROSSOVER = 6;

var cellUidCnt = 0;

function recCheckMat(matriz,cell_n,clock,neighborhood_id){
    var x = cell_n.x;
    var y = cell_n.y;
      
    var list = [];
	var prev_clock = clock ? clock - 1 : 3;    
	
	if(cell_n.type == CELL_INPUT) return list;
    
    var debug = cell_n.uid == 321;
    //if(debug) console.log(neighborhood_id);//(neighborhood_id == 26); //cell_n.uid == 56;//(neighborhood_id == 19);//cell_n.uid == 10;
    
    function checkCell(cell,iviz,offset_x,offset_y){
	    if(cell){
		    
		    if(offset_x != 0 || offset_y != 0){
			    if(cell_n.type == CELL_CROSSOVER && cell.type != CELL_CROSSOVER && cell.type != CELL_VERTICAL){
				   if(debug) console.log("-- jump")
				   //var n_cell = matriz[x+offset_x] ? matriz[x+offset_x][y+offset_y] : null;
				   //return checkCell(n_cell,iviz,0,0);
				    return false;
			    }
			    
			    if(cell_n.type != CELL_CROSSOVER && cell_n.type != CELL_VERTICAL  && cell.type == CELL_CROSSOVER){
				    if(debug) console.log("-- skip")

				    var n_cell = matriz[x+offset_x] ? matriz[x+offset_x][y+offset_y] : null;
				    return checkCell(n_cell,iviz,0,0);

					//return false;
			    }
		    }
		    
		    if (debug) console.log("-- Checking", cell_n.uid, cell.uid);
		    
	        if(cell.nid != neighborhood_id){ //prevents rechecking
	            cell_n.setInverteViz(iviz);
	            if(cell.clock == clock){
                    if(debug) console.log("-- isInfBy", cell_n.uid, cell.uid);
	            	cell.setNid(neighborhood_id);
	                cell_n.type != CELL_INPUT && cell_n.setInf(cell);
	                list = list.concat(recCheckMat(matriz,cell,clock,neighborhood_id));
	            }else if (cell.clock == prev_clock){
    	            if(debug) console.log("-- isInfBy", cell_n.uid, cell.uid);
	                cell_n.setInf(cell);
	                list.push(cell);
	                cell.infN = true;
	                return true;
	            }
	            return (cell.nid == neighborhood_id);
	        }
        }
		return false;
        
    }
    
    var c,cright,cleft,cup,cdown;
    var i = false;

    cright = matriz[x] ? matriz[x][y+1] : null; //right
    if(checkCell(cright,false,0,2))
		i = true;
	
    cleft =  matriz[x] ? matriz[x][y-1] : null; //left
    if(checkCell(cleft,false,0,-2))
		i = true;
        
    cup = matriz[x+1] ? matriz[x+1][y] : null; //up
    if(checkCell(cup,false,2,0))
		i = true;
        
    cdown = matriz[x-1] ? matriz[x-1][y] : null; //down
    if(checkCell(cdown,false,-2,0))
		i = true;
	    
    if(!i){
	    if(!cup && !cright){
		    c = matriz[x+1] ? matriz[x+1][y+1] : null; //top-right
		    checkCell(c,true,0,0);
	    }
		
		if(!cup && !cleft){
		    c = matriz[x+1] ? matriz[x+1][y-1] : null; //top-left
		    checkCell(c,true,0,0);
		}
		if(!cdown && !cleft){
		    c = matriz[x-1] ? matriz[x-1][y-1] : null; //bottom-left
		    checkCell(c,true,0,0);
	    }
		
		if(!cdown && !cright){
		    c = matriz[x-1] ? matriz[x-1][y+1] : null; //bottom-right
		    checkCell(c,true,0,0);
		}
    }

    
    if(cell_n.infBy.length == 3){
        var val = null;
        cell_n.infBy.forEach(function(cell){
            var i = findPathToClockBarrier(matriz,cell,cell_n.clock);
            if(val == null) val = i;
            if(i != val) cell_n.invalid = true;
        });
    }
    return list.filter(function(item, pos, self) {
        return self.indexOf(item) == pos;
    });
}


var Cell = new Class({
    initialize: function(t, c, x, y) {
        this.type = t;
        this.clock = c;
        this.x = x;
        this.y = y;
        this.iviz = false;
        this.checked = false;
        this.nid = 'X';
        this.infBy = [];
        this.uid = (cellUidCnt++);
        this.cluster = null;
        this.invalid = false;
        this.infN = false;
    },
    printQCADes: function(x,y,fakeInput){
            res = '\n[TYPE:QCADCell]' +
            '\n[TYPE:QCADDesignObject]' +
            '\nx=' + (x + 200) + 
            '\ny=' + (y + 200) +
            '\nbSelected=FALSE' +
            '\nclr.red=65535' +
            '\nclr.green=65535' + 
            '\nclr.blue=65535' +
            '\nbounding_box.xWorld=' + (x + 191) +
            '\nbounding_box.yWorld=' + (y + 191) +
            '\nbounding_box.cxWorld=18.000000' +
            '\nbounding_box.cyWorld=18.000000' +
            '\n[#TYPE:QCADDesignObject]' + 
            '\ncell_options.cxCell=18.000000' + 
            '\ncell_options.cyCell=18.000000' +
            '\ncell_options.dot_diameter=5.000000' +
            '\ncell_options.clock=' + (fakeInput ? 0 : 1) + 
            '\ncell_options.relax=1' + 
            '\ncell_options.relax_in=1' + 
            '\ncell_options.mode=QCAD_CELL_MODE_NORMAL';
            
            if(this.type == CELL_FIXED_0 || this.type == CELL_FIXED_1){
                
                res += '\ncell_function=QCAD_CELL_FIXED';
                
            }else if(fakeInput || this.type == CELL_INPUT){
                
                res += '\ncell_function=QCAD_CELL_INPUT';
            
            }else{
                
                res += '\ncell_function=QCAD_CELL_OUTPUT';
            
            }
            
            res +=
            '\nnumber_of_dots=4' +
            '\n[TYPE:CELL_DOT]' + 
            '\nx=' + (x + 204.5) +
            '\ny=' + + (y + 195.5) +
            '\ndiameter=5.000000' + 
            '\ncharge=' + (this.type == CELL_FIXED_1 ? '1.602176e-19' : '0.0' ) + 
            '\nspin=0.0' +
            '\npotential=0.000000' +
            '\n[#TYPE:CELL_DOT]' +
            '\n[TYPE:CELL_DOT]' +
            '\nx=' + (x + 204.5) +
            '\ny=' + (y + 204.5) +
            '\ndiameter=5.000000' +
            '\ncharge=' + (this.type == CELL_FIXED_0 ? '1.602176e-19' : '0.0' ) + 
            '\nspin=0.0' +
            '\npotential=0.000000' +
            '\n[#TYPE:CELL_DOT]' +
            '\n[TYPE:CELL_DOT]' +
            '\nx=' + (x + 195.5) +
            '\ny=' + (y + 204.5) +
            '\ndiameter=5.000000' +
            '\ncharge=' + (this.type == CELL_FIXED_1 ? '1.602176e-19' : '0.0' ) + 
            '\nspin=0.000000' +
            '\npotential=0.000000' +
            '\n[#TYPE:CELL_DOT]' + 
            '\n[TYPE:CELL_DOT]' +
            '\nx=' + (x + 195.5) +
            '\ny=' + (y + 195.5) +
            '\ndiameter=5.000000' +
            '\ncharge=' + (this.type == CELL_FIXED_0 ? '1.602176e-19' : '0.0' ) + 
            '\nspin=0.000000' + 
            '\npotential=0.000000' +
            '\n[#TYPE:CELL_DOT]' + 
            '\n[TYPE:QCADLabel]' +
            '\n[TYPE:QCADStretchyObject]' +
            '\n[TYPE:QCADDesignObject]' +
            '\nx=0.00000' +
            '\ny=0.000000' +
            '\nbSelected=FALSE' +
            '\nclr.red=65535' +
            '\nclr.green=65535' +
            '\nclr.blue=0' +
            '\nbounding_box.xWorld=0.000000' +
            '\nbounding_box.yWorld=0.000000' +
            '\nbounding_box.cxWorld=41.000000' +
            '\nbounding_box.cyWorld=16.000000' +
            '\n[#TYPE:QCADDesignObject]' +
            '\n[#TYPE:QCADStretchyObject]' +
            '\npsz=' + this.uid + 
            '\n[#TYPE:QCADLabel]' +
            '\n[#TYPE:QCADCell]\n';
            
            return res;
    },
    display: function (i){
	  i = parseInt(i);
	  switch(i){
		  default:
		  case 0:
		  	return this.uid;
		  break;
		  case 1:
		  	return this.clock;
		  break;
		  
		  case 3:
		  	return this.nid;
		  break;
		  
		  case 2: //Nothing
		  case 99:
		  	if(this.type == CELL_FIXED_0)
		  		return "-1";
		  	else if(this.type == CELL_FIXED_1)
		  		return "+1";
		  	else if(this.iviz)
		  		return "!";
		    else
		  		return '';
		  break;
	  }  
    },
    check: function(){
        this.checked = true;
    },
    setNid: function(n){
        this.nid = n;   
    },
    setInverteViz: function(n){
        this.iviz = n;
    },
    setInf: function(a,force){
	    if(force) this.infBy = [];
	    if(a && this.infBy.indexOf(a) == -1){
			this.infBy.push(a);
		}
    },
    setCluster: function(a){
	    if(a){
			this.cluster = a;
		}
    },
    strHDL: function(){
	    if(this.HDL)
	    	return this.HDL;
	    var debug = false;
	    debug && console.log("-- strHDL called for:" + this.uid);
        var cell = this;
        var clk = this.clock;
        var assigns = 'ASSIGN \n\t';
       // assigns += 'next(out):=CELL' + (cell.uid) + ";\n\n\t";
        
      
        var decl_wires = 'VAR\n\t'
        var stack = [];
        var infs = [];
        while(stack.length > 0 || (cell.infBy.length && cell.clock == clk)){
	        debug && console.log("-- de-stacking for:" + cell.uid);
	        if(cell.infBy.length && cell.clock == clk){
    	        debug && console.log("-- infBy:" + cell.infBy[0].uid);
		        decl_wires += 'CELL' + (cell.uid) + ': boolean;\n\t';
		        if(cell.type == CELL_FIXED_0){
			        assigns += 'CELL' + (cell.uid) + ':=FALSE;\n\t';
		        }else if(cell.type == CELL_FIXED_1){
			        assigns += 'CELL' + (cell.uid) + ':=TRUE;\n\t';
		        }else if(cell.infBy.length == 3){ //majority gate
			        var mg_decls = [];
			        for(var i=0;i<3;i++){
				        var nCell = cell.infBy[i];
				        //mg_decls.push((nCell.iviz ? '!' : '') + ( nCell.clock == clk ?  'CELL' : 'INPUT') + nCell.uid);
				         mg_decls.push(( nCell.clock == clk ?  'CELL' : 'INPUT') + nCell.uid);
			        }
			        //assigns += 'CELL' + (cell.uid) + ':=maj(' + mg_decls.join(',') + ');\n\t';
			        
			        var a = mg_decls[0];
			        var b = mg_decls[1];
			        var c = mg_decls[2];
			        
			        assigns += 'CELL' + (cell.uid) + ':=(' + a +' & '+ b +') | (' + a +' & '+ c +') | (' + b +' & '+ c +');\n\t';
			        stack.push(cell.infBy[1]);
			        stack.push(cell.infBy[2]);
		        }else if(cell.infBy.length == 2){
			        //console.log("-- FanOut for:" + cell.uid);
			        stack.push(cell.infBy[1]);
			    }else{
		            assigns += 'CELL' + (cell.uid) + ':=' + (cell.iviz ? '!' : '') + ( cell.infBy[0].clock == clk && cell.infBy[0].type !=  CELL_INPUT  ?  'CELL' : 'INPUT') + cell.infBy[0].uid+';\n\t';
	            }
				
				cell = cell.infBy[0];
			}else{
				debug && console.log("-- --infsby:" + cell.uid);
				infs.push(cell);
				cell = stack.shift();
			}
        }
        infs.push(cell);
        var ins = [];
        for(var i=0;i<infs.length;i++){
	        var c = infs[i];
	        assigns += 'next(INPUT' + (c.uid) + '):=' + (c.iviz ? '!in' : 'in') + i + ";\n\t";
			ins.push("in" + i);
            decl_wires += 'INPUT' + (c.uid) + ': boolean;\n\t';
        }
        var HDL = 'MODULE cell' + this.uid + '('+ ins.join(",") +')\n';
        HDL += decl_wires;
        HDL += '\n';
        HDL += assigns;

        
        var ret = [{uid:this.uid,HDL:HDL,inf:infs}];
        
        this.HDL = ret; //caching
        
        for(var i=0;i<infs.length;i++){
	        var c = infs[i];
	        if(c.infBy.length){
	        	ret = ret.concat(c.strHDL());
	        }
	    }
	    this.HDL = ret;
        return ret;
    }
    
});


function analisaMatriz(matriz,cells,inputs,outputs){
    var Neighbors = [];
    var NeighborsInfs = [];
    for(var i in outputs){
        var coords = outputs[i];
        var cell = matriz[coords.x][coords.y];
        Neighbors.push(cell);              
    }
    var neighborhood_id = 0;
    while(Neighbors.length){
        var cell = Neighbors.pop();
		var clock = cell.clock;
        if(cell.nid == 'X'){
					cell.setNid(neighborhood_id++);
					//cell.check();
	    }
	    if (NeighborsInfs[cell.nid] == undefined){
			NeighborsInfs[cell.nid] = recCheckMat(matriz,cell,clock,cell.nid);
	        Neighbors =  Neighbors.concat(NeighborsInfs[cell.nid]);
        }
    }
    
    
	var stack = []; //Cells that need to be rechecked.
    for(var j in cells){
	    var cell = cells[j];
	    if(cell.type == CELL_INPUT || cell.type == CELL_FIXED_0 || cell.type == CELL_FIXED_1) continue;
	    if(cell.type == 0 && !cell.infBy.length){
		    stack.push([false, cell]);
		    //console.log(">>> >>>", cell.uid);
        }else if(cell.infBy.length != 1 && cell.infBy.length != 3){ //Recheck ambiguos paths
            stack.push([true, cell]);
            //console.log(">>> >>>", cell.uid, cell.infBy.length);
            cell.infBy.forEach(function(c){
	            stack.push([true, c]);
            });
	    }else if(!hasPathToInput(cell)){
    	    //if(cell.uid != 56)
    	    //console.log(">>>", cell.uid);
    	    stack.push([true, cell]);
        }
    }
    //console.log(stack);
 //   process.exit(1);
    while(stack.length){
	    	var pop = stack.pop();
	    	//console.log(pop);
	    	var cell = pop[1];
	    	cell.visited3 = true;
	    	var isShortCircuit = pop[0];
	    	var r_ = findPathToInput(matriz,cell,isShortCircuit);
	    	var c_ = r_[1];
	    	/*if(c_ && !hasPathToInput(c_)){
		    	console.log("&&&",cell.uid, ">", c_.uid);
		    	stack.push([pop[0],c_]);
		    }*/
		    cell.setInf(c_,true);
		    cell.setInverteViz(r_[0]);
		    //cell.visited = true;
/*
		    if(!hasPathToInput(cell)){
    	        stack.push([true, cell]);
            }
*/
		    
		    //preventing dead-lock
/*
		    if(c_.type == 0 && !c_.infBy.length){
		    	stack.push([isShortCircuit,c_]);
		    }
*/
    }
    
    for(var j in cells){
	    var cell = cells[j];
	    if(!hasPathToInput(cell)){
    	    console.log("no path in", cell.uid);
        }   
    }
    
    return NeighborsInfs;
}
function findPathToClockBarrier(matriz,cell_n,clock,dynamic_res){
    
    if(!cell_n) return 99999;
    
    if(!dynamic_res) dynamic_res = [];
    
    if(cell_n.clock != clock) return 0;
    
    var x = cell_n.x;
	var y = cell_n.y;
	var c;
    var i = 99999;
    var j;
    
    if(dynamic_res[x] && dynamic_res[x][y]) return dynamic_res[x][y];
    
    if(!dynamic_res[x]) dynamic_res[x] = [];
    dynamic_res[x][y] = 99999;
    
    c = matriz[x] ? matriz[x][y+1] : null; //right
    j = findPathToClockBarrier(matriz,c,clock,dynamic_res);
    if(j < i) i = j;
    
    c =  matriz[x] ? matriz[x][y-1] : null; //left
    j = findPathToClockBarrier(matriz,c,clock,dynamic_res);
    if(j < i) i = j;
       
    c = matriz[x+1] ? matriz[x+1][y] : null; //up
    j = findPathToClockBarrier(matriz,c,clock,dynamic_res);
    if(j < i) i = j;
        
    c = matriz[x-1] ? matriz[x-1][y] : null; //down
    j = findPathToClockBarrier(matriz,c,clock,dynamic_res);
    if(j < i) i = j;
    
    c = matriz[x+1] ? matriz[x+1][y+1] : null; //top-right
    j = findPathToClockBarrier(matriz,c,clock,dynamic_res);
    if(j < i) i = j;
    
	c = matriz[x+1] ? matriz[x+1][y-1] : null; //top-left
	j = findPathToClockBarrier(matriz,c,clock,dynamic_res);
    if(j < i) i = j;
    
	c = matriz[x-1] ? matriz[x-1][y-1] : null; //bottom-left
	j = findPathToClockBarrier(matriz,c,clock,dynamic_res);
    if(j < i) i = j;
    
	c = matriz[x-1] ? matriz[x-1][y+1] : null; //bottom-right
	j = findPathToClockBarrier(matriz,c,clock,dynamic_res);
    if(j < i) i = j;
    dynamic_res[x][y] = i + 1;
    return i + 1;
}

function hasPathToInput(cell_n){
    if(cell_n.type == CELL_INPUT || cell_n.type == CELL_FIXED_0 || cell_n.type == CELL_FIXED_1)
        return true;
    var hasPath = false;
    //console.log("-->", cell_n.uid);
    
   
    cell_n.visited2 = true;
    cell_n.infBy.forEach(function (cell){
        if(!hasPath && !cell.visited2 && hasPathToInput(cell))
            hasPath = true;
    });
    cell_n.visited2 = false;
    delete cell_n.visited2;
    return hasPath;
}


function findPathToInput(matriz,cell_n,shortCircuit,cnt){
	var x = cell_n.x;
	var y = cell_n.y;
	var clock = cell_n.clock;
	var prev_clock = cell_n.clock ? cell_n.clock - 1 : 3;
	var c,cup,cdown,dleft,cright;
    var i = false;
    
    var debug = false;

	function recPath(cell,offset_x,offset_y){
		if(!cell) return false;
		//console.log("called on", cell.uid);
		if(cell.visited) {
			 //console.log("falsed here");
			 return false;
		}
		var shouldContinue = true;
        if(!shortCircuit){
            if(cell.infBy.length > 1){
        		cell.infBy.forEach(function (cell_i){
            		if(debug) console.log("where", cell_i.uid);
            		if(cell_i.uid == cell_n.uid){
                		shouldContinue = false;
            		}
        		});
    		}
        }

		if(!shouldContinue){
    		if(debug) console.log("--out");
		    return false;
		    
        }
		
		//if(offset_x != 0 || offset_y != 0){
			    if(cell_n.type == CELL_CROSSOVER && cell.type != CELL_CROSSOVER && cell.type != CELL_VERTICAL){
				   // console.log("-- jump")
				    return false;
			    }
			    
			    if(cell_n.type != CELL_CROSSOVER && cell_n.type != CELL_VERTICAL  && cell.type == CELL_CROSSOVER){
				   // console.log("-- skip")
				   if(offset_x != 0 || offset_y != 0){
				    	var n_cell = matriz[x+offset_x] ? matriz[x+offset_x][y+offset_y] : null;
						return recPath(n_cell,0,0);
				   } else {
						return false;
				   }
			    }
		//    }
		
		cell_n.visited = true;
		if(cell.type == CELL_INPUT || cell.type == CELL_FIXED_0 || cell.type == CELL_FIXED_1){
			delete cell_n.visited;
			return cell;	
		}else
		if(cell.clock == clock || cell.clock == prev_clock){
			cell.visited = true; //prevents deadlock
			var _r = findPathToInput(matriz,cell,shortCircuit,cnt+1);
			var _c = _r[1];
			delete cell_n.visited;
			delete cell.visited;
			if(_c){
				return cell;
			}
		}
		delete cell_n.visited;
		//console.log("/recPath",cell ? cell.uid : null);
		return false;
	}

    cright = matriz[x] ? matriz[x][y+1] : null; //right
    i = recPath(cright,0,2);
	if(i)
		return [false,i];
   
    cleft =  matriz[x] ? matriz[x][y-1] : null; //left
    i = recPath(cleft,0,-2);
	if(i)
		return [false,i];
        
    cup = matriz[x+1] ? matriz[x+1][y] : null; //up
    i = recPath(cup,2,0);
	if(i)
		return [false,i];
    
        
    cdown = matriz[x-1] ? matriz[x-1][y] : null; //down
    i = recPath(cdown,-2,0);
	if(i)
		return [false,i];
	
	if(!cup && !cright){
	    c = matriz[x+1] ? matriz[x+1][y+1] : null; //top-right
	    i = recPath(c,0,0);
		if(i)
			return [true,i];
	}
		
	c = matriz[x+1] ? matriz[x+1][y-1] : null; //top-left
	i = recPath(c,0,0);
	if(i)
		return [true,i];

	c = matriz[x-1] ? matriz[x-1][y-1] : null; //bottom-left
	i = recPath(c,0,0);
	if(i)
		return [true,i];

	c = matriz[x-1] ? matriz[x-1][y+1] : null; //bottom-right
	i = recPath(c,0,0);
	if(i)
		return [true,i];
		
	//console.log("no path found on", cell_n.uid);
	return [false,false];
	
}

function fill(n, p, c) {
    var pad_char = typeof c !== 'undefined' ? c : '0';
    var pad = new Array(1 + p).join(pad_char);
    return (pad + n).slice(-pad.length);
}

function printSmv(CellMatrix,Nid,Nids){
    var header = "MODULE main\n";
    var decl = "VAR\n";
    var init = "ASSIGN\n";
    var next = "";
    var spec = "";
    var gspec = [];
    var cellL = [];
    var specs = 0;
    
    var x = 0;
    var y = 0;
    
    var recId = {};
    
    for(var c in Nids[Nid]){
        var cell = Nids[Nid][c];
        /*if(cell.type == CELL_FIXED_0){
            decl += "\tCELL" + cell.uid + ": {0,1,2};\n";
        }else if(cell.type == CELL_FIXED_1){
            decl += "\tCELL" + cell.uid + ": {0,1,2};\n";
        }else{*/
            decl += "\tCELL" + cell.uid + ": {0};\n";
        //}
        recId[cell.uid] = true;
    }
    
    var res = '';   
    for(var xa in CellMatrix){
        var x = parseInt(xa);
        var linha = '';
        for(var ya in CellMatrix[x]){
            var y = parseInt(ya);
            var cell = CellMatrix[x][y];
            if(!cell || cell.nid != Nid){
                continue;
            }
            
            var cells = [];
            var icells = [];
                        
            var n_cell = CellMatrix[x-1][y];
            if(n_cell && (n_cell.nid == Nid || recId[n_cell.uid])){
                cells.push(n_cell.uid);
            }
            
            n_cell = CellMatrix[x+1][y];
            if(n_cell && (n_cell.nid == Nid || recId[n_cell.uid])){
                cells.push(n_cell.uid);
            }
            
            n_cell = CellMatrix[x][y-1];
            if(n_cell && (n_cell.nid == Nid || recId[n_cell.uid])){
                cells.push(n_cell.uid);
            }
            
            n_cell = CellMatrix[x][y+1];
            if(n_cell && (n_cell.nid == Nid || recId[n_cell.uid])){
                cells.push(n_cell.uid);
            }
            
            n_cell = CellMatrix[x-1][y-1];
            if(n_cell && !CellMatrix[x-1][y] && !CellMatrix[x][y-1] && (n_cell.nid == Nid || recId[n_cell.uid])){
                icells.push(n_cell.uid);
            }
            
            n_cell = CellMatrix[x+1][y-1];
            if(n_cell && !CellMatrix[x+1][y] && !CellMatrix[x][y-1] && (n_cell.nid == Nid || recId[n_cell.uid])){
                icells.push(n_cell.uid);
            }
            
            n_cell = CellMatrix[x-1][y+1];
            if(n_cell && !CellMatrix[x-1][y] && !CellMatrix[x][y+1] && (n_cell.nid == Nid || recId[n_cell.uid])){
                icells.push(n_cell.uid);
            }
            
            n_cell = CellMatrix[x+1][y+1];
            if(n_cell && !CellMatrix[x+1][y] && !CellMatrix[x][y+1] && (n_cell.nid == Nid || recId[n_cell.uid])){
                icells.push(n_cell.uid);
            }
            
            //spec += "SPEC AF CELL" +  cell.uid + " != 0;\n";
            //spec += "LTLSPEC G F next(CELL" +  cell.uid + ") = CELL" +  cell.uid + ";\n";
            
            //spec += "SPEC AG ( CELL" +  cell.uid + " != 0 -> AX (CELL" +  cell.uid + " = 0 -> AX CELL" +  cell.uid + " != 0) );\n";
            
            //spec += "SPEC AG (CELL" +  cell.uid + " = 1 -> AX AX AG CELL" +  cell.uid + " != 1)\n";
            //spec += "LTLSPEC G (CELL" +  cell.uid + " = 1 -> X F CELL" +  cell.uid + " != 1)\n";
            specs++;
            
            next += "\tnext(CELL" + cell.uid + ") := case\n\t\t";
            var j = [];
            var s = [];
            var n = [];
            
            for(var i in cells){
                j.push("CELL" + cells[i]);
                //s.push("CELL" + cells[i] + " = 4");
                //s.push("CELL" + cells[i]);
            }
            
            for(var i in icells){
	            j.push("CELL" + icells[i]);
                //n.push("CELL" + icells[i] + " = 3");
            }
            
            /*
next+= "(FLAG & CELL" + cell.uid + " = 1): 1;\n\t\t";
            next+= "(!FLAG & CELL" + cell.uid + " = 1): 0;\n\t\t";
            next+= "(!FLAG & CELL" + cell.uid + " = 3): 1;\n\t\t";
                
            if(cells.length && icells.length){
                next+= "(FLAG & CELL" + cell.uid + " = 2) & (" + j.join(" | ") + ") : 0;\n\t\t";
                next+= "(FLAG & CELL" + cell.uid + " = 2) : 3;\n\t\t";
            }
*/
            spec += "LTLSPEC G F ((CELL" + cell.uid + " = " + j.join(" + 1) | (CELL" + cell.uid + " = ") + " + 1)) \n"
            
            if(cell.infN){ 
                gspec.push("CELL" + cell.uid);   
            }else{
                cellL.push("CELL" + cell.uid);
            }
            
            j.push("CELL" + cell.uid);
            
            while(j.length > 1){
	            var c = j.shift();
            	next+= "(" + c + " < " + j.join(" | " + c + " < ") + ") : " + c + " + 1;\n\t\t";
			}
            
            /*
if(icells.length){
                
                next+= "(!FLAG) & (" + n.join(" | ") + ") : 2;\n\t\t";
                
                
                
                decl += "\tCELL" + cell.uid + ": {0,1,2,3};\n";
                
                
            }else{
                
                decl += "\tCELL" + cell.uid + ": {0,1,3,4};\n";
                
            }
*/
            
            if(recId[cell.uid]){
                
            }
            
            decl += "\tCELL" + cell.uid + ": 0..9;\n";
            
            init += "\tinit(CELL" + cell.uid + ") := " + (cell.type == CELL_INPUT ? "0" : "9") + ";\n";
            
            next+= "TRUE: CELL" + cell.uid + ";\n\tesac;\n";
            
            
            
        }
    }
    
    
    var cellS = [];
    gspec.forEach(function(a){
        var cellS2 = [];
        cellL.forEach(function(b){
            cellS2.push( a + " > " + b );
        }); 
        cellS.push("(" + cellS2.join(" & ") + ")");
    });
    
    spec += "LTLSPEC G F (" + cellS.join(" | ") + ")\n";
    
    if(specs){
        return header + decl + init + next + spec;
    }else{
        return false;
    }
    
}

function printNeighborhood(CellMatrix,Nid,Nids){
    var debug = (Nid == 26);
    
    var x = 0;
    var y = 0;
    
    var min_x = -1;
    var min_y = -1;
    
    var max_x = -1;
    var max_y = -1;
    
    var res = '';   
    for(var xa in CellMatrix){
        var x = parseInt(xa);
        var linha = '';
        for(var ya in CellMatrix[x]){
            var y = parseInt(ya);
            var cell = CellMatrix[x][y];
            if(!cell || cell.nid != Nid){
                continue;
            }
            
            if(min_x == -1){
                min_x = x;
                min_y = y;
            }
            if(x > max_x){
                max_x = x;
            }
            if(y > max_y){
                max_y = y;
            }
            
            var sx = 20*(x-min_x);
            var sy = 20*(y-min_y);
            res += cell.printQCADes(sx,sy,false);      
            debug && console.log("cell ",cell.uid,x,y);
        }
    }
    
    debug && console.log("max",max_x,max_y);
    
    debug && console.log("min",min_x,min_y);
    
    if(max_x - min_x == 0 || max_y - min_y == 0){
        
        return false;
        
    }
    
    for(var c in Nids[Nid]){
        var cell = Nids[Nid][c];
        var sx = 20*(cell.x-min_x);
        var sy = 20*(cell.y-min_y);
        res += cell.printQCADes(sx,sy,true);
    }
    
    debug && console.log("res",res);
    
    return res;
    
}

function printCircuit(CellMatrix){
	console.log("-- Representing Circuit:");
    var x = 0;
    var y = 0;
    var t = 0;
    for(var x in CellMatrix){
        var linha = '';
        for(var y in CellMatrix[x]){
            var cell = CellMatrix[x][y];
            if (cell){
	            if(cell.infBy.length <= 1){
                	linha += cell.type + '_' + cell.clock + "_" + fill(cell.uid,3) + '_' + (cell.infBy.length ? fill(cell.infBy[0].uid,3) : 'XXX' ) + " ";
                }else{
	                linha += cell.type + '_' + cell.clock + "_" + fill(cell.uid,3) + '_MUL ';
                }
                t++;
            }else{
                linha += "*********** ";
            }
            
        }
            console.log("-- " + linha);
    }
    console.log("-- Total cells: " + t);
}