import type { ValidationInterface } from '~/validator/interfaces.ts';

import ValidationEnum from '~/validator/enums/validation.enum.ts';

/**
 * Validation that binds the validation logic with parameters
 * 
 * @type ValidationType
 */ 
export type ValidationType = {
  target: ValidationInterface;
  parameters?: any[];
};

export type OnValidationResultType = { key: ValidationEnum, name?: string };

/**
 * The result of the validation
 * 
 * @type ValidationResultType
 */ 
export type ValidationResultType = {
  key: ValidationEnum;
  name: string;
  parameters?: any;
};

export default {};