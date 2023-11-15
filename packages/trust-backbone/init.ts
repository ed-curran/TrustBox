import {init} from 'trust-bench'

init("local", "./local.environment.json.dist").then(() => console.log("done"))