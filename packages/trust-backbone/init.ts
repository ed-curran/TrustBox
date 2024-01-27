import trustBench from 'trustbench'
const {init} = trustBench

init("local", "./local.environment.json.dist").then(() => console.log("done"))