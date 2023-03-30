import * as fs from 'fs';
import * as readline from 'readline';
import * as fsPromise from 'fs/promises';
import path = require('path');

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { LoggerLevel, Messages, SfProject } from '@salesforce/core';

import { fieldFactory, fieldBase } from '../../../lib/soft/field/fieldDefinition';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('soft', 'soft.field.generate', [
  'summary',
  'description',
  'examples',
  'flags.definition-file.summary',
  'flags.output-dir.summary',
  'flags.verbose.summary',
]);

export type SoftFieldGenerateResult = {
  path: string;
  fileCreated: number;
  fileError: number;
  fieldErrors: number;
  fieldWarnings: number;
};

export default class SoftFieldGenerate extends SfCommand<SoftFieldGenerateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'definition-file': Flags.file({
      summary: messages.getMessage('flags.definition-file.summary'),
      char: 'f',
      required: true,
      exists: true,
    }),
    'output-dir': Flags.directory({
      summary: messages.getMessage('flags.output-dir.summary'),
      char: 'd',
    }),
    verbose: Flags.boolean({
      summary: messages.getMessage('flags.verbose.summary'),
      char: 'v',
    }),
  };

  private verbose = false; // Setted with --verbose / -v flag
  private outputDirectory: string; // Directory path to output fields files. Depends on --output-dir / -d or local SFDX Project
  private fileCreated = 0; // Total number of file created while generating fields
  private fileError = 0; // Total number of file creation in error while generating fields
  private totalErrors = 0; // Total number of errors while generating fields
  private totalWarnings = 0; // Total number of wanings while generating fields
  private toGenerate: fieldBase[]; // List of Fields to generate as SFDX Xml files

  public async run(): Promise<SoftFieldGenerateResult> {
    const { flags } = await this.parse(SoftFieldGenerate);
    /**
     * Main program of the plugin. Orchestrates the different parts
     *
     * @returns the promise of the plugin which is reprensented by the output path`
     */
    this.verbose = flags['verbose'] ? true : false;
    this.manageLog('Verbose activated', LoggerLevel.TRACE);

    // Check for output flag or local project
    try {
      await this.getLocalProjectDefaultDirectory(flags['output-dir']);
      this.manageLog(`select path for output is: ${this.outputDirectory}`, LoggerLevel.TRACE);
    } catch (exception) {
      this.manageLog(
        'Impossible to find an output directory. Use the command in an SF Project or use the --output-dir flag.',
        LoggerLevel.WARN
      );
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
      this.manageLog(`${exception.name}: ${exception.message}`, LoggerLevel.WARN);
      this.manageLog('Execution aborded', LoggerLevel.WARN);

      return { path: 'Not found', fileCreated: 0, fileError: 0, fieldErrors: 0, fieldWarnings: 0 };
    }

    // Read file and generate fields
    this.toGenerate = new Array<fieldBase>();
    await this.readFieldDefinitionFile(flags['definition-file']);
    await this.generateFile();
    return {
      path: this.outputDirectory,
      fileCreated: this.fileCreated,
      fileError: this.fileError,
      fieldErrors: this.totalErrors,
      fieldWarnings: this.totalWarnings,
    };
  }

  private readFieldDefinitionFile(fieldDefinitionFilePath: string): Promise<void> {
    /**
     * Reads the CSV file line by line to create field files in the output directory
     *
     * @remarks
     * File generation is manage in a specifif private methode.
     *
     * @param fieldDefinitionFilePath - filepath where is located the CSV file (from --definition-file / -f flag)
     */
    let counter = 0;
    let keys = [];
    const lineReader = readline.createInterface({
      input: fs.createReadStream(fieldDefinitionFilePath),
      terminal: false,
    });

    // Read the file line by line
    lineReader.on('line', (line) => {
      const lineItems = line.split(',');

      if (counter === 0) {
        // Get headers (first line of the CSV file)
        keys = lineItems;
      } else {
        const currentField = {};
        currentField['lineNumber'] = counter;

        // Scan each information of the line
        keys.forEach((key: string, index) => {
          currentField[key] = lineItems[index];
        });

        // Build a Field object with information from the line of the CSV
        try {
          const aField: fieldBase = fieldFactory.getFieldInstance(currentField);

          if (aField.hasError) {
            // If some errors are found, the file generation is skipped, the user is warned
            this.manageLog(
              `#${counter} Field ${aField.objectName}.${aField.fullname} skipped due to ${aField.errors.length} errors (and ${aField.warnings.length} warnings)`,
              LoggerLevel.WARN
            );
            this.totalErrors += aField.errors.length;
            this.totalWarnings += aField.warnings.length;
            aField.errors.forEach((element) => {
              this.manageLog(`   REQUIRED>#${counter} ${element}`, LoggerLevel.WARN);
            });
            aField.warnings.forEach((element) => {
              this.manageLog(`   RECOMMANDED>#${counter} ${element}`, LoggerLevel.TRACE);
            });
          } else {
            // The file can be generated
            this.manageLog(
              `#${counter} Field ${aField.objectName}.${aField.fullname} in progress with ${aField.warnings.length} warnings`,
              LoggerLevel.TRACE
            );
            this.totalWarnings += aField.warnings.length;
            aField.warnings.forEach((element) => {
              this.manageLog(`   RECOMMANDED>#${counter} ${element}`, LoggerLevel.TRACE);
            });

            // Save the field file to the output directory
            // By my choice, files are created under the standard directory tree: main/default/objects/
            this.toGenerate.push(aField);
          }
        } catch (exception) {
          this.manageLog(`#${counter} Field skipped due to a fatal errors`, LoggerLevel.WARN);
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
          this.manageLog(`   >${exception.message}`, LoggerLevel.WARN);
          this.totalErrors++;
        }
      }

      counter++;
    });

    return new Promise((resolve) => {
      lineReader.on('close', () => {
        // End of execution
        this.manageLog('------------------', LoggerLevel.INFO);
        this.manageLog(`Job done, files generated on: ${this.outputDirectory}`, LoggerLevel.INFO);
        resolve();
      });
    });
  }

  private async generateFile(): Promise<void> {
    for (const currentField of this.toGenerate) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.saveToDisk(currentField, 'main/default/objects/');
        this.manageLog(`File ${currentField.fullname} saved`, LoggerLevel.TRACE);
        this.fileCreated++;
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        this.manageLog(`An error happens while creating the file ${currentField.fullname}: ${err}`, LoggerLevel.WARN);
        this.fileError++;
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private async saveToDisk(aField: fieldBase, subdirectory: string): Promise<void> {
    /**
     * Saves a Field as a SFDX xml file in the output directory
     *
     * @remarks
     * File generation is manage in a specifif private methode.
     *
     * @param aField - Field object to be rendered as a SFDX Xml file
     * @param subdirectory - subdirectory to save file under the choosen output directory
     */
    const filePath = `${this.outputDirectory}${subdirectory}${aField.fieldStructure['objectName'] as string}/${
      aField.fullname
    }.field-meta.xml`;

    return fsPromise
      .mkdir(path.dirname(filePath), { recursive: true })
      .then(() =>
        // Create the field file
        fsPromise.writeFile(filePath, aField.toXmlString(), { encoding: 'utf8' })
      )
      .catch((err) => {
        this.warn(`An error happens when writing the file "${filePath}": ${err as string}`);
      });
  }

  private async getLocalProjectDefaultDirectory(outputDirectoryFlag: string): Promise<void> {
    /**
     * Define the output directory depending on the user provided the --output-directory / -d flag or not
     * If not provided, it will try to locate packages in the current folder, assuming this is an SFDX Project folder
     *
     * @param outputDirectoryFlag - --output-directory / -d flag or undefined
     */

    if (outputDirectoryFlag !== undefined) {
      // the flasg has been provided
      this.outputDirectory = outputDirectoryFlag;
    } else {
      try {
        // Locate packages - only if in a SFDX Project folder
        const availableDirectories = SfProject.getInstance().getPackageDirectories();
        this.manageLog(
          `${availableDirectories.length} available directories in your project for output`,
          LoggerLevel.INFO
        );

        // List available package to allow the user to choose where to generate files
        const promptChoice = [];
        availableDirectories.forEach((curDir) => {
          promptChoice.push({ name: `${curDir.name} ${curDir.default ? '(Default)' : ''}`, value: curDir.fullPath });
          this.manageLog(
            `Name: ${curDir.name} ${curDir.default ? '(Default)' : ''} @ ${curDir.fullPath}`,
            LoggerLevel.INFO
          );
        });
        this.manageLog(`choices: ${promptChoice.join()}`, LoggerLevel.INFO);
        const result = await this.prompt({
          message: 'Please select a directory:',
          name: 'value',
          type: 'list',
          choices: promptChoice,
        });

        this.outputDirectory = result.value as string;
      } catch (exception) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        throw new Error(exception);
        // The current folder is not a SFDX Project one
        // if (exception instanceof SfError) {
        //   this.manageLog('Impossible to find an output directory. Use the command in an SF Project or use the --output-dir flag.', LoggerLevel.WARN);
        //   this.manageLog(`${exception.name}: ${exception.message}`, LoggerLevel.ERROR);
        //   return Promise.reject(exception.name);
        // } else if (exception instanceof Error) {
        //   this.manageLog('Unknown exception when trying to define the output directory.', LoggerLevel.WARN);
        //   this.manageLog(`${exception.name}: ${exception.message}`, LoggerLevel.ERROR);
        //   return Promise.reject(exception.name);
        // }
      }
    }

    this.outputDirectory += this.outputDirectory.endsWith('/') ? '' : '/';
  }

  private manageLog(message: string, logLevel: LoggerLevel): void {
    /**
     * Manage log depending on verbose
     *
     * @remark
     * Should be replace with the standard logger
     *
     * @param message - Message to display
     * @param logLevel - Level of the message
     */
    if (logLevel === LoggerLevel.TRACE && this.verbose) {
      this.log(`Verbose: ${message}`);
    } else if (logLevel === LoggerLevel.INFO) {
      this.info(message);
    } else if (logLevel === LoggerLevel.WARN) {
      this.warn(message);
    } else if (logLevel === LoggerLevel.ERROR) {
      this.error(message, { exit: false });
    }
  }
}
