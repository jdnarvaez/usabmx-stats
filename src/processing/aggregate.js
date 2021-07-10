const fs = require('fs');
const path = require('path');

const Papa = require('papaparse');
const XLSX = require('xlsx');

var workbook = XLSX.readFile(path.join(process.cwd(), 'data', 'Women_Pro_Stats_gmo.xlsx'));

console.log(workbook.Sheets);



// Papa.parse(bigFile, {
// 	worker: true,
// 	step: function(results) {
// 		console.log("Row:", results.data);
// 	}
// });
