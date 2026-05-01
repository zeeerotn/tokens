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

export class SomeValidation implements AnnotationInterface, ValidationInterface {
  name: string = 'Some'

  accepts?: AcceptType[] | undefined = [
    isNull,
    isUndefined,
    isString,
    isNumber
  ]

  validations? = [
    (record: any, _comparison: any): boolean => isNull(record),
    (record: any, _comparison: any): boolean => isUndefined(record),
    (record: any, comparison: any): boolean =>  isArray(comparison) && comparison.some((v: any) => v === record),
  ]

  constructor(public comparison: (string | number)[]) {}

  onAttach(_artifact: ArtifactType, _decorator: DecoratorType) { }

  onInitialize(_artifact: ArtifactType, _decorator: DecoratorType) { }

  onValidation(record: any): Promise<OnValidationResultType> {

    if (this.validations?.some(v => v(record, this.comparison) == true)) {
      return Promise.resolve({ key: ValidationEnum.VALID });
    }

    return Promise.resolve({ key: ValidationEnum.INVALID, name: `Some (${this.comparison.join(', ')})` });
  }
}

export default SomeValidation;
