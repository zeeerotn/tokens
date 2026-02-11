import { describe, it } from '@std/bdd';
import { expect } from '@std/expect';

import Validator from '~/validator/services/validator.service.ts';
import ValidationEnum from '~/validator/enums/validation.enum.ts';

import Regex from '~/validator/validations/regex.validation.ts';

describe('regex validation', () => {
  const testEntity = {
    firstName: 'Eduardo',
  };

  const validate = async (value: any, ...parameters: any[]) => {
    const validation = [new Regex(parameters[0])];
    return (await Validator.validateValue(value, undefined, validation))[0].key;
  };

  it('string', async () => {
    expect(await validate(testEntity.firstName, 'Eduardo')).toBe(ValidationEnum.VALID);
  });

  it('reg exp', async () => {
    expect(await validate(testEntity.firstName, /ard/)).toBe(ValidationEnum.VALID);
  });
});
