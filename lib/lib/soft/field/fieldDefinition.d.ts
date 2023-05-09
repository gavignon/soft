declare enum propertyType {
  Required = 0,
  Recommanded = 1,
  Optional = 2,
}
export declare class fieldBase {
  /**
   * Base class which define a field. Some type of field use this class because they don't have different behavior.
   */
  objectName: string;
  label: string;
  fullname: string;
  description: string;
  inlineHelpText: string;
  defaultValue: string;
  type: string;
  required: boolean;
  trackHistory: boolean;
  externalId: boolean;
  unique: boolean;
  fieldStructure: object;
  hasError: boolean;
  hasWarning: boolean;
  errors: string[];
  warnings: string[];
  ignoredProps: string[];
  constructor(fieldStructure: object, type: string);
  defineStringValue(fieldStructure: object, propertyName: string, property: propertyType): string;
  defineNumberValue(fieldStructure: object, propertyName: string, property: propertyType): number;
  defineBooleanValue(fieldStructure: object, propertyName: string, property: propertyType): boolean;
  checkProperty(currentValue: any, propertyName: string, property: propertyType): void;
  addPropertyCompliance(message: string, property: propertyType): void;
  toXmlString(): string;
}
export declare class fieldFactory {
  /**
   * Field factory to help in Field object creation
   */
  static getFieldInstance(fieldStructure: object): fieldBase;
}
export {};
