const path = require('path');
const jsonfile = require('jsonfile');
const cron = require('node-cron');

const { watchFiles } = require('./watchFiles');
const { updateIndex } = require('./utils');

const worker = process.argv[2];

if (!worker) {
    return console.log('Missing worker name!');
}

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
    
    const filesToProcess = stateData.filter(file => file.status === 'pending');
    console.log(`Found ${filesToProcess.length} pending files in the queue`);
    
    const fileToProcess = filesToProcess[0];
    
    if (fileToProcess) {
        console.log(`Starting processing...`);
        processing = true;
        const { filename, processingTime } = fileToProcess;
        const fileIndex = stateData.findIndex(file => file.filename === filename);
        const processingFile = await updateIndex(statePath, fileIndex, { ...fileToProcess, status: 'processing', worker });
        console.log(`Currently processing ${filename} | Estimated time: ${parseInt(processingTime)}s`);
        
        setTimeout(async () => {
            await updateIndex(statePath, fileIndex, { ...processingFile, status: 'processed' });
            console.log(`Finished processing ${filename} after ${parseInt(processingTime)}s`);
            processing = false;    
        }, processingTime * 1000);
    }
});
