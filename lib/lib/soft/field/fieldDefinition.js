'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.fieldFactory = exports.fieldBase = void 0;
const js2xmlparser_1 = require('js2xmlparser');
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
var propertyType;
(function (propertyType) {
  propertyType[(propertyType['Required'] = 0)] = 'Required';
  propertyType[(propertyType['Recommanded'] = 1)] = 'Recommanded';
  propertyType[(propertyType['Optional'] = 2)] = 'Optional';
})(propertyType || (propertyType = {}));
class fieldBase {
  constructor(fieldStructure, type) {
    this.hasError = false;
    this.hasWarning = false;
    this.ignoredProps = ['objectName', 'fieldStructure', 'ignoredProps', 'hasError', 'hasWarning', 'errors', 'warning'];
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
  defineStringValue(fieldStructure, propertyName, property) {
    /**
     * Set a string value and validate it
     *
     * @param fieldStructure - json representation of the field, from the extraction of the CSV file
     * @param propertyName - Name of the field in the fieldStructure
     * @param property - Mandatory level of the field
     *
     * @return string
     */
    let valueToReturn;
    if (Object.prototype.hasOwnProperty.call(fieldStructure, propertyName)) {
      valueToReturn = fieldStructure[propertyName];
    }
    this.checkProperty(valueToReturn, propertyName, property);
    return valueToReturn;
  }
  defineNumberValue(fieldStructure, propertyName, property) {
    /**
     * Set a number value and validate it
     *
     * @param fieldStructure - json representation of the field, from the extraction of the CSV file
     * @param propertyName - Name of the field in the fieldStructure
     * @param property - Mandatory level of the field
     *
     * @return Number
     */
    let valueToReturn;
    if (Object.prototype.hasOwnProperty.call(fieldStructure, propertyName)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      valueToReturn = parseInt(fieldStructure[propertyName], 10);
    }
    this.checkProperty(valueToReturn, propertyName, property);
    return valueToReturn;
  }
  defineBooleanValue(fieldStructure, propertyName, property) {
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
        if (fieldStructure[propertyName].toLowerCase() === 'true') {
          valueToReturn = true;
        }
      } else {
        this.checkProperty(fieldStructure[propertyName], propertyName, property);
      }
    }
    return valueToReturn;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkProperty(currentValue, propertyName, property) {
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
  addPropertyCompliance(message, property) {
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
  toXmlString() {
    /**
     * Serialize the Field in XML
     *
     * @return Xml serialization of the Field
     */
    return (0, js2xmlparser_1.parse)(
      'CustomField',
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        '@': { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
        ...Object.keys(this)
          .filter((key) => !this.ignoredProps.includes(key) && this[key] !== undefined && this[key] !== '')
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
exports.fieldBase = fieldBase;
class invalidFieldDefinition extends Error {
  /**
   * Custom error used when the field is not valid
   * The error is used when it's more than a missing or a basic error that is found in a field value
   */
  constructor(fieldDefinition, message) {
    super(`Invalid field definition with ${fieldDefinition['type']} object: ${message}`);
  }
}
const constraintType = ['Restrict', 'Cascade', 'SetNull'];
class fieldLookup extends fieldBase {
  constructor(fieldStructure) {
    super(fieldStructure, 'Lookup');
    this.referenceTo = this.defineStringValue(fieldStructure, 'lookup-referenceTo', propertyType.Required);
    this.relationshipLabel = this.defineStringValue(fieldStructure, 'lookup-relationshipLabel', propertyType.Required);
    this.relationshipName = this.defineStringValue(fieldStructure, 'lookup-relationshipName', propertyType.Required);
    this.deleteConstraint = this.defineStringValue(fieldStructure, 'lookup-deleteConstraint', propertyType.Required);
    this.validate();
  }
  validate() {
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
  constructor(fieldStructure) {
    super(fieldStructure, 'AutoNumber');
    this.displayFormat = this.defineStringValue(fieldStructure, 'autonumber-displayFormat', propertyType.Required);
  }
}
class fieldGlobalNumeric extends fieldBase {
  constructor(fieldStructure, type) {
    super(fieldStructure, type);
    this.precision = this.defineNumberValue(fieldStructure, 'numeric-precision', propertyType.Required);
    this.scale = this.defineNumberValue(fieldStructure, 'numeric-scale', propertyType.Required);
    this.validate();
  }
  validate() {
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
  constructor(fieldStructure) {
    super(fieldStructure, 'Number');
    this.isAIPredictionField = this.defineBooleanValue(
      fieldStructure,
      'number-isAIPredictionField',
      propertyType.Optional
    );
  }
}
class fieldLocation extends fieldBase {
  constructor(fieldStructure) {
    super(fieldStructure, 'Location');
    this.displayLocationInDecimal = this.defineBooleanValue(
      fieldStructure,
      'geo-displayLocationInDecimal',
      propertyType.Required
    );
    this.scale = this.defineNumberValue(fieldStructure, 'numeric-scale', propertyType.Required);
    this.validate();
  }
  validate() {
    /**
     * Location validation
     */
    if (typeof this.scale !== 'number' || isNaN(this.scale)) {
      this.addPropertyCompliance('Bad location definition, scale not defined', propertyType.Required);
    }
  }
}
class fieldText extends fieldBase {
  constructor(fieldStructure) {
    super(fieldStructure, 'Text');
    this.length = this.defineNumberValue(fieldStructure, 'text-length', propertyType.Required);
    this.caseSensitive = this.defineBooleanValue(fieldStructure, 'text-caseSensitive', propertyType.Required);
  }
}
class fieldExtendedText extends fieldBase {
  constructor(fieldStructure, type) {
    super(fieldStructure, type);
    this.length = this.defineNumberValue(fieldStructure, 'text-length', propertyType.Required);
    this.visibleLines = this.defineNumberValue(fieldStructure, 'text-visibleLines', propertyType.Required);
    this.validate();
  }
  validate() {
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
  constructor(fieldStructure) {
    super(fieldStructure, 'Email');
    this.caseSensitive = this.defineBooleanValue(fieldStructure, 'text-caseSensitive', propertyType.Required);
  }
}
class fieldPicklist extends fieldBase {
  constructor(fieldStructure, type) {
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
  constructor(fieldStructure) {
    super(fieldStructure, 'MultiselectPicklist');
    this.visibleLines = this.defineNumberValue(fieldStructure, 'text-visibleLines', propertyType.Required);
  }
}
class picklistValueSet {
  constructor(isRestricted) {
    this.restricted = isRestricted;
  }
}
class globalPicklistValueSet extends picklistValueSet {
  constructor(picklistRestricted, picklistValueSetName) {
    super(picklistRestricted);
    this.valueSetname = picklistValueSetName;
  }
}
class localPicklistValueSet extends picklistValueSet {
  constructor(picklistRestricted, picklistValueSetDefinitionSorted) {
    super(picklistRestricted);
    this.valueSetDefinition = new picklistValueSetDefinition(picklistValueSetDefinitionSorted);
  }
}
class picklistValueSetDefinition {
  constructor(isSorted) {
    this.value = [
      { fullName: 'Choice1', default: true, label: 'Label Choice1' },
      { fullName: 'Choice2', default: false, label: 'Label Choice2' },
    ];
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
  constructor(fieldStructure) {
    super(fieldStructure, 'EncryptedText');
    this.maskType = this.defineStringValue(fieldStructure, 'encrypt-maskType', propertyType.Required);
    this.maskChar = this.defineStringValue(fieldStructure, 'encrypt-maskChar', propertyType.Required);
    this.validate();
  }
  validate() {
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
  constructor(fieldStructure) {
    super(fieldStructure, 'Summary');
    this.summarizedField = this.defineStringValue(fieldStructure, 'rollup-field', propertyType.Required);
    this.summaryForeignKey = this.defineStringValue(fieldStructure, 'rollup-foreignkey', propertyType.Required);
    this.summaryOperation = this.defineStringValue(fieldStructure, 'rollup-Operation', propertyType.Required);
    this.validate();
  }
  validate() {
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
class fieldFactory {
  /**
   * Field factory to help in Field object creation
   */
  // eslint-disable-next-line complexity
  static getFieldInstance(fieldStructure) {
    /**
     * Build an instance of a Field depennding of its type
     *
     * @param fieldStructure - JSON structure from the CSV file which contains field's data
     *
     * @return Field object
     */
    let objectToReturn;
    const currentFieldType = fieldStructure['type'];
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
exports.fieldFactory = fieldFactory;
//# sourceMappingURL=fieldDefinition.js.map
