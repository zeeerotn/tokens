import AnnotationException from '~/decorator/exceptions/annotation.exception.ts';
import WebSocketException from '~/messenger/exceptions/web-socket.exception.ts';

export { default as AnnotationException } from '~/decorator/exceptions/annotation.exception.ts';
export { default as WebSocketException } from '~/messenger/exceptions/web-socket.exception.ts';

export default {
  AnnotationException,
  WebSocketException,
}
