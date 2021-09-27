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
    console.log(`Sleeping for ${ms}ms`);
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

watchFiles();

const statePath = path.join(__dirname, 'state.json');

let processing = false;

cron.schedule('* * * * *', async () => {
    console.log('Checking queue for new files...');
    if (processing === true) {
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
    
    const filesToProcess = fileStatuses.filter(file => file.status === 'pending');
    console.log(`Found ${filesToProcess.length} pending files in the queue`);
    
    const fileToProcess = filesToProcess.sort((a, b) => a.processingTime - b.processingTime)[0];
    
    if (fileToProcess) {
        console.log(`Processing file ${fileToProcess.filename}`);
        processing = true;
        const fileName = fileToProcess.filename;
        await jsonfile.writeFile(statePath, { ...stateData, [fileName]: { status: 'processing', worker, ...fileToProcess } });
        
        // const updatedStateData = await jsonfile.readFile(statePath);
        
        // await Promise.all([
        //     sleep(processingTime),
        //     jsonfile.writeFile(statePath, { ...updatedStateData, [fileName]: { status: 'processed', worker, ...fileToProcess } })
        // ]);
        console.log(`Starting processing...`);
        
        setTimeout(async () => {
            console.log(`Currently processing ${fileName}`);
            const updatedStateData = await jsonfile.readFile(statePath);
            await jsonfile.writeFile(statePath, { ...updatedStateData, [fileName]: { status: 'processed', worker, ...fileToProcess } });
            console.log(`Finished processing ${fileName}`);
            processing = false;    
        }, 10000);
        // sleep(processingTime).then(() => {
        //     console.log(`Finished processing ${fileName}`);
        //     processing = false;
        // });
        
        // const updatedStateData = await jsonfile.readFile(statePath);
        // await jsonfile.writeFile(statePath, { ...updatedStateData, [fileName]: { status: 'processed', worker, ...fileToProcess } });
        
        // console.log(`Finished processing ${fileToProcess.filename}`);
        // return processing = false;
    }
});
