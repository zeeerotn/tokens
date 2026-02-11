import type { AnnotationInterface } from '~/decorator/interfaces.ts';
import type { ValidationInterface } from '~/validator/interfaces.ts';
import type { AcceptType, ArtifactType } from '~/common/types.ts';
import type { DecoratorType } from '~/decorator/types.ts';
import ValidationEnum from '~/validator/enums/validation.enum.ts';

import isNull from '~/common/guards/is-null.guard.ts';
import isUndefined from '~/common/guards/is-undefined.guard.ts';
import isString from '~/common/guards/is-string.guard.ts';
import isDate from '~/common/guards/is-date.guard.ts';
import isFunction from '~/common/guards/is-function.guard.ts';

export class RequiredValidation implements AnnotationInterface, ValidationInterface {
  name: string = 'Required'

  accepts?: AcceptType[] | undefined = [
    isNull,
    isUndefined,
    isString,
    isDate,
  ]
  
  validations? = [
    (record: any): boolean => !isString(record) && !isNull(record) && !isUndefined(record),
    (record: any): boolean => isString(record) && !!record
  ]

  constructor(public predicate?: (entity: any) => boolean) {}

  onAttach(_artifact: ArtifactType, _decorator: DecoratorType) { }
  
  onInitialize(_artifact: ArtifactType, _decorator: DecoratorType) { }

  onValidation(record: any, entity?: any): Promise<ValidationEnum> {
    if (this.predicate && isFunction(this.predicate) && !isUndefined(entity) && !isNull(entity)) {
      if (!this.predicate(entity)) {
        return Promise.resolve(ValidationEnum.VALID);
      }
    }

    if (this.validations?.some(v => v(record) == true)) { 
      return Promise.resolve(ValidationEnum.VALID);
    }

    return Promise.resolve(ValidationEnum.INVALID);
  }
}

export default RequiredValidation

