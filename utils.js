const jsonfile = require('jsonfile');

const appendFile = async (filename, data, index) => {
    const currentState = await jsonfile.readFile(filename);
    const updatedIndex = index ? currentState[index] = data : null;
    const newState = [...currentState, data];
    return await jsonfile.writeFile(filename, updatedIndex || newState, { spaces: 4 });
};

const updateIndex = async (filename, index, data) => {
    const currentState = await jsonfile.readFile(filename);
    currentState[index] = data;
    await jsonfile.writeFile(filename, currentState, { spaces: 4 });
    return currentState[index];
};

module.exports = { appendFile, updateIndex };