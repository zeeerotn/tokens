import { describe, it } from '@std/bdd';
import { expect } from '@std/expect';

import Validator from '~/validator/services/validator.service.ts';
import ValidationEnum from '~/validator/enums/validation.enum.ts';
import RequiredValidation from '~/validator/validations/required.validation.ts';

describe('required validation', () => {
  const testEntity = {
    firstName: 'Eduardo',
    lastName: null,
    nonProperty: undefined,
    address: '',
  };

  const validate = async (value: any, entity?: any) => {
    const validation = [new RequiredValidation()];
    return (await Validator.validateValue(value, entity, validation))[0].key;
  };

  it('string', async () => {
    expect(await validate(testEntity.firstName)).toBe(ValidationEnum.VALID);
  });

  it('null', async () => {
    expect(await validate(testEntity.lastName)).toBe(ValidationEnum.INVALID);
  });

  it('undefined', async () => {
    expect(await validate(testEntity.nonProperty)).toBe(ValidationEnum.INVALID);
  });

  it('empty', async () => {
    expect(await validate(testEntity.address)).toBe(ValidationEnum.INVALID);
  });

  describe('with predicate', () => {
    it('basic required without predicate', async () => {
      const validation = [new RequiredValidation()];
      
      expect((await Validator.validateValue('value', {}, validation))[0].key).toBe(ValidationEnum.VALID);
      expect((await Validator.validateValue(null, {}, validation))[0].key).toBe(ValidationEnum.INVALID);
      expect((await Validator.validateValue('', {}, validation))[0].key).toBe(ValidationEnum.INVALID);
    });

    it('field required when email is missing', async () => {
      const entity = { email: null, username: 'john_doe' };
      const validation = [new RequiredValidation((e: any) => !e.email)];
      
      const result = (await Validator.validateValue(entity.username, entity, validation))[0].key;
      expect(result).toBe(ValidationEnum.VALID);
    });

    it('field not required when email exists', async () => {
      const entity = { email: 'test@example.com', username: null };
      const validation = [new RequiredValidation((e: any) => !e.email)];
      
      const result = (await Validator.validateValue(entity.username, entity, validation))[0].key;
      expect(result).toBe(ValidationEnum.VALID);
    });

    it('invalid when required but missing', async () => {
      const entity = { email: null, username: null };
      const validation = [new RequiredValidation((e: any) => !e.email)];
      
      const result = (await Validator.validateValue(entity.username, entity, validation))[0].key;
      expect(result).toBe(ValidationEnum.INVALID);
    });

    it('complex predicate condition', async () => {
      const entity = { 
        username: null, 
        created_at: new Date('2020-01-01'),
        status: 'active'
      };
      
      const validation = [new RequiredValidation(
        (e: any) => !e.username || e.created_at <= new Date()
      )];
      
      const result = (await Validator.validateValue(entity.status, entity, validation))[0].key;
      expect(result).toBe(ValidationEnum.VALID);
    });

    it('predicate returns false makes field not required', async () => {
      const entity = { loginType: 'oauth', password: null };
      const validation = [new RequiredValidation((e: any) => e.loginType === 'credentials')];
      
      const result = (await Validator.validateValue(entity.password, entity, validation))[0].key;
      expect(result).toBe(ValidationEnum.VALID);
    });

    it('predicate returns true and field has value', async () => {
      const entity = { loginType: 'credentials', password: 'secret' };
      const validation = [new RequiredValidation((e: any) => e.loginType === 'credentials')];
      
      const result = (await Validator.validateValue(entity.password, entity, validation))[0].key;
      expect(result).toBe(ValidationEnum.VALID);
    });

    it('predicate returns true but value missing', async () => {
      const entity = { loginType: 'credentials', password: null };
      const validation = [new RequiredValidation((e: any) => e.loginType === 'credentials')];
      
      const result = (await Validator.validateValue(entity.password, entity, validation))[0].key;
      expect(result).toBe(ValidationEnum.INVALID);
    });
  });
});
