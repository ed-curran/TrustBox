import trustBench from 'trust-bench'
const {init} = trustBench

init("local", "./local.environment.json.dist").then(() => console.log("done"))