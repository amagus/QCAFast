fs = require('fs');

module.exports = function(fName,env){
    fs.readFile(fName, function (err, data) {
        if(err) throw err;
        (1,eval)(data.toString());
    });
}