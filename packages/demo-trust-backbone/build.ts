import {build} from 'trust-bench'

var args = process.argv.slice(2);

const environmentName = args[0]
if(!environmentName) {
  throw Error("please provide an environment name as first arg")
}

//this needs turning into an actual cli
//you can rename environment.dist.json to local.environment.json
// run this file with ts-node it will get picked up by this generate
//and put the output in dist/local
//and i grab the contents of that and copy it in to the public folder of the appropriate websites
//(each dir represents an ssi entity)
build(environmentName).then(() => {
  console.log('nice');
});
