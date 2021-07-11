
import React, { Suspense, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid';
import Sticky from 'react-sticky-el';

import XLSX from 'xlsx';
import Fuse from 'fuse.js';

import './Application.css'

import stats from '../../../data/Women_Pro_Stats_gmo.xlsx';

class Rider {
  constructor({ name, careerStart }) {
    this.id = uuidv4();
    this.firstName = name && name.trim().split(' ')[0];
    this.lastName = name && name.trim().split(' ')[1];
    this.name = name && name.trim();
    this.podiums = [];
    this.wins = [];
    this.mains = [];
    this.yearsRaced = new Set([careerStart]);
  }

  addYearRaced = (year) => {
    this.yearsRaced.add(year);
  }

  addWin = (event) => {
    this.wins.push(new WinResult({ event }))
  }

  addPodium = ({ event, day, position }) => {
    this.podiums.push(new PodiumResult({ event, day, position }))
  }

  addMainEvent = ({ event, day, position }) => {
    this.mains.push(new MainEventResult({ event, day, position }))
  }

  computeStats = () => {
    this.numberOfWins = this.wins.length;
    this.numberOfPodiums = this.podiums.length;
    this.numberOfMains = this.mains.length;
    this.seasonsRaced = this.careerLength();
    this.winPercentage = ((this.numberOfWins / this.numberOfMains) * 100).toFixed(2);
    this.podiumPercentage = ((this.numberOfPodiums / this.numberOfMains) * 100).toFixed(2);
  }

  careerLength = () => {
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

    this.wins.forEach(processResult);
    this.podiums.forEach(processResult);
    this.mains.forEach(processResult);

    return end - start + 1;
  }
}

class Event {
  constructor({ year, name }) {
    this.name = name && name.trim();
    this.year = year;
  }
}

class WinResult {
  constructor({ event }) {
    this.event = event;
  }
}

class PodiumResult {
  constructor({ event, day, position }) {
    this.event = event;
    this.day = day;
    this.position = position;
  }
}

class MainEventResult {
  constructor({ event, day, position }) {
    this.event = event;
    this.day = day;
    this.position = position;
  }
}

const Row = ({ name, numberOfWins, numberOfPodiums, numberOfMains, seasonsRaced, winPercentage, podiumPercentage }) => (
  <div className="row">
    <div>{name}</div>
    <div className="center" >{numberOfWins}</div>
    <div className="center" >{numberOfPodiums}</div>
    <div className="center" >{numberOfMains}</div>
    <div className="center" >{seasonsRaced}</div>
    <div className="center" >{`${winPercentage}%`}</div>
    <div className="center" >{`${podiumPercentage}%`}</div>
  </div>
);

class Table extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [...props.data],
    };
  }

  compareBy = (key) => {
    return function (a, b) {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    };
  }

  sortBy = (key) => {
    let arrayCopy = [...this.props.data];
    arrayCopy.sort(this.compareBy(key));
    this.setState({ data: arrayCopy });
  }

  render() {
    return (
      <div className="table">
        <Sticky>
          <div className="app-header">
            <div className="app-title extra-bold-text">USABMX Women's Pro Rankings</div>
            <div className="header">
              <div className="bold-text" onClick={() => this.sortBy('name')}>Name</div>
              <div className="center bold-text" onClick={() => this.sortBy('numberOfWins')}>Wins</div>
              <div className="center bold-text" onClick={() => this.sortBy('numberOfPodiums')}>Podiums</div>
              <div className="center bold-text" onClick={() => this.sortBy('numberOfMains')}>Main Events</div>
              <div className="center bold-text" onClick={() => this.sortBy('seasonsRaced')}>Seasons Raced</div>
              <div className="center bold-text" onClick={() => this.sortBy('winPercentage')}>Win Ratio</div>
              <div className="center bold-text" onClick={() => this.sortBy('podiumPercentage')}>Podium Ratio</div>
            </div>
          </div>
        </Sticky>
        <div className="body">
          {this.state.data.map((rider) => <Row key={rider.id} {...rider} />)}
        </div>
      </div>
    );
  }
}

export default class Application extends React.Component {
  constructor(props) {
    super(props);

    const riders = require('../../../data/riders.json');
    riders.sort((a, b) => b.wins.length - a.wins.length);

    riders.forEach(r => r.seasonsRaced++)

    this.state = { riders };
  }

  componentDidMount() {
    if (this.state.riders) {
      return;
    }

    fetch(stats).then(response => response.arrayBuffer()).then(data => {
      const workbook = XLSX.read(data, { type: 'array' });

      const fuseOptions = {
        isCaseSensitive: false,
        includeScore: true,
        // shouldSort: true,
        // includeMatches: false,
        findAllMatches: false,
        // minMatchCharLength: 1,
        // location: 0,
        // threshold: 0.6,
        // distance: 100,
        // useExtendedSearch: false,
        // ignoreLocation: false,
        // ignoreFieldNorm: false,
        keys: [
          'name',
        ]
      };

      const riders = [];

      function getRider(name, year) {
        name = name && name.trim();
        const searchTokens = name.split(' ');

        var rider = riders.find(r => {
          // const riderTokens = r.name.split(' ');
          //
          // const notFound = searchTokens.filter(token => riderTokens.indexOf(token) < 0);
          // return notFound.length <= 1;
          return r.name.trim() === name;
        });

        if (!rider) {
          rider = new Rider({ name, careerStart: year })
          riders.push(rider);
        } else {
          rider.addYearRaced(year)
        }

        return rider;
      }

      const allEvents = [];

      Object.keys(workbook.Sheets).forEach((sheetName, idx) => {
        const year = parseInt(sheetName);

        if (!isNaN(year)) {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          // Parse Events
          const events = [];
          var eventIdx = 2;
          var event = rows[3][eventIdx++];

          while (!!event) {
            const e = new Event({ year, name: event });
            allEvents.push(e);
            events.push(e);
            event = rows[3][eventIdx++];
          }

          const eventFuse = new Fuse(events, fuseOptions);

          function getEvent(name) {
            if (!name) {
              return undefined;
            }

            const result = eventFuse.search(name)[0];
            return result && result.item;
          }

          // Parse wins
          var rowIdx = 6;
          var riderRow = rows[rowIdx++];

          while (!!riderRow) {
            // If no name in the first column, we have reached the end of the win
            // list
            if (!riderRow[0]) {
              break;
            }

            var rider = getRider(riderRow[0], year);

            for (var winResultIdx = 0; winResultIdx < events.length; winResultIdx++) {
              const numberOfWins = parseInt(riderRow[winResultIdx + 2]);

              if (!isNaN(numberOfWins)) {
                for (var k = 0; k < numberOfWins; k++) {
                  rider.addWin(events[winResultIdx]);
                }
              }
            }

            riderRow = rows[rowIdx++]
          }

          // Parse Main Events
          var mainEvents;
          var days;

          while (!mainEvents) {
            mainEvents = rows[rowIdx++];

            if (!mainEvents[0] || mainEvents[0].trim() !== 'Main Events') {
              mainEvents = undefined;
            }
          }

          days = rows[rowIdx++];
          riderRow = rows[rowIdx++];

          while(!!riderRow) {
            if (!riderRow[0]) {
              break;
            }

            var rider = getRider(riderRow[0], year);

            for (var mainEventIdx = 1; mainEventIdx < mainEvents.length; mainEventIdx++) {
              const numberOfMains = parseInt(riderRow[mainEventIdx]);

              if (!isNaN(numberOfMains)) {
                var event;
                var day = days[mainEventIdx] ? parseInt(days[mainEventIdx].trim().split(' ')[1]) : 1;
                var event = getEvent(mainEvents[mainEventIdx - (day - 1)]);

                if (!event) {
                  // can't figure out the event;
                  // console.error(`Unable to find main event for rider ${riderRow[0]} at index [${mainEventIdx}] for ${year}`)
                  event = new Event({ name: 'Unknown', year })
                }

                for (var k = 0; k < numberOfMains; k++) {
                  rider.addMainEvent({ event, day });
                }
              }
            }

            riderRow = rows[rowIdx++];
          }

          // Parse Podiums
          mainEvents = undefined;

          while (!mainEvents) {
            mainEvents = rows[rowIdx++];

            if (!mainEvents[0] || mainEvents[0].trim() !== 'Main Events') {
              mainEvents = undefined;
            }
          }

          days = rows[rowIdx++];
          riderRow = rows[rowIdx++];

          while(!!riderRow) {
            if (!riderRow[0]) {
              break;
            }

            var rider = getRider(riderRow[0], year);

            for (var mainEventIdx = 1; mainEventIdx < mainEvents.length; mainEventIdx++) {
              const numberOfPodiums = parseInt(riderRow[mainEventIdx]);

              if (!isNaN(numberOfPodiums)) {
                var day = days[mainEventIdx] ? parseInt(days[mainEventIdx].trim().split(' ')[1]) : 1;
                var event = getEvent(mainEvents[mainEventIdx - (day - 1)]);

                if (!event) {
                  // can't figure out the event;
                  // console.error(`Unable to find podium event for rider ${riderRow[0]} at index [${mainEventIdx}] in ${year}`)
                  event = new Event({ name: 'Unknown', year });
                }

                for (var k = 0; k < numberOfPodiums; k++) {
                  rider.addPodium({ event, day });
                }
              }
            }

            riderRow = rows[rowIdx++];
          }
        }
      })

      riders.sort((a, b) => b.wins.length - a.wins.length)
      riders.forEach(r => r.computeStats())

      console.log(JSON.stringify(riders))

      this.setState({ riders })
    })
  }

  componentWillUnmount() {

  }

  render() {
    const { riders } = this.state;

    return (
      <div className="application">
        {riders && <Table data={riders} />}
      </div>
    )
  }
}
