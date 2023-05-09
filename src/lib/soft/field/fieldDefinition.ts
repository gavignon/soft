import { parse } from 'js2xmlparser';

// Supported field type
const fieldType = [
  'AutoNumber',
  'Checkbox',
  'Currency',
  'Date',
  'DateTime',
  'Email',
  'EncryptedText',
  'Html',
  'Location',
  'LongTextArea',
  'Lookup',
  'MultiselectPicklist',
  'Number',
  'Percent',
  'Phone',
  'Picklist',
  'Summary',
  'Text',
  'TextArea',
  'Time',
  'Url',
];

// Mandatory level of the field
enum propertyType {
  Required,
  Recommanded,
  Optional,
}

export class fieldBase {
  /**
   * Base class which define a field. Some type of field use this class because they don't have different behavior.
   */
  public objectName: string;
  public label: string;
  public fullname: string;
  public description: string;
  public inlineHelpText: string;
  public defaultValue: string;
  public type: string;
  public required: boolean;
  public trackHistory: boolean;
  public externalId: boolean;
  public unique: boolean;

  public fieldStructure: object;
  public hasError = false;
  public hasWarning = false;
  public errors: string[];
  public warnings: string[];
  public ignoredProps = ['objectName', 'fieldStructure', 'ignoredProps', 'hasError', 'hasWarning', 'errors', 'warning'];

  public constructor(fieldStructure: object, type: string) {
    /**
     * Create a Field
     *
     * @remarks
     * File generation is manage in a specifif private methode.
     *
     * @param fieldStructure - json representation of the field, from the extraction of the CSV file
     * @param type - Type of the field to create
     */
    this.fieldStructure = fieldStructure;

    if (fieldType.includes(type)) {
      this.type = type;
    } else {
      throw new invalidFieldDefinition(
        this.fieldStructure,
        `Type of field not supported '${type}', please use one of them: ${fieldType.join()}`
      );
    }

    this.errors = [];
    this.warnings = [];

    this.objectName = this.defineStringValue(fieldStructure, 'objectName', propertyType.Required);
    this.label = this.defineStringValue(fieldStructure, 'label', propertyType.Required);
    this.fullname = this.defineStringValue(fieldStructure, 'fullname', propertyType.Required);
    this.description = this.defineStringValue(fieldStructure, 'description', propertyType.Recommanded);
    this.inlineHelpText = this.defineStringValue(fieldStructure, 'inlineHelpText', propertyType.Recommanded);
    this.defaultValue = this.defineStringValue(fieldStructure, 'defaultValue', propertyType.Optional);
    this.required = this.defineBooleanValue(fieldStructure, 'required', propertyType.Optional);
    this.trackHistory = this.defineBooleanValue(fieldStructure, 'trackHistory', propertyType.Optional);
    this.externalId = this.defineBooleanValue(fieldStructure, 'externalId', propertyType.Optional);
    this.unique = this.defineBooleanValue(fieldStructure, 'unique', propertyType.Optional);
  }

  public defineStringValue(fieldStructure: object, propertyName: string, property: propertyType): string {
    /**
     * Set a string value and validate it
     *
     * @param fieldStructure - json representation of the field, from the extraction of the CSV file
     * @param propertyName - Name of the field in the fieldStructure
     * @param property - Mandatory level of the field
     *
     * @return string
     */
    let valueToReturn: string;

    if (Object.prototype.hasOwnProperty.call(fieldStructure, propertyName)) {
      valueToReturn = fieldStructure[propertyName] as string;
    }

    this.checkProperty(valueToReturn, propertyName, property);

    return valueToReturn;
  }

  public defineNumberValue(fieldStructure: object, propertyName: string, property: propertyType): number {
    /**
     * Set a number value and validate it
     *
     * @param fieldStructure - json representation of the field, from the extraction of the CSV file
     * @param propertyName - Name of the field in the fieldStructure
     * @param property - Mandatory level of the field
     *
     * @return Number
     */
    let valueToReturn: number;

    if (Object.prototype.hasOwnProperty.call(fieldStructure, propertyName)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      valueToReturn = parseInt(fieldStructure[propertyName], 10);
    }

    this.checkProperty(valueToReturn, propertyName, property);

    return valueToReturn;
  }

  public defineBooleanValue(fieldStructure: object, propertyName: string, property: propertyType): boolean {
    /**
     * Set a boolean value and validate it
     *
     * @param fieldStructure - json representation of the field, from the extraction of the CSV file
     * @param propertyName - Name of the field in the fieldStructure
     * @param property - Mandatory level of the field
     *
     * @return boolean
     */
    let valueToReturn = false;

    if (Object.prototype.hasOwnProperty.call(fieldStructure, propertyName)) {
      if (fieldStructure[propertyName]) {
        if ((fieldStructure[propertyName] as string).toLowerCase() === 'true') {
          valueToReturn = true;
        }
      } else {
        this.checkProperty(fieldStructure[propertyName], propertyName, property);
      }
    }

    return valueToReturn;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public checkProperty(currentValue: any, propertyName: string, property: propertyType): void {
    /**
     * Basic validation of the provided value depending on the mandatory level of the field
     * Basic validation means 'is not undefined'
     *
     * @param currentValue - Value to check
     * @param propertyName - Name of the field in the fieldStructure
     * @param property - Mandatory level of the field
     */

    let addCompliance = false;

    if (
      currentValue === null ||
      currentValue === undefined ||
      typeof currentValue === 'undefined' ||
      currentValue === ''
    ) {
      addCompliance = true;
    }

    if (addCompliance) {
      this.addPropertyCompliance(`${propertyName} is missing`, property);
    }
  }

  public addPropertyCompliance(message: string, property: propertyType): void {
    /**
     * Add an error or a warning to the created object
     *
     * @param message - Warning or Error message
     * @param property - Mandatory level of the field
     */
    switch (property) {
      case propertyType.Required:
        this.errors.push(message);
        this.hasError = true;
        break;
      case propertyType.Recommanded:
        this.warnings.push(message);
        this.hasWarning = true;
        break;
      default:
        break;
    }
  }

  public toXmlString(): string {
    /**
     * Serialize the Field in XML
     *
     * @return Xml serialization of the Field
     */
    return parse(
      'CustomField',
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        '@': { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
        ...Object.keys(this)
          .filter((key) => !this.ignoredProps.includes(key) && this[key] !== undefined && this[key] !== '')
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          .reduce((acc, key) => ({ ...acc, [key]: this[key] }), {}),
      },
      {
        declaration: { encoding: 'UTF-8' },
        format: {
          doubleQuotes: true,
          pretty: true,
        },
      }
    );
  }
}

class invalidFieldDefinition extends Error {
  /**
   * Custom error used when the field is not valid
   * The error is used when it's more than a missing or a basic error that is found in a field value
   */

  public constructor(fieldDefinition: object, message: string) {
    super(`Invalid field definition with ${fieldDefinition['type'] as string} object: ${message}`);
  }
}

const constraintType = ['Restrict', 'Cascade', 'SetNull'];
class fieldLookup extends fieldBase {
  /**
   * Lookup field
   */
  public referenceTo: string;
  public relationshipLabel: string;
  public relationshipName: string;
  public deleteConstraint: string;

  public constructor(fieldStructure: object) {
    super(fieldStructure, 'Lookup');
    this.referenceTo = this.defineStringValue(fieldStructure, 'lookup-referenceTo', propertyType.Required);
    this.relationshipLabel = this.defineStringValue(fieldStructure, 'lookup-relationshipLabel', propertyType.Required);
    this.relationshipName = this.defineStringValue(fieldStructure, 'lookup-relationshipName', propertyType.Required);
    this.deleteConstraint = this.defineStringValue(fieldStructure, 'lookup-deleteConstraint', propertyType.Required);
    this.validate();
  }

  private validate(): void {
    /**
     * Lookup validation
     */
    if (!constraintType.includes(this.deleteConstraint)) {
      this.addPropertyCompliance(
        `The constraint '${this.deleteConstraint}' is NOT a valid value: ${constraintType.join()}`,
        propertyType.Required
      );
    }
  }
}

class fieldAutonumber extends fieldBase {
  /**
   * Autonumber field
   */
  public displayFormat: string;

  public constructor(fieldStructure: object) {
    super(fieldStructure, 'AutoNumber');
    this.displayFormat = this.defineStringValue(fieldStructure, 'autonumber-displayFormat', propertyType.Required);
  }
}

class fieldGlobalNumeric extends fieldBase {
  /**
   * Numeric generic field, used by simple numeric field type or extended
   */
  public precision: number;
  public scale: number;

  public constructor(fieldStructure: object, type: string) {
    super(fieldStructure, type);
    this.precision = this.defineNumberValue(fieldStructure, 'numeric-precision', propertyType.Required);
    this.scale = this.defineNumberValue(fieldStructure, 'numeric-scale', propertyType.Required);
    this.validate();
  }

  private validate(): void {
    /**
     * Numeric validation
     */
    if (typeof this.precision !== 'number' || isNaN(this.precision)) {
      this.addPropertyCompliance('Bad number definition, precision not defined', propertyType.Required);
    }
    if (typeof this.scale !== 'number' || isNaN(this.scale)) {
      this.addPropertyCompliance('Bad number definition, scale not defined', propertyType.Required);
    }
    if (+this.precision + +this.scale > 20) {
      this.addPropertyCompliance(
        `Bad number definition, precision(${this.precision})+scale(${this.scale}) must be <= 20`,
        propertyType.Required
      );
    }
  }
}

class fieldNumber extends fieldGlobalNumeric {
  /**
   * Number field
   */
  public isAIPredictionField: boolean;

  public constructor(fieldStructure: object) {
    super(fieldStructure, 'Number');
    this.isAIPredictionField = this.defineBooleanValue(
      fieldStructure,
      'number-isAIPredictionField',
      propertyType.Optional
    );
  }
}

class fieldLocation extends fieldBase {
  /**
   * Location field
   */
  public displayLocationInDecimal: boolean;
  public scale: number;

  public constructor(fieldStructure: object) {
    super(fieldStructure, 'Location');
    this.displayLocationInDecimal = this.defineBooleanValue(
      fieldStructure,
      'geo-displayLocationInDecimal',
      propertyType.Required
    );
    this.scale = this.defineNumberValue(fieldStructure, 'numeric-scale', propertyType.Required);

    this.validate();
  }

  private validate(): void {
    /**
     * Location validation
     */
    if (typeof this.scale !== 'number' || isNaN(this.scale)) {
      this.addPropertyCompliance('Bad location definition, scale not defined', propertyType.Required);
    }
  }
}

class fieldText extends fieldBase {
  /**
   * Text field
   */
  public length: number;
  public caseSensitive: boolean;

  public constructor(fieldStructure: object) {
    super(fieldStructure, 'Text');
    this.length = this.defineNumberValue(fieldStructure, 'text-length', propertyType.Required);
    this.caseSensitive = this.defineBooleanValue(fieldStructure, 'text-caseSensitive', propertyType.Required);
  }
}

class fieldExtendedText extends fieldBase {
  /**
   * Extended text basic field, use by simple extended text field or extended
   */
  public length: number;
  public visibleLines: number;

  public constructor(fieldStructure: object, type: string) {
    super(fieldStructure, type);
    this.length = this.defineNumberValue(fieldStructure, 'text-length', propertyType.Required);
    this.visibleLines = this.defineNumberValue(fieldStructure, 'text-visibleLines', propertyType.Required);

    this.validate();
  }

  private validate(): void {
    /**
     * Extended text field validation
     */
    if (typeof this.length !== 'number' || isNaN(this.length)) {
      this.addPropertyCompliance('Bad text definition, length not defined as a number', propertyType.Required);
    }
    if (typeof this.visibleLines !== 'number' || isNaN(this.visibleLines)) {
      this.addPropertyCompliance('Bad text definition, visibleLines not defined as a number', propertyType.Required);
    }
    if (this.length > 131072) {
      this.addPropertyCompliance('Bad text definition, length too long, maximum is 131,072', propertyType.Required);
    }
  }
}

class fieldEmail extends fieldBase {
  public caseSensitive: boolean;

  public constructor(fieldStructure: object) {
    super(fieldStructure, 'Email');
    this.caseSensitive = this.defineBooleanValue(fieldStructure, 'text-caseSensitive', propertyType.Required);
  }
}

class fieldPicklist extends fieldBase {
  /**
   * Picklist field, base for picklist and multipicklist
   * Manage local and global values
   */
  public restricted: boolean;
  public isGlobal: boolean;
  public valueSet: picklistValueSet;

  public constructor(fieldStructure: object, type: string) {
    super(fieldStructure, type);
    this.restricted = this.defineBooleanValue(fieldStructure, 'picklist-restricted', propertyType.Required);
    this.isGlobal = this.defineBooleanValue(fieldStructure, 'picklist-isGlobal', propertyType.Required);
    this.ignoredProps.push('isGlobal');

    if (this.isGlobal) {
      this.valueSet = new globalPicklistValueSet(
        this.defineBooleanValue(fieldStructure, 'picklist-restricted', propertyType.Required),
        this.defineStringValue(fieldStructure, 'picklist-valueSetName', propertyType.Required)
      );
    } else {
      this.valueSet = new localPicklistValueSet(
        this.defineBooleanValue(fieldStructure, 'picklist-restricted', propertyType.Required),
        this.defineBooleanValue(fieldStructure, 'picklist-isSorted', propertyType.Required)
      );
    }
  }
}

class fieldMultiselectPicklist extends fieldPicklist {
  /**
   * Multipicklist field
   */
  public visibleLines: number;

  public constructor(fieldStructure: object) {
    super(fieldStructure, 'MultiselectPicklist');
    this.visibleLines = this.defineNumberValue(fieldStructure, 'text-visibleLines', propertyType.Required);
  }
}

abstract class picklistValueSet {
  /**
   * ValueSet abstract class to manage picklist values
   */
  public restricted: boolean;

  public constructor(isRestricted: boolean) {
    this.restricted = isRestricted;
  }
}

class globalPicklistValueSet extends picklistValueSet {
  /**
   * Global valueSet of picklist & multipicklist
   * ValueSet are declared in Salesforce
   */
  public valueSetname: string;

  public constructor(picklistRestricted: boolean, picklistValueSetName: string) {
    super(picklistRestricted);
    this.valueSetname = picklistValueSetName;
  }
}

class localPicklistValueSet extends picklistValueSet {
  /**
   * Local valueSet of picklist & multipicklist
   * Values are declare in the field definition
   * Create the field with a predefined list of 2 values as a sample
   */
  public valueSetDefinition: picklistValueSetDefinition;
  public constructor(picklistRestricted: boolean, picklistValueSetDefinitionSorted: boolean) {
    super(picklistRestricted);
    this.valueSetDefinition = new picklistValueSetDefinition(picklistValueSetDefinitionSorted);
  }
}

class picklistValueSetDefinition {
  /**
   * Sample values of local picklist & multipicklist field
   */
  public sorted: boolean;
  public value = [
    { fullName: 'Choice1', default: true, label: 'Label Choice1' },
    { fullName: 'Choice2', default: false, label: 'Label Choice2' },
  ];

  public constructor(isSorted: boolean) {
    this.sorted = isSorted;
  }
}

// class picklistValue {
//   public fullName: string;
//   public label: string;
//   public default: boolean;
// }

const maskTypeChoice = ['all', 'creditCard', 'lastFour', 'nino', 'sin', 'ssn'];
const maskCharChoice = ['*', 'X'];
class fieldEncrypted extends fieldBase {
  /**
   * Encrypted field
   */
  public maskType: string;
  public maskChar: string;

  public constructor(fieldStructure: object) {
    super(fieldStructure, 'EncryptedText');
    this.maskType = this.defineStringValue(fieldStructure, 'encrypt-maskType', propertyType.Required);
    this.maskChar = this.defineStringValue(fieldStructure, 'encrypt-maskChar', propertyType.Required);
    this.validate();
  }

  private validate(): void {
    /**
     * Encrypted field validation
     */
    if (!maskTypeChoice.includes(this.maskType)) {
      this.addPropertyCompliance(
        `Bad encrypted text definition, unknown maskType. Please use: ${maskTypeChoice.join()}`,
        propertyType.Required
      );
    }

    if (!maskCharChoice.includes(this.maskChar)) {
      this.addPropertyCompliance(
        `Bad encrypted text definition, unknown maskChar. Please use: ${maskCharChoice.join()}`,
        propertyType.Required
      );
    }
  }
}

const rollUpOperation = ['Count', 'Min', 'Max', 'Sum'];
class fieldSummary extends fieldBase {
  /**
   * Rollup summary field
   */
  public summarizedField: string;
  public summaryForeignKey: string;
  public summaryOperation: string;

  public constructor(fieldStructure: object) {
    super(fieldStructure, 'Summary');
    this.summarizedField = this.defineStringValue(fieldStructure, 'rollup-field', propertyType.Required);
    this.summaryForeignKey = this.defineStringValue(fieldStructure, 'rollup-foreignkey', propertyType.Required);
    this.summaryOperation = this.defineStringValue(fieldStructure, 'rollup-Operation', propertyType.Required);

    this.validate();
  }

  private validate(): void {
    /**
     * Rollup summary field validation
     */
    if (!rollUpOperation.includes(this.summaryOperation)) {
      this.addPropertyCompliance(
        `Bad rollup summary definition, unknown operation. Please use: ${rollUpOperation.join()}`,
        propertyType.Required
      );
    }
  }
}

export class fieldFactory {
  /**
   * Field factory to help in Field object creation
   */

  // eslint-disable-next-line complexity
  public static getFieldInstance(fieldStructure: object): fieldBase {
    /**
     * Build an instance of a Field depennding of its type
     *
     * @param fieldStructure - JSON structure from the CSV file which contains field's data
     *
     * @return Field object
     */
    let objectToReturn: fieldBase;
    const currentFieldType = fieldStructure['type'] as string;

    switch (currentFieldType) {
      case 'Autonumber':
        objectToReturn = new fieldAutonumber(fieldStructure);
        break;
      case 'Checkbox':
        objectToReturn = new fieldBase(fieldStructure, 'Checkbox');
        break;
      case 'Currency':
        objectToReturn = new fieldGlobalNumeric(fieldStructure, 'Currency');
        break;
      case 'Date':
        objectToReturn = new fieldBase(fieldStructure, 'Date');
        break;
      case 'DateTime':
        objectToReturn = new fieldBase(fieldStructure, 'DateTime');
        break;
      case 'Email':
        objectToReturn = new fieldEmail(fieldStructure);
        break;
      case 'EncryptedText':
        objectToReturn = new fieldEncrypted(fieldStructure);
        break;
      case 'Lookup':
        objectToReturn = new fieldLookup(fieldStructure);
        break;
      case 'Html':
        objectToReturn = new fieldExtendedText(fieldStructure, 'Html');
        break;
      case 'Location':
        objectToReturn = new fieldLocation(fieldStructure);
        break;
      case 'LongTextArea':
        objectToReturn = new fieldExtendedText(fieldStructure, 'LongTextArea');
        break;
      case 'Number':
        objectToReturn = new fieldNumber(fieldStructure);
        break;
      case 'MultiselectPicklist':
        objectToReturn = new fieldMultiselectPicklist(fieldStructure);
        break;
      case 'Percent':
        objectToReturn = new fieldGlobalNumeric(fieldStructure, 'Percent');
        break;
      case 'Phone':
        objectToReturn = new fieldBase(fieldStructure, 'Phone');
        break;
      case 'Picklist':
        objectToReturn = new fieldPicklist(fieldStructure, 'Picklist');
        break;
      case 'Summary':
        objectToReturn = new fieldSummary(fieldStructure);
        break;
      case 'Text':
        objectToReturn = new fieldText(fieldStructure);
        break;
      case 'TextArea':
        objectToReturn = new fieldBase(fieldStructure, 'TextArea');
        break;
      case 'Time':
        objectToReturn = new fieldBase(fieldStructure, 'Time');
        break;
      case 'Url':
        objectToReturn = new fieldBase(fieldStructure, 'Url');
        break;
      default:
        objectToReturn = new fieldBase(fieldStructure, currentFieldType);
        break;
    }

    return objectToReturn;
  }
}
