import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import SoftFieldGenerate from '../../../../src/commands/soft/field/generate';
describe('Within a valid Salesforce DX project', () => {
  let myTestSessionSFDX: TestSession;

  before(async () => {
    myTestSessionSFDX = await TestSession.create({
      project: {
        name: 'MyTestProject',
      },
    });
  });

  after(async () => {
    await myTestSessionSFDX?.clean();
  });

  it('Should generate 23 files without error in a SFDX project Folder', async () => {
    const result = await SoftFieldGenerate.run(['--definition-file', './test/commands/soft/field/generate-test.csv']);

    expect(result).to.have.property('path', `${myTestSessionSFDX.project.dir}/force-app/`);
    expect(result).to.have.property('fileCreated', 23);
    expect(result).to.have.property('fileError', 0);
    expect(result).to.have.property('fieldErrors', 17);
    expect(result).to.have.property('fieldWarnings', 8);
  });
});

describe('Without a valid Salesforce DX project', () => {
  let simpleTestSession: TestSession;

  before(async () => {
    simpleTestSession = await TestSession.create();
  });

  after(async () => {
    await simpleTestSession?.clean();
  });

  it('Should generate 23 files without error in a specific folder', async () => {
    const result = await SoftFieldGenerate.run([
      '--definition-file',
      './test/commands/soft/field/generate-test.csv',
      '--output-dir',
      simpleTestSession.dir,
      '--verbose',
    ]);

    expect(result).to.have.property('path', `${simpleTestSession.dir}/`);
    expect(result).to.have.property('fileCreated', 23);
    expect(result).to.have.property('fileError', 0);
    expect(result).to.have.property('fieldErrors', 17);
    expect(result).to.have.property('fieldWarnings', 8);
  });

  it('Should throw an SF Exception (not a valid Salesforce DX project)', async () => {
    const result = await SoftFieldGenerate.run(['--definition-file', './test/commands/soft/field/generate-test.csv']);

    expect(result).to.have.property('path', 'Not found');
  });
});
