const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');



const testdir = path.join(__dirname, 'testdir');

const watchFiles = () => {
    console.log('Watching for files...');
    fs.watch(testdir, async (eventType, filename) => {
        
        // Get current state information
        const statePath = path.join(__dirname, 'state.json');
        const stateData = await jsonfile.readFile(statePath);
        
        // If the file is already in the queue, do nothing
        if(stateData.hasOwnProperty(filename)) {
            console.log(`Ignoring ${filename}, already in queue`)
            return;
        }
        
        fs.readFile(path.join(testdir, filename), async (err, data) => {
            console.log(`New file found: ${filename}`)
            if(err) {
                console.log(err);
                return;
            }
            
            const processingTime = data.toString();
            console.log(`Processing time: ${processingTime}`);
            
            // Add file to the queue
            stateData[filename] = {filename, status: 'pending', processingTime };
            console.log(`Added ${filename} to the queue`);
            await jsonfile.writeFile(statePath, stateData);
        });
    });
};

module.exports = watchFiles;