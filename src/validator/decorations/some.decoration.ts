import type { DecorationFunctionType } from '~/decorator/types.ts';

import Decorator from '~/decorator/services/decorator.service.ts';
import SomeValidation from '~/validator/validations/some.validation.ts';

export const Some: DecorationFunctionType<typeof SomeValidation> = Decorator.create(SomeValidation)

export default Some
