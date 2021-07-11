const fs = require('fs');
const path = require('path');
const { v4 } = require('uuid');

const Papa = require('papaparse');
const XLSX = require('xlsx');

function careerLength(rider) {
  var start;
  var end;

  function processResult(result) {
    if (start === undefined || result.event.year < start) {
      start = result.event.year;
    }

    if (end === undefined || result.event.year > end) {
      end = result.event.year;
    }
  }

  rider.wins.forEach(processResult);
  rider.podiums.forEach(processResult);
  rider.mains.forEach(processResult);

  return end - start + 1;
}

function computeStats(rider) {
  rider.numberOfWins = rider.wins.length;
  rider.numberOfPodiums = rider.podiums.length;

  if (rider.numberOfMains !== undefined) {
    // if (rider.numberOfMains > rider.mains.length) {
    //   rider.numberOfMains = rider.numberOfMains;
    // } else {
    //   // rider.numberOfMains += rider.mains.length;
    // }
  } else {
    rider.numberOfMains = rider.mains.length;
  }

  rider.seasonsRaced = careerLength(rider);
  rider.winPercentage = ((rider.numberOfWins / rider.numberOfMains) * 100).toFixed(2);
  rider.podiumPercentage = ((rider.numberOfPodiums / rider.numberOfMains) * 100).toFixed(2);
}

// var workbook = XLSX.readFile(path.join(process.cwd(), 'data', 'Women_Pro_Stats_gmo.xlsx'));

// console.log(workbook.Sheets);

const riders = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'riders.json'), 'utf8'));

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getRider(name) {
  var rider = riders.find(r => r.name.toLowerCase() === name.toLowerCase());

  if (!rider) {
    console.log('new rider')
    rider = {
      name: `${capitalizeFirstLetter(name.split(' ')[0].toLowerCase())} ${capitalizeFirstLetter(name.split(' ')[1].toLowerCase())}`,
      podiums: [],
      wins: [],
      mains: [],
    }

    riders.push(rider);
  }

  return rider;
}

function parse(dir, file) {
  const year = parseInt(dir);
  const race = file.split('.csv')[0];
  const name = race.split('Day')[0];
  const day = race.split('Day ')[1];

  const event = {
    name,
    year,
    day
  };

  const filename = path.join(process.cwd(), 'data', 'results', dir, file);

  const csv = fs.readFileSync(filename, 'utf8');

  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      complete: function(results) {
        var found = false;

        for (var idx = 0; idx < results.data.length; idx++) {
          const row = results.data[idx];

          if (row[0].indexOf('Women Elite') > -1) {
            found = true;

            idx++;
            riderRow = results.data[idx++];

            while (riderRow[1] !== '') {
              try {
                const name = riderRow[2].split(',')[0];
                const rider = getRider(name);
                const position = parseInt(riderRow[1]);

                if (position === 1) {
                  rider.wins.push({
                    event
                  });

                  rider.podiums.push({
                    event,
                    day,
                    position
                  });

                } else if (position === 2 || position === 3) {
                  rider.podiums.push({
                    event,
                    day,
                    position
                  })
                }

                rider.mains.push({
                  event,
                  day,
                  position
                })
              } catch (error) {
                console.error('Unable to parse row')
                console.error(riderRow);
              }

              riderRow = results.data[idx++];
            }

            break;
          }
        }

        if (!found) {
          console.error(`Unable to find womens results for ${filename}`)
        }

        resolve(riders);
      }
    });
  })
}

const results = Promise.all(fs.readdirSync(path.join(process.cwd(), 'data', 'results')).map(dir => {
  return Promise.all(fs.readdirSync(path.join(process.cwd(), 'data', 'results', dir)).map(file => {
    return parse(dir, file)
  }));
}));

results.then(res => {
  riders.forEach(r => computeStats(r));
  fs.writeFileSync(path.join(process.cwd(), 'data', 'riders_2.json'), JSON.stringify(riders));
})

// console.log(riders.length)

// Papa.parse(csv, {
// 	complete: function(results) {
//     for (var idx = 0; idx < results.data.length; idx++) {
//       const row = results.data[idx];
//
//       if (row[0].indexOf('Women Elite') > -1) {
//         idx++;
//         riderRow = results.data[idx++];
//
//         while (riderRow[1] !== '') {
//           const name = riderRow[2].split(',')[0];
//           const rider = getRider(name);
//           const position = parseInt(riderRow[1]);
//
//           if (position === 1) {
//             rider.wins.push({
//               event
//             });
//
//             rider.podiums.push({
//               event,
//               day,
//               position
//             });
//
//           } else if (position === 2 || position === 3) {
//             rider.podiums.push({
//               event,
//               day,
//               position
//             })
//           }
//
//           rider.mains.push({
//             event,
//             day,
//             position
//           })
//
//           console.log(rider)
//
//           riderRow = results.data[idx++];
//         }
//
//         break;
//       }
//     }
//
//     console.log(riders.length)
// 	}
// });
