import type { DecorationFunctionType } from '~/decorator/types.ts';

import Decorator from '~/decorator/services/decorator.service.ts';
import NewableAnnotation from '~/common/annotations/newable.annotation.ts';

export const Newable: DecorationFunctionType<typeof NewableAnnotation> = Decorator.create(NewableAnnotation);

export default Newable;
