'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const fs = require('fs');
const readline = require('readline');
const fsPromise = require('fs/promises');
const path = require('path');
const sf_plugins_core_1 = require('@salesforce/sf-plugins-core');
const core_1 = require('@salesforce/core');
const fieldDefinition_1 = require('../../../lib/soft/field/fieldDefinition');
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.load('soft', 'soft.field.generate', [
  'summary',
  'description',
  'examples',
  'flags.definition-file.summary',
  'flags.output-dir.summary',
  'flags.verbose.summary',
]);
class SoftFieldGenerate extends sf_plugins_core_1.SfCommand {
  constructor() {
    super(...arguments);
    this.verbose = false; // Setted with --verbose / -v flag
    this.fileCreated = 0; // Total number of file created while generating fields
    this.fileError = 0; // Total number of file creation in error while generating fields
    this.totalErrors = 0; // Total number of errors while generating fields
    this.totalWarnings = 0; // Total number of wanings while generating fields
  }
  async run() {
    const { flags } = await this.parse(SoftFieldGenerate);
    /**
     * Main program of the plugin. Orchestrates the different parts
     *
     * @returns the promise of the plugin which is reprensented by the output path`
     */
    this.verbose = flags['verbose'] ? true : false;
    this.manageLog('Verbose activated', core_1.LoggerLevel.TRACE);
    // Check for output flag or local project
    try {
      await this.getLocalProjectDefaultDirectory(flags['output-dir']);
      this.manageLog(`select path for output is: ${this.outputDirectory}`, core_1.LoggerLevel.TRACE);
    } catch (exception) {
      this.manageLog(
        'Impossible to find an output directory. Use the command in an SF Project or use the --output-dir flag.',
        core_1.LoggerLevel.WARN
      );
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
      this.manageLog(`${exception.name}: ${exception.message}`, core_1.LoggerLevel.WARN);
      this.manageLog('Execution aborded', core_1.LoggerLevel.WARN);
      return { path: 'Not found', fileCreated: 0, fileError: 0, fieldErrors: 0, fieldWarnings: 0 };
    }
    // Read file and generate fields
    this.toGenerate = new Array();
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
  readFieldDefinitionFile(fieldDefinitionFilePath) {
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
        keys.forEach((key, index) => {
          currentField[key] = lineItems[index];
        });
        // Build a Field object with information from the line of the CSV
        try {
          const aField = fieldDefinition_1.fieldFactory.getFieldInstance(currentField);
          if (aField.hasError) {
            // If some errors are found, the file generation is skipped, the user is warned
            this.manageLog(
              `#${counter} Field ${aField.objectName}.${aField.fullname} skipped due to ${aField.errors.length} errors (and ${aField.warnings.length} warnings)`,
              core_1.LoggerLevel.WARN
            );
            this.totalErrors += aField.errors.length;
            this.totalWarnings += aField.warnings.length;
            aField.errors.forEach((element) => {
              this.manageLog(`   REQUIRED>#${counter} ${element}`, core_1.LoggerLevel.WARN);
            });
            aField.warnings.forEach((element) => {
              this.manageLog(`   RECOMMANDED>#${counter} ${element}`, core_1.LoggerLevel.TRACE);
            });
          } else {
            // The file can be generated
            this.manageLog(
              `#${counter} Field ${aField.objectName}.${aField.fullname} in progress with ${aField.warnings.length} warnings`,
              core_1.LoggerLevel.TRACE
            );
            this.totalWarnings += aField.warnings.length;
            aField.warnings.forEach((element) => {
              this.manageLog(`   RECOMMANDED>#${counter} ${element}`, core_1.LoggerLevel.TRACE);
            });
            // Save the field file to the output directory
            // By my choice, files are created under the standard directory tree: main/default/objects/
            this.toGenerate.push(aField);
          }
        } catch (exception) {
          this.manageLog(`#${counter} Field skipped due to a fatal errors`, core_1.LoggerLevel.WARN);
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
          this.manageLog(`   >${exception.message}`, core_1.LoggerLevel.WARN);
          this.totalErrors++;
        }
      }
      counter++;
    });
    return new Promise((resolve) => {
      lineReader.on('close', () => {
        // End of execution
        this.manageLog('------------------', core_1.LoggerLevel.INFO);
        this.manageLog(`Job done, files generated on: ${this.outputDirectory}`, core_1.LoggerLevel.INFO);
        resolve();
      });
    });
  }
  async generateFile() {
    for (const currentField of this.toGenerate) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.saveToDisk(currentField, 'main/default/objects/');
        this.manageLog(`File ${currentField.fullname} saved`, core_1.LoggerLevel.TRACE);
        this.fileCreated++;
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        this.manageLog(
          `An error happens while creating the file ${currentField.fullname}: ${err}`,
          core_1.LoggerLevel.WARN
        );
        this.fileError++;
      }
    }
  }
  // eslint-disable-next-line class-methods-use-this
  async saveToDisk(aField, subdirectory) {
    /**
     * Saves a Field as a SFDX xml file in the output directory
     *
     * @remarks
     * File generation is manage in a specifif private methode.
     *
     * @param aField - Field object to be rendered as a SFDX Xml file
     * @param subdirectory - subdirectory to save file under the choosen output directory
     */
    const filePath = `${this.outputDirectory}${subdirectory}${aField.fieldStructure['objectName']}/${aField.fullname}.field-meta.xml`;
    return fsPromise
      .mkdir(path.dirname(filePath), { recursive: true })
      .then(() =>
        // Create the field file
        fsPromise.writeFile(filePath, aField.toXmlString(), { encoding: 'utf8' })
      )
      .catch((err) => {
        this.warn(`An error happens when writing the file "${filePath}": ${err}`);
      });
  }
  async getLocalProjectDefaultDirectory(outputDirectoryFlag) {
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
        const availableDirectories = core_1.SfProject.getInstance().getPackageDirectories();
        this.manageLog(
          `${availableDirectories.length} available directories in your project for output`,
          core_1.LoggerLevel.INFO
        );
        // List available package to allow the user to choose where to generate files
        const promptChoice = [];
        availableDirectories.forEach((curDir) => {
          promptChoice.push({ name: `${curDir.name} ${curDir.default ? '(Default)' : ''}`, value: curDir.fullPath });
          this.manageLog(
            `Name: ${curDir.name} ${curDir.default ? '(Default)' : ''} @ ${curDir.fullPath}`,
            core_1.LoggerLevel.INFO
          );
        });
        this.manageLog(`choices: ${promptChoice.join()}`, core_1.LoggerLevel.INFO);
        const result = await this.prompt({
          message: 'Please select a directory:',
          name: 'value',
          type: 'list',
          choices: promptChoice,
        });
        this.outputDirectory = result.value;
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
  manageLog(message, logLevel) {
    /**
     * Manage log depending on verbose
     *
     * @remark
     * Should be replace with the standard logger
     *
     * @param message - Message to display
     * @param logLevel - Level of the message
     */
    if (logLevel === core_1.LoggerLevel.TRACE && this.verbose) {
      this.log(`Verbose: ${message}`);
    } else if (logLevel === core_1.LoggerLevel.INFO) {
      this.info(message);
    } else if (logLevel === core_1.LoggerLevel.WARN) {
      this.warn(message);
    } else if (logLevel === core_1.LoggerLevel.ERROR) {
      this.error(message, { exit: false });
    }
  }
}
exports.default = SoftFieldGenerate;
SoftFieldGenerate.summary = messages.getMessage('summary');
SoftFieldGenerate.description = messages.getMessage('description');
SoftFieldGenerate.examples = messages.getMessages('examples');
SoftFieldGenerate.flags = {
  'definition-file': sf_plugins_core_1.Flags.file({
    summary: messages.getMessage('flags.definition-file.summary'),
    char: 'f',
    required: true,
    exists: true,
  }),
  'output-dir': sf_plugins_core_1.Flags.directory({
    summary: messages.getMessage('flags.output-dir.summary'),
    char: 'd',
  }),
  verbose: sf_plugins_core_1.Flags.boolean({
    summary: messages.getMessage('flags.verbose.summary'),
    char: 'v',
  }),
};
//# sourceMappingURL=generate.js.map
