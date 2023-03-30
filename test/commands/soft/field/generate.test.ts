import { expect, test } from '@oclif/test';

describe('soft field generate, empty test. Real tests are in generate.nut.ts', () => {
  test
    .stdout()
    .command(['soft field generate'])
    .it('runs without flag', (ctx) => {
      expect(ctx.stdout).to.contain('Missing required flag definition-file');
    });
});
