import type { AnnotationInterface } from '~/decorator/interfaces.ts';
import type { ValidationInterface } from '~/validator/interfaces.ts';
import type { AcceptType, ArtifactType } from '~/common/types.ts';
import type { DecoratorType } from '~/decorator/types.ts';
import type { OnValidationResultType } from '~/validator/types.ts';

import ValidationEnum from '~/validator/enums/validation.enum.ts';

import isNull from '~/common/guards/is-null.guard.ts';
import isUndefined from '~/common/guards/is-undefined.guard.ts';
import isArray from '~/common/guards/is-array.guard.ts';
import isString from '~/common/guards/is-string.guard.ts';
import isNumber from '~/common/guards/is-number.guard.ts';
import isDate from '~/common/guards/is-date.guard.ts';

export class LessThanEqualValidation implements AnnotationInterface, ValidationInterface {
  name: string = 'LessThanEqual'

  accepts?: AcceptType[] | undefined = [
    isNull,
    isUndefined,
    isArray,
    isString,
    isNumber,
    isDate
  ]
  
  validations? = [
    (record: any, _comparison: any): boolean => isNull(record),
    (record: any, _comparison: any): boolean => isUndefined(record),
    (record: any, comparison: any): boolean => isArray(record) && record.length <= Number(comparison),
    (record: any, comparison: any): boolean => isString(record) && isNumber(comparison) && record.length <= Number(comparison),
    (record: any, comparison: any): boolean => isString(record) && isString(comparison) && record <= String(comparison),
    (record: any, comparison: any): boolean => isNumber(record) && record <= Number(comparison),
    (record: any, comparison: any): boolean => isDate(record) && isDate(comparison) && record <= comparison,
    (record: any, comparison: any): boolean => isDate(record) && record <= new Date(comparison),
  ]
  
  constructor(public comparison: number | string | Date | any[]) {}

  onAttach(_artifact: ArtifactType, _decorator: DecoratorType) { }
  
  onInitialize(_artifact: ArtifactType, _decorator: DecoratorType) { }

  onValidation(record: any): Promise<OnValidationResultType> {
    if (this.validations?.some(v => v(record, this.comparison) == true)) { 
      return Promise.resolve({ key: ValidationEnum.VALID });
    }

    return Promise.resolve({ key: ValidationEnum.INVALID });
  }
}

export default LessThanEqualValidation
