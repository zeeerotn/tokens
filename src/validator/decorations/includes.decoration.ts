import type { DecorationFunctionType } from '~/decorator/types.ts';

import Decorator from '~/decorator/services/decorator.service.ts';
import IncludesValidation from '~/validator/validations/includes.validation.ts';

export const Includes: DecorationFunctionType<typeof IncludesValidation>  = Decorator.create(IncludesValidation)

export default Includes
