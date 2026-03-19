import Exception from '~/common/services/exception.service.ts';

export class WebSocketException extends Exception<'NOT_CONNECTED'> {}

export default WebSocketException;
