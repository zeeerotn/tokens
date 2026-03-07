import type { AcceptType } from '~/common/types.ts';

import { OnValidationResultType } from './types.ts';

/**
 * Validate a value and type
 * Can also be attached to decoration context
 * 
 * @interface ValidationInterface
 *
 * @member {Array<AcceptType>} accepts - A list of accepted validation types
 * @member {Function} onValidation - Called when validation occurs
 */
export interface ValidationInterface {
  accepts?: Array<AcceptType>;
  validations?: Array<(...args: any[]) => boolean>
  onValidation(record: any, ...parameters: any[]): Promise<OnValidationResultType>;
}

export default {};