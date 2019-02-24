fs = require('fs');
Class = require("Class");
include = require("./include.js");

include("qca.js");


var fName = process.argv[2];

var size = 0;

var CellMatrix = [];

var cells = [];

var inputs = [];
var outputs = [];

var cellUidCnt = 0;

fs.readFile(fName, function (err, data) {
    a = data.toString().split("\n");
    for(x in a){
	if(a[x].length == 0)
		continue;
        c = a[x].split(/\s/);
        if(!size)
            size = c.length;
        line = [];
        for(y in c){
            var val = parseInt(c[y]);
            if(val < 0)
                line.push(null);
            else{
                var cell = new Cell(Math.floor(val/10),val % 10,parseInt(x),parseInt(y));
                cells.push(cell);
                if(cell.type == CELL_INPUT)
                    inputs.push({x:x,y:y});
                if(cell.type == CELL_OUTPUT)
                    outputs.push({x:x,y:y});
                line.push(cell);
            }
                
        }
        CellMatrix.push(line);
    }
    analisaMatriz(CellMatrix,cells,inputs,outputs);
    printCircuit(CellMatrix);

    
    var HDL = 'MODULE main\n';
    
    var VAR = 'VAR\n\t'
    var d_VAR = [];
    
    var modules = '';//'MODULE maj(a,b,c)\nVAR\n\tout : boolean;\nASSIGN\n\tout := (a & b) | (a & c) | (b & c);\n\n'
    
    var checker = [];
    
    for(i in outputs){
        var coords = outputs[i];
        var cell = CellMatrix[coords.x][coords.y];
        
        console.log("-- Processing output:" + cell.uid);
        var blocks =  cell.strHDL();
        console.log("-- done");
        
        for(var j in blocks){
	        var c = blocks[j];
	        if(checker[c.uid]) 
	        	continue;
	        checker[c.uid] = true;
	        if(c.inf.length){
		        var args = [];
		        for(var i=0;i<c.inf.length;i++){
			        if(c.inf[i].infBy.length){
			        	args.push("Mcell" + (c.inf[i].uid) + ".CELL" + (c.inf[i].uid));
			        }else{
				        if(c.inf[i].type == CELL_INPUT){
					        if(!d_VAR[c.inf[i].uid]){
						        d_VAR[c.inf[i].uid] = true;
					        	VAR += 'in' + c.inf[i].uid + ": boolean;\n\t";
					        }
					        args.push('in' + c.inf[i].uid);
				        }else if(c.inf[i].type == CELL_FIXED_0){
					        args.push('FALSE');
				        }else if(c.inf[i].type == CELL_FIXED_1){
					        args.push('TRUE');
				        }
			        }
		        }
		       	VAR += 'Mcell' + c.uid + ': cell' + c.uid + "(" + args.join(",") + ");\n\t";
	        }/*
else{
		        VAR += 'in' + c.uid + ": boolean;\n\tMcell" + c.uid + ': cell' + c.uid + "(in" + c.uid + ")\n\t";
	        }
*/

            modules += c.HDL + "\n";
        }
        
    }
    
        HDL += VAR;
        HDL += "\n";
        HDL += modules;
        
        console.log(HDL);
    
    
});
