import type { FunctionType, MappedKeyType, MappedPropertiesType, OmitType } from '~/common/types.ts';
import { ValidationResultType } from '~/validator/types.ts';
import ValidationEnum from '~/validator/enums/validation.enum.ts';

/**
 * Shared common methods
 * 
 * Adds to's representation about properties
 * Adds get's about the properties metadata
 * Integrates validations from decorators
 *
 * @interface AnnotationInterface
 *
 * @member {FunctionType} toJson - Return properties as a json object
 * @member {FunctionType} toPlain - Return properties as a plain string 
 * @member {FunctionType} toEntries - Return properties as a set of entries
 * @member {FunctionType} getPropertyKeys - Return a list of property keys
 * @member {FunctionType} getPropertyType - Return a string type of a property
 * @member {FunctionType} validateProperty - Return a validation result of a property
 * @member {FunctionType} validateProperties - Return a list of validation results of all properties
 */
export interface EntityInterface {
  toJson(): MappedKeyType<OmitType<this, FunctionType>>;
  toPlain(): string;
  toEntries(): readonly [string, unknown][];

  getPropertyKeys<K extends keyof OmitType<this, FunctionType>>(): K[];
  getPropertyType<K extends keyof OmitType<this, FunctionType>>(propertyKey: K): string;

  validateProperty<K extends keyof OmitType<this, FunctionType>>(propertyKey: K, onlyResultWithKeys?: Array<ValidationEnum>, entity?: EntityInterface): Promise<Array<ValidationResultType> | any>;
  validateProperties(onlyResultWithKeys?: Array<ValidationEnum>, entity?: EntityInterface): Promise<MappedPropertiesType<this, ValidationResultType[] | any> | undefined>

  validatePropertiesToString(onlyResultWithKeys?: Array<ValidationEnum>, parentKey?: string, entity?: EntityInterface): Promise<string>
}

export default {};