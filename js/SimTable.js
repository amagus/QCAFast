var SIMTABLE_REGULAR = 0;
var SIMTABLE_LINE = 1;
var SIMTABLE_INPUT = 2;
var SIMTABLE_FIXED_1 = 3;
var SIMTABLE_FIXED_0 = 4;

var SimTable = new Class({
    initialize: function(Nid,Ntable,SimTable,mode){
        this.nid = Nid;
        this.mode = mode ? mode : SIMTABLE_REGULAR;
        this.Ntable = Ntable;
        this.Ntable[Nid].SimTable = this;
        this.depends = Ntable[Nid].depends;
        this.depends_internal = Ntable[Nid].depends_internal;
        this.resTable = SimTable;
    },
    setSimTable: function(SimTable){
        this.resTable = SimTable;
    },
    getValFor: function(inputs,cellUid){
        var val = undefined;
        var resTable = this.resTable;
        for(var i in this.depends){
            var d = this.depends[i];
            var dnid = d.nid;
            var duid = d.uid;
            var dST = this.Ntable[dnid].SimTable;
            try{
            	val = dST.getValFor(inputs,duid);
            }catch(e){
	            console.log("Stack:", cellUid, this.nid);
	            throw(e);
            }
            if(this.mode == SIMTABLE_REGULAR) resTable = resTable[val];
        }
        
        switch(this.mode){
            case SIMTABLE_LINE:
                return val;
            break;
            case SIMTABLE_FIXED_1:
                return 1;
            break;
            case SIMTABLE_FIXED_0:
                return 0;
            break;
            case SIMTABLE_INPUT:
                var res = inputs[cellUid];
                if(res == undefined){
                    var base = resTable;
                    if(base == undefined){
	                    console.log(inputs);
                        throw ("ERROR:: No base restable found for cell " + cellUid + " in input context (Nid: " + this.nid + ")");
                    }
                    for(var i in this.depends_internal){
                        var d = this.depends_internal[i];
                        base = base[inputs[d.uid]];
                    }
                    if(base == undefined){
                        throw ("ERROR:: Internal dependency error for cell " + cellUid + " (Nid: " + this.nid + ")");
                    }
                    res = base[cellUid];
                    if(res == undefined){
                        throw ("ERROR:: " + cellUid + " is needed and not found in input context (Nid: " + this.nid + ")");
                    }
                }
                return res;
            break;
            case SIMTABLE_REGULAR:
                if(resTable == undefined){
                    throw ("ERROR:: SimTable is undefined. (Nid: " + this.nid + ")");
                }
                return resTable[cellUid];
            break;
        }
    }
    
});