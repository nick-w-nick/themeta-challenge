const { watch } = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const chalk = require('chalk');

const { readFile } = require('fs/promises');

const { appendFile } = require('./utils');

const testdir = path.join(__dirname, 'testdir');

const watchFiles = () => {
    console.log('Watching for files...');
    watch(testdir, async (eventType, filename) => {
        
        // Get current state information
        const statePath = path.join(__dirname, 'state.json');
        const stateData = await jsonfile.readFile(statePath);
        
        const fileInQueue = stateData.filter(file => file.filename === filename).length > 0;
        
        // If the file is already in the queue, do nothing
        if(fileInQueue) {
            // console.log(`Ignoring ${filename}, already in queue`)
            return;
        }
        
        const processingTime = await readFile(path.join(testdir, filename));
        
        if (!processingTime.toString()) {
            // console.log('File data not yet available');
            return;
        };
        
        const newFile = { filename, status: 'pending', processingTime: parseFloat(processingTime.toString()) };
        await appendFile(statePath, newFile);
        console.log(`Added ${chalk.blueBright(filename)} to the queue`);
    });
};

module.exports = { watchFiles };