const path = require('path');
const jsonfile = require('jsonfile');
const cron = require('node-cron');
const chalk = require('chalk');

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
    // Only allow one instance of the worker to run at a time in case a file has a processing time longer than the cron job interval (1 min)
    // This can be triggered by adding a file to the `processing` directory with a value above 60.00
    if (processing === true) {
        console.log('Already processing a file!');
        return;
    }
    
    const stateData = await jsonfile.readFile(statePath);
    
    const filesToProcess = stateData.filter(file => file.status === 'pending');
    console.log(`Found ${chalk.green(filesToProcess.length)} pending files in the queue`);
    
    const fileToProcess = filesToProcess[0];
    
    if (fileToProcess) {
        console.log(`Starting processing...`);
        processing = true;
        
        const { filename, processingTime } = fileToProcess;
        
        // Index of the currently processing file
        const fileIndex = stateData.findIndex(file => file.filename === filename);
        
        // Move the file into `processing` status
        const processingFile = await updateIndex(statePath, fileIndex, { ...fileToProcess, status: 'processing', worker });
        console.log(`Currently processing ${chalk.blueBright(filename)} | Estimated time: ${chalk.yellow.bold(parseInt(processingTime))}s`);
        
        setTimeout(async () => {
            // Update the status of the file to complete
            await updateIndex(statePath, fileIndex, { ...processingFile, status: 'complete' });
            console.log(`Finished processing ${chalk.blueBright(filename)} after ${chalk.yellow.bold(parseInt(processingTime))}s`);
            processing = false;
        }, processingTime * 1000);
    }
});
