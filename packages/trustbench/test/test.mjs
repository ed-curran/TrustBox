import { parseTrustFrameworkDoc } from '../dist/trustlib/trustframework/trustFrameworkDoc.js';
import { validator } from '../dist/trustlib/index.js';

const doc =
  '{\n' +
  '  "id": "4fa29185-84bb-4254-9725-6f58e96139a9",\n' +
  '  "author": "did:key:z6Mko9SLc7mLnZDvtnJTwaZAG9LuNB6CEfHv6v1nAfebdBJ1",\n' +
  '  "version": "24",\n' +
  '  "created": "2024-01-27T18:39:34.759Z",\n' +
  '  "validFrom": "2024-01-27T18:39:34.759Z",\n' +
  '  "entries": {\n' +
  '    "http://localhost:4321/roles/pdtf-participant.json": {},\n' +
  '    "http://localhost:4321/pdtf-credentials.json": {\n' +
  '      "did:key:z6Mko9SLc7mLnZDvtnJTwaZAG9LuNB6CEfHv6v1nAfebdBJ1": {\n' +
  '        "credentials": [\n' +
  '          {\n' +
  '            "type": "ExampleCredential",\n' +
  '            "schema": "http://localhost:4321/schemas/example.json"\n' +
  '          }\n' +
  '        ]\n' +
  '      }\n' +
  '    }\n' +
  '  }\n' +
  '}';

const trustDoc = JSON.parse(doc);
const validate = validator();
if (validate(trustDoc)) {
  const parsed = parseTrustFrameworkDoc(trustDoc, {
    credentialsTopic: 'http://localhost:4321/pdtf-credentials.json',
    memberTopic: 'http://localhost:4321/roles/pdtf-participant.json',
  });
  console.log(parsed);
  if (parsed.status === 'success') {
    console.log(parsed.value.entries.credentialsTopic.owner);
  }
}
console.log(validate.errors)