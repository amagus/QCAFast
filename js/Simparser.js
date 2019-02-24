var UNK = 0;
var INC = 1;
var DEC = 2;

module.exports = function(fName,cb){
    console.log("called for", fName);
    fSmv = fName + ".smv";
    fs.readFile(fName, function (err, data) {
        var a = data.toString().split("[TRACE]");
        a.shift(); //discard header
        var clocks = {};
        var cells = {};
        for(var i in a){
            var token = a[i];
            var found = token.match(/data_labels=([a-zA-Z0-9 ]+)/);
            var cellfun = token.match(/trace_function=([0-9]+)/);
            cellfun = cellfun[1];
            var varName = found[1];
            var trace_data = token.split('\[TRACE_DATA\]');
            trace_data = trace_data[1].split('\[#TRACE_DATA\]').shift();
            var vals = trace_data.split(/[\s]+/);
            vals.pop(); //removing last invalid value
            if(varName.lastIndexOf("CLOCK") != 0){
                cells[varName] = {name: varName, f:cellfun,  readings: [], vals:vals};
                continue;
            }
            var obj = {name:varName,posedge:[],negedge:[]};
            var status = INC;
            var lastVal = 0.0;
            for(var j in vals){
                var val = parseFloat(vals[j]);
                if(status == INC && val < lastVal){
                    obj.negedge.push(j);
                    status = DEC;
                }else if(status == DEC && val > lastVal){
                    obj.posedge.push(j);
                    status = INC;
                }
                lastVal = val;
            }
            clocks[varName] = obj;
        }
        for(var r in clocks['CLOCK 1'].posedge){
            var st = clocks['CLOCK 1'].posedge[r];
            for(var c in cells){
                var cell = cells[c];
                var reading = parseFloat(cell.vals[st]) > 0 ? 1 : 0;
                cell.readings.push(reading);
            }
        }
        var depends = [];
      //  var ndepends = [];
        for(var c in cells){
                var cell = cells[c];
                if(cell.f == "1"){
                    depends.push(cell);
                   // ndepends.push({nid:1,uid:cell.name});
                }
                delete cell.vals;
        }
        
        var smv = "MODULE BLOCK" + fName.substring(0,fName.indexOf(".")) + "(";
        skip = {};
        arr = [];
        for(var c in depends){
	        var cc = depends[c];
	    	arr.push("CELL" + cc.name);
	    	skip[cc.name] = true;
	    }
        smv += arr.join(",") + ")\nVAR\n";
        var assign = "";
        for(var c in cells){
	        var cell = cells[c];
	        if(skip[cell.name]) continue;
        	smv += "\tCELL" + cell.name +": {-1,0,1};\n";
        	assign += "\tinit(CELL" + cell.name +") := -1;\n";
        }
        smv += "\nASSIGN\n" + assign + "\n\n";
        
        
        //fs.writeFileSync("BLOCK" + fName.substring(0,fName.indexOf(".")) + ".smv", smv);
        
        
        var simtable = {};
        console.log(fName, depends);
        for(var i in depends[0].readings){
            var st = simtable;
            for(var c in depends){
                var cell = depends[c];
                if(!st[cell.readings[i]]){
                    st[cell.readings[i]] = {};
                }
                st = st[cell.readings[i]];
            }
            for(var c in cells){
                var cell = cells[c];
                st[cell.name] = cell.readings[i];
            }
        }
        for(var c in cells){
	        var cell = cells[c];
	        if(skip[cell.name]) continue;
	        smv += "\tnext(CELL" + cell.name +") := case\n\t\tTRUE";
	        for(var ii=0;ii<Math.pow(2,depends.length);ii++){
	            var jj = 1;
	            var a = {};
	            var st = simtable; 
	            for(var io in depends){
	                var cell2 = depends[io].name;
	                smv += " & CELL" + cell2 + ((jj & ii) > 0 ? " = 1" : " = 0");
	                st = st[((jj & ii) > 0 ? "1" : "0")];
	                jj <<= 1;
	            }
	            smv += ": " + st[cell.name] + ";\n\t\tTRUE";
	        }
	        smv += ": CELL" + cell.name + ";\n\tesac;\n"
        }
        
        fs.writeFileSync("BLOCK" + fName.substring(0,fName.indexOf(".")) + ".smv", smv);
        
        cb(simtable);
        /*
        var Ntable = {
            0: {depends: []},
            1: {depends: [{nid:0,uid:0}] },
            2: {depends: ndepends}
        }
        
        var Stables = [
            new SimTable(0,Ntable,null,SIMTABLE_INPUT),
            new SimTable(1,Ntable,null,SIMTABLE_LINE),
            new SimTable(2,Ntable,simtable,SIMTABLE_REGULAR)
        ]
        console.log(simtable);
        console.log(cells); 
        
        console.log(Stables[2].getValFor({0:1},"CELL70"));*/
    });
}