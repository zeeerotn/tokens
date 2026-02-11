import { describe, it } from '@std/bdd';
import { expect } from '@std/expect';

import Validator from '~/validator/services/validator.service.ts';
import ValidationEnum from '~/validator/enums/validation.enum.ts';

import Float from '~/validator/validations/float.validation.ts';

describe('float validation', () => {
  const testEntity = {
    price: '3',
    value: 5,
    amount: '3.34',
    dollar: 7.23,
  };

  const validate = async (value: any) => {
    const validation = [new Float()];
    return (await Validator.validateValue(value, undefined, validation))[0].key;
  };

  it('string', async () => {
    expect(await validate(testEntity.price)).toBe(ValidationEnum.INVALID);
    expect(await validate(testEntity.amount)).toBe(ValidationEnum.VALID);
  });
  
  it('number', async () => {
    expect(await validate(testEntity.value)).toBe(ValidationEnum.INVALID);
    expect(await validate(testEntity.dollar)).toBe(ValidationEnum.VALID);
  });

});
