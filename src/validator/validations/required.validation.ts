import type { AnnotationInterface } from '~/decorator/interfaces.ts';
import type { ValidationInterface } from '~/validator/interfaces.ts';
import type { AcceptType, ArtifactType } from '~/common/types.ts';
import type { DecoratorType } from '~/decorator/types.ts';
import type { OnValidationResultType } from '~/validator/types.ts';

import ValidationEnum from '~/validator/enums/validation.enum.ts';

import isNull from '~/common/guards/is-null.guard.ts';
import isUndefined from '~/common/guards/is-undefined.guard.ts';
import isString from '~/common/guards/is-string.guard.ts';
import isDate from '~/common/guards/is-date.guard.ts';
import isFunction from '~/common/guards/is-function.guard.ts';
import isObject from '~/common/guards/is-object.guard.ts';
import isNumber from '~/common/guards/is-number.guard.ts';

export class RequiredValidation implements AnnotationInterface, ValidationInterface {
  name: string = 'Required'

  accepts?: AcceptType[] | undefined = [
    isNull,
    isUndefined,
    isString,
    isNumber,
    isDate,
    isObject
  ]
  
  validations? = [
    (record: any): boolean => !isString(record) && !isNull(record) && !isUndefined(record),
    (record: any): boolean => isString(record) && !!record,
    (record: any): boolean => isNumber(record) && !isNaN(record),
    (record: any): boolean => isDate(record) && !isNaN(record.getTime()),
    (record: any): boolean => isObject(record) && Object.keys(record).length > 0
  ]

  constructor(public predicate?: (entity: any) => boolean) {}

  onAttach(_artifact: ArtifactType, _decorator: DecoratorType) { }
  
  onInitialize(_artifact: ArtifactType, _decorator: DecoratorType) { }

  onValidation(record: any, entity?: any): Promise<OnValidationResultType> {
    if (this.predicate && isFunction(this.predicate) && !isUndefined(entity) && !isNull(entity)) {
      if (!this.predicate(entity)) {
        return Promise.resolve({ key: ValidationEnum.VALID });
      }
    }

    if (this.validations?.some(v => v(record) == true)) { 
      return Promise.resolve({ key: ValidationEnum.VALID });
    }

    return Promise.resolve({ key: ValidationEnum.INVALID });
  }
}

export default RequiredValidation

