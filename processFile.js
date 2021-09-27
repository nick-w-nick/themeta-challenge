const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const cron = require('node-cron');

const watchFiles = require('./watchFiles');

const worker = process.argv[2];

if (!worker) {
    return console.log('missing worker name');
}

const sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

watchFiles();

const statePath = path.join(__dirname, 'state.json');

let processing = false;

cron.schedule('* * * * *', async () => {
    if (processing) {
        console.log('Already processing a file!');
        return;
    }
    
    const stateData = await jsonfile.readFile(statePath);
    const fileNames = Object.keys(stateData);
    
    const fileStatuses = fileNames.map(file => {
        return {
            filename: file,
            processingTime: stateData[file].processingTime,
            status: stateData[file].status
        }
    });
    
    const fileToProcess = fileStatuses.filter(file => file.status === 'pending')[0];
    
    if (fileToProcess) {
        processing = true;
        const fileName = fileToProcess.filename;
        await jsonfile.writeFile(statePath, { ...stateData, [fileName]: { status: 'processing', worker, ...fileToProcess } });
        
        await sleep(processingTime * 1000);
        
        const updatedStateData = await jsonfile.readFile(statePath);
        await jsonfile.writeFile(statePath, { ...updatedStateData, [fileName]: { status: 'processed', worker, ...fileToProcess } });
        
        processing = false;
    }
});
