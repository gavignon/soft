import { SfCommand } from '@salesforce/sf-plugins-core';
export declare type SoftFieldGenerateResult = {
  path: string;
  fileCreated: number;
  fileError: number;
  fieldErrors: number;
  fieldWarnings: number;
};
export default class SoftFieldGenerate extends SfCommand<SoftFieldGenerateResult> {
  static readonly summary: string;
  static readonly description: string;
  static readonly examples: string[];
  static readonly flags: {
    'definition-file': import('@oclif/core/lib/interfaces').OptionFlag<
      string,
      import('@oclif/core/lib/interfaces/parser').CustomOptions
    >;
    'output-dir': import('@oclif/core/lib/interfaces').OptionFlag<
      string,
      import('@oclif/core/lib/interfaces/parser').CustomOptions
    >;
    verbose: import('@oclif/core/lib/interfaces').BooleanFlag<boolean>;
  };
  private verbose;
  private outputDirectory;
  private fileCreated;
  private fileError;
  private totalErrors;
  private totalWarnings;
  private toGenerate;
  run(): Promise<SoftFieldGenerateResult>;
  private readFieldDefinitionFile;
  private generateFile;
  private saveToDisk;
  private getLocalProjectDefaultDirectory;
  private manageLog;
}
