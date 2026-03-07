import type { AnnotationInterface } from '~/decorator/interfaces.ts';
import type { DecoratorType } from '~/decorator/types.ts';
import type { ArtifactType, NewableType } from '~/common/types.ts';

import AnnotationException from '~/decorator/exceptions/annotation.exception.ts';
import DecoratorKindEnum from '~/decorator/enums/decorator-kind.enum.ts';

export class NewableAnnotation implements AnnotationInterface {
  name: string = 'Newable';

  constructor(public type: NewableType<any>) {}

  onAttach(artifact: ArtifactType, decorator: DecoratorType): any {
    if (
      decorator.decoration.kind == DecoratorKindEnum.FIELD ||
      decorator.decoration.kind == DecoratorKindEnum.ACCESSOR
    ) {
      return artifact.target;
    }

    throw new AnnotationException('Method not implemented for {name} on {kind}.', {
      key: 'NOT_IMPLEMENTED',
      context: { name: artifact.name, kind: decorator.decoration.kind },
    });
  }

  onInitialize(_artifact: ArtifactType, _decorator: DecoratorType) {}
}

export default NewableAnnotation;
