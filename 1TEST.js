import xapi from 'xapi';


var config = {
  inputs: [1, 2],
  start: true
};

export class AudioReporterDriver_internal {
  constructor(device, config) {
    this.device = device;
    this.config = config;
    this.inputs = [];
    this.maxLevel = undefined;
    this.maxLevelId = undefined;
    for (let i = 1; i < this.config.inputs.length; i++) {
      this.inputs[i] = { id: i, level: 0 };
    }
    console.log(this.inputs);
  }
  start() {
    xapi.Command.Audio.VuMeter.Start({
      ConnectorId: 1,
      ConnectorId: 2,
      ConnectorType: 'Microphone',
      Source: 'AfterAEC'
    });
    xapi.Event.Audio.Input.Connectors.Microphone.on(report => {
      this.update(report.id, report.VuMeter);
    });
  }
  stop() {

  }
  update(id, level) {
    this.inputs[id] = { id: id, level: level };  // Update this.inputs[id] before the loop

    let highestLevelObj = null;
    let secondHighestLevelObj = null;
    let lowestLevelObj = null;
    let lowestLevelValue = Infinity;
    let highestLevelValue = -Infinity;
    var levelSum = 0;

    for (let i = 1; i < this.inputs.length; i++) {  // Start loop at index 1
      levelSum = levelSum + this.inputs[i].level;
      let currentObj = this.inputs[i];

      if (highestLevelObj === null || currentObj.level > highestLevelObj.level) {
        secondHighestLevelObj = highestLevelObj;
        highestLevelObj = currentObj;
        highestLevelValue = currentObj.level;
      } else if (secondHighestLevelObj === null || (currentObj.level > secondHighestLevelObj.level && currentObj.level < highestLevelObj.level)) {
        secondHighestLevelObj = currentObj;
      }

      if (lowestLevelObj === null || currentObj.level < lowestLevelObj.level) {
        lowestLevelObj = currentObj;
        lowestLevelValue = currentObj.level;
      }
    }

    var average = levelSum / (this.inputs.length - 1);
    let differenceBetweenTopTwo = highestLevelValue - secondHighestLevelObj.level;
    let differenceBetweenHighestAndLowest = highestLevelValue - lowestLevelValue;

    console.log(`HIGH-INPUT: ${highestLevelObj.id} (${highestLevelValue}), LOW-INPUT: ${lowestLevelObj.id} (${lowestLevelValue}), DIFF-1-2: ${differenceBetweenTopTwo}, DIFF-1-LOW: ${differenceBetweenHighestAndLowest}, AVG: ${average}`);
  }
}


const device = {
  report(data) {
    console.log(data);
  }
}

const x = new AudioReporterDriver_internal(device, config);
x.start();