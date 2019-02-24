var z = parseInt(process.argv[2]);

var linha0 = "-1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 "
var linha1 = "-1 01 01 01 -1 -1 02 02 02 -1 -1 03 03 03 -1 -1 00 00 00 -1 "
var linha2 = "-1 01 -1 01 -1 -1 02 -1 02 -1 -1 03 -1 03 -1 -1 00 -1 00 -1 "
var linha3 = "01 01 -1 01 01 02 02 -1 02 02 03 03 -1 03 03 00 00 -1 00 00 "
var linha4 = "-1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 "

var out0 = "-1 ";
var out1 = "-1 ";
var out2 = "-1 ";
var out3 = "10 ";
var out4 = "-1 ";

for (var i = 0; i<z; i++){
	out0 += linha0;
	out1 += linha1;
	out2 += linha2;
	out3 += linha3;
	out4 += linha4;
}

out0 += "-1";
out1 += "-1";
out2 += "-1";
out3 += "21";
out4 += "-1";

console.log(out0);
console.log(out1);
console.log(out2);
console.log(out3);
console.log(out4);