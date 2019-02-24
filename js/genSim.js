// CONFIG
// Please set the paths below to the correct pointers

var QCA_DESIGNER = ''; // Should point to your local folder containing all QCADesigner code
var NUSMV = ''; // Should point to NuSMV binary

//

fs = require('fs');
Class = require("Class");
include = require("./include.js");
Simparser = require("./Simparser.js");

eval(fs.readFileSync("./qca.js")+'');

eval(fs.readFileSync("./SimTable.js")+'');

var fName = process.argv[2];

var size = 0;

var CellMatrix = [];

var cells = [];

var inputs = [];
var fixed_1 = [];
var fixed_0 = [];
var outputs = [];

var cellUidCnt = 0;

var spawn = require('child_process').spawn;

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
                if(cell.type == CELL_INPUT){
                    inputs.push({cell: cell, x:x,y:y});
                }else if(cell.type == CELL_OUTPUT){
                    outputs.push({cell: cell, x:x,y:y});
                }else if(cell.type == CELL_FIXED_0){
                    fixed_0.push({cell: cell, x:x,y:y});
                }else if(cell.type == CELL_FIXED_1){
                    fixed_1.push({cell: cell, x:x,y:y});
                }
                line.push(cell);
            }
                
        }
        CellMatrix.push(line);
    } 
    var y = analisaMatriz(CellMatrix,cells,inputs,outputs);
    fs.readFile("header", function (err, header) {
        if(err) console.log(err);
        header = header.toString();
        fs.readFile("footer", function (err, footer) {
            if(err) console.log(err);
            var resume = '';
            var Stables = {};
            var Ntable = {};
            var fNames = [];
            var remainingSims = 0;
            for(var i in y){
                var g = i;
                var k = printNeighborhood(CellMatrix,g,y);               
                var a = [];
                var line = '';
                var mode = SIMTABLE_REGULAR;
                Ntable[g] = {depends: [], depends_internal:[]};
                if(k){
                    var res = header.toString() + k + footer.toString();
                    (function() {
                        remainingSims++;
                        var fName = g + '.qca';
                        fNames.push({i: g, file: fName});
                        
                        var smv = printSmv(CellMatrix,g,y);
                        
                        if(false && smv){
                            (function() {
                                var smvName = g + '.smv';
                                fs.writeFile(smvName, smv, function (err) {
                                    if (err) return console.log(err);
                                    console.log("Written file", smvName);
                                    
                                    var ver = spawn(NUSMV,
                                                    [smvName]);
                                    var content = "";
                                    ver.stdout.on("data", function(data){
                                        content += data;
                                    });
                                    
                                    ver.on('exit', function (code) {
                                        fs.writeFile(smvName + ".results", content, function (err) {
                                             if (err) return console.log(err);
                                               console.log("Written results", smvName); 
                                        });
                                    });
                                    
                                });
                            })();
                        }
                        fs.writeFile(g + '.qca', res, function (err) {
                            if (err) return console.log(err);
                            var sim    = spawn(QCA_PATH + '/src/batch_sim', 
                                            ['-f', fName,
                                             '-e', "COHERENCE_VECTOR",
                                             '-o', QCA_PATH + '/src/simulation.qcasettings',
                                             '-n', '1',
                                             '-t', '0'
                                            ]);
                            sim.on('exit', function (code) {
                                remainingSims--;
                                console.log(fName + ':: child process exited with code ' + code);
                                if(remainingSims == 0){
                                    remainingSims = fNames.length;
                                    for(var i in fNames){
                                        (function() {
                                            var f = fNames[i];
                                            Simparser(f.file + ".results", function(simtable){
                                                remainingSims--;                                                                                                     
                                                Stables[f.i].setSimTable(simtable);
                                                console.log(f.file + ':: parsed');
                                                if(remainingSims == 0){
                                                    console.log("finished parsing results");
                                                    var a = {};
                                                    var smvMain = "MODULE main\nVAR\n";
                                                    for(var io in fixed_0){
                                                        var cell = fixed_0[io].cell;
                                                        a[cell.uid]=0;
                                                        smvMain += "\tCELL" + cell.uid + ": {0};\n";
                                                    }
                                                    for(var io in fixed_1){
                                                        var cell = fixed_1[io].cell;
                                                        a[cell.uid]=1;
                                                        smvMain += "\tCELL" + cell.uid + ": {1};\n";
                                                    }
                                                    for(var io in inputs){
                                                        var cell = inputs[io].cell;
                                                        smvMain += "\tCELL" + cell.uid + ": {0,1};\n";
                                                    }
                                                    for(var nid in y){
	                                                	smvMain += "\tNID" + nid + ": BLOCK" + nid +"(";                                                   
	                                                	var K = {};
	                                                	for (var cell in cells) {
		                                                	var c = cells[cell];
		                                                	if(c.nid == nid && (c.type == CELL_FIXED_0 || c.type == CELL_FIXED_1 || c.type == CELL_INPUT)) {
		                                                		K[c.uid] = "CELL" + c.uid;
		                                                	}
	                                                	}
	                                                	y[nid].forEach(function(k){
		                                                	if(k.type != CELL_FIXED_0 && k.type != CELL_FIXED_1){
		                                                		K[k.uid] = "NID" + k.nid + ".CELL" + k.uid;
		                                                	}
	                                                	});
	                                                	var KK = [];
	                                                	for (var i in K){
		                                                	KK.push(K[i]);
	                                                	}
	                                                	smvMain += KK.join(",");
	                                                	smvMain += ");\n"
                                                    }
                                                    fs.writeFileSync("main.smv", smvMain);
                                                    for(var ii=0;ii<Math.pow(2,inputs.length);ii++){
                                                        var jj = 1;
                                                        for(var io in inputs){
                                                            var cell = inputs[io].cell;
                                                            a[cell.uid] = (jj & ii) > 0 ? 1 : 0;
                                                            jj <<= 1;
                                                        }
                                                        console.log(a);
                                                        for(var oo in outputs){
                                                            var cell = outputs[oo].cell;
                                                            var res = Stables[cell.nid].getValFor(a,cell.uid);
                                                            console.log(a,"-> CELL", cell.uid ,"=",res);
                                                        }
                                                    }
                                                }
                                            });
                                        })()
                                    }
                                }
                            });
                        });
                    })();
                    line +=  g + " <- ";
                }else{
	                {
		                var cc = cells.filter(function(c){
			               return c.nid == g; 
		                });
		                var smv = "MODULE BLOCK"+ g + "(";
	                	var K = [];
	                	y[g].forEach(function(k){
		                	K.push("CELL" + k.uid);
	                    });
	                    smv += K.join(",") + ") --line\nVAR\n";
	                    var assign = "";
		                cc.forEach(function(c) {
			                smv += "\tCELL" + c.uid + ": {-1,0,1};\n";
			                assign += "\tinit(CELL" + c.uid + ") := -1;\n\tnext(CELL" + c.uid + ") := " + K.join(",") + ";\n";
		                });
		                smv += "\nASSIGN\n" + assign;
		                fs.writeFileSync("BLOCK" + g + ".smv", smv);
	                }
	                 
                    line +=  g + " -- ";
                    mode = SIMTABLE_LINE;
                }
                if(y[g].length == 0){
	                var smv = "MODULE BLOCK"+ g + "(";
                    line +=  "INPUT\n";
                    mode = SIMTABLE_INPUT;
                    var rInputs = inputs.filter(function(e){
                        return e.cell.nid == g;
                    });
                    var rFixed0 = fixed_0.filter(function(e){
                        return e.cell.nid == g;
                    });
                    var rFixed1 = fixed_1.filter(function(e){
                        return e.cell.nid == g;
                    });
                    var K = {};
                    rInputs.forEach(function(a){
                        var cell = a.cell;
                        K[cell.uid] = "CELL" + cell.uid;
                        Ntable[g].depends_internal.push({nid:cell.nid,uid:cell.uid});
                        console.log("added internal in", cell.nid);
                    });
                    rFixed0.forEach(function(a){
                        var cell = a.cell;
                        K[cell.uid] = "CELL" + cell.uid;
                    });
                    rFixed1.forEach(function(a){
                        var cell = a.cell;
                        K[cell.uid] = "CELL" + cell.uid;
                    });
                    var KK = [];
                    var var_ = "";
                    var assign_ = "";
                    for (var i in K){
	                    KK.push(K[i] + "_V");
	                    var_ += "\t" + K[i] + ": {-1,0,1};\n";
	                    assign_ += "\tinit(" + K[i] + ") := -1;\n\tnext(" + K[i] + ") := " + K[i] + "_V;\n";
                    }
                    smv += KK.join(",") + ") --INPUT\nVAR\n" + var_ + "ASSIGN\n" + assign_; 
                    fs.writeFileSync("BLOCK" + g + ".smv", smv);
                    
                }else{
                    for(var j in y[g]){
                        var c_ = y[g][j];
                        if(c_.type != CELL_FIXED_0 &&  c_.type != CELL_FIXED_1){
                            Ntable[g].depends.push({nid:c_.nid,uid:c_.uid});
                            a.push("" + c_.nid + "(" + c_.uid +")");
                        }
                    }
                    line += a.join(",") + "\n"; 
                }
                resume += line;
                //console.log(line);
                Stables[g] = new SimTable(g,Ntable,null,mode);
            }
            console.log(remainingSims + " sims generated.");
            //console.log(Stables);
            fs.writeFile('resume.map', resume, function (err) {
                        if (err) return console.log(err);
                });
            
        });
    });
    
    
});
