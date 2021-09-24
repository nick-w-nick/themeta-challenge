const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');

const sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const testdir = path.join(__dirname, 'testdir');

const workerName = process.argv[2];

let processing = false;

while (processing === false) {
    fs.watch(testdir, (eventType, filename) => {
        fs.readFile(path.join(testdir, filename), async (err, data) => {
            if (err) {
                console.log(err);
            }
            
            const processingTime = data.toString();
            
            // Ignore the initial creation of the file, wait until it has contents
            if (!processingTime) {
                return;
            }
            
            console.log(`Processing time: ${processingTime}`);
            const fileName = filename.split('.')[0];
            
            const statePath = path.join(__dirname, 'state.json');
            const stateData = await jsonfile.readFile(statePath);
            
            // If the file has already been processed, ignore it
            if(stateData.hasOwnProperty(fileName)) {
                return;
            }
            
            console.log(`${eventType} event occurred for ${filename}`);
            stateData[fileName] = {filename, processedBy: workerName, processingTime };
            await jsonfile.writeFile(statePath, stateData);
            
            console.log(`Processing ${filename}`);
            processing = true;
            await sleep(parseInt(processingTime));
            console.log(`Finished processing ${filename}`);
            processing = false;
        });
    });    
}

