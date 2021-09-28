# Get Started

- Run `mkdir processing`
- Run `npm install`
- Run `node processFile.js <worker-name-1>`
- Run `node processFile.js <worker-name-2>`
- Run `python simulation.py processing`
- Wait 1 minute for the initial cron job to run, indicated by the `Checking queue for new files...` message in the terminal

> Run `./cleanup.sh` to remove all generated files and reset the state while testing

## Explanation

The functionality is split into two different scripts, one being the watcher, `watchFiles.js`, and the other being the processor, `processFile.js`.

`watchFiles` is responsible for watching the `processing` directory and adding any new files to the queue, AKA the JSON file named `state.json`.

`processFile` is responsible for transitioning each file through a series of states, those being `pending`, `processing` and `complete`. Each file is set to `pending` by default and is moved along as the script runs. When that happens is based on when the file was created, as they are added to the queue in the order they were created and processed sequentially. `processFile` is run on a cron job, which is set to run every minute. It will check for pending jobs each minute and will pick the oldest one to process.