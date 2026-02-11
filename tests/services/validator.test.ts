import { describe, it } from '@std/bdd';
import { expect } from '@std/expect';

import Validator from '~/validator/services/validator.service.ts';
import ValidationEnum from '~/validator/enums/validation.enum.ts';
import Required from '~/validator/decorations/required.decoration.ts';
import RequiredValidation from '~/validator/validations/required.validation.ts';
import Factory from '~/common/services/factory.service.ts';


describe('validator', () => {
  class UserMock {
    @Required()
    firstName!: string
    lastName?: string
    birthDate?: Date
  }

  const userEntity = Factory.properties(UserMock, { firstName: 'eduardo' });


  it('validateValue method', async () => {
    
    const validations = [new RequiredValidation()];

    const result = await Validator.validateValue(userEntity.lastName, userEntity, validations);

    expect(result[0].key).toBe(ValidationEnum.INVALID);
  });

  it('validateObject method', async () => {
  
    userEntity.firstName = 'Eduardo';
    userEntity.birthDate = new Date();

    const validations = {
      firstName: [new RequiredValidation()],
      birthDate: [new RequiredValidation()],
    };

    const result = await Validator.validateObject(userEntity, validations);

    expect(result).toEqual({
      firstName: [{ key: ValidationEnum.VALID, name: 'Required' }],
      birthDate: [{ key: ValidationEnum.VALID, name: 'Required' }],
      lastName: [{ key: ValidationEnum.UNDEFINED }],
    });
  });
});
