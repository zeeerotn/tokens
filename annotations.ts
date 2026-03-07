import ConsumerAnnotation from '~/container/annotations/consumer.annotation.ts';
import DebugAnnotation from '~/common/annotations/debug.annotation.ts';
import DescriptorAnnotation from '~/common/annotations/descriptor.annotation.ts';
import NewableAnnotation from '~/common/annotations/newable.annotation.ts';
import PackAnnotation from '~/packer/annotations/pack.annotation.ts';
import SingletonAnnotation from '~/common/annotations/singleton.annotation.ts';

export { default as ConsumerAnnotation } from '~/container/annotations/consumer.annotation.ts';
export { default as DebugAnnotation } from '~/common/annotations/debug.annotation.ts';
export { default as DescriptorAnnotation } from '~/common/annotations/descriptor.annotation.ts';
export { default as NewableAnnotation } from '~/common/annotations/newable.annotation.ts';
export { default as PackAnnotation } from '~/packer/annotations/pack.annotation.ts';
export { default as SingletonAnnotation } from '~/common/annotations/singleton.annotation.ts';

export default {
  ConsumerAnnotation,
  DebugAnnotation,
  DescriptorAnnotation,
  NewableAnnotation,
  PackAnnotation,
  SingletonAnnotation,
}