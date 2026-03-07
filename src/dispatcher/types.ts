

// // ---------------------------------------------------------------------------
// // Internal scheduling type (not sent on the wire directly)
// // ---------------------------------------------------------------------------

// export type PublishPolicyType = {
//   ackTtlMs?: number;
//   maxAttempts?: number;
//   scheduledAt?: number;
// };

// export type PublishType<T = unknown> = {
//   id: string;
//   event: string;
//   payload: T;
//   source: string;
//   routing: RoutingEnum;
//   policy: PublishPolicyType;
//   timestamp: number;
//   attempt: number;
// };

// // ---------------------------------------------------------------------------
// // Wire types — compose ACK/NACK wire type strings from the enum:
// //   `${EnvelopeTypeEnum.CONNECT}:${EnvelopeTypeEnum.ACK}` → 'CONNECT:ACK'
// // ---------------------------------------------------------------------------

// export type EnvelopeAckType =
//   `${EnvelopeTypeEnum}:${EnvelopeTypeEnum.ACK | EnvelopeTypeEnum.NACK}`;

// /** Value carried in label.type — either a base type or a composed ACK/NACK. */
// export type LabelWireType = EnvelopeTypeEnum | EnvelopeAckType;

// /**
//  * The label carries routing and correlation metadata.
//  *   id    — client-assigned correlation id (echoed back in ACK)
//  *   did   — broker-assigned dispatch id (only present in DISPATCH frames)
//  *   type  — wire type (see EnvelopeTypeEnum / LabelWireType)
//  *   event — event key — present for PUBLISH / SUBSCRIBE / DISPATCH flows
//  */
// export type LabelType = {
//   id?: string;
//   did?: string;
//   type: LabelWireType;
//   event?: string;
// };

// /** Base wire envelope. Every WebSocket frame shares this shape. */
// export type EnvelopeType<T = unknown> = {
//   label: LabelType;
//   content?: T;
// };

// // ---------------------------------------------------------------------------
// // Typed envelopes per flow
// // ---------------------------------------------------------------------------

// // CONNECT: client → broker
// export type ConnectContentType = {
//   version: string;
//   service: string;
//   instance: string;
//   authorization: string;
// };
// export type ConnectEnvelopeType = EnvelopeType<ConnectContentType> & {
//   label: LabelType & { type: EnvelopeTypeEnum.CONNECT };
// };

// // CONNECT:ACK: broker → client  (label.id = broker-assigned connectionId)
// export type ConnectAckEnvelopeType = EnvelopeType<never> & {
//   label: LabelType & {
//     type: `${EnvelopeTypeEnum.CONNECT}:${EnvelopeTypeEnum.ACK}`;
//     id: string;
//   };
// };

// // PUBLISH: client → broker
// export type PublishEnvelopeType<T = unknown> = EnvelopeType<T> & {
//   label: LabelType & {
//     type: EnvelopeTypeEnum.PUBLISH;
//     event: string;
//     routing?: RoutingEnum;
//     maxAttempts?: number;
//   };
// };

// // PUBLISH:ACK: broker → client  (label.id echoed)
// export type PublishAckEnvelopeType = EnvelopeType<never> & {
//   label: LabelType & {
//     type: `${EnvelopeTypeEnum.PUBLISH}:${EnvelopeTypeEnum.ACK}`;
//     event: string;
//   };
// };

// // SUBSCRIBE: client → broker
// export type SubscribeContentType = {
//   filter?: Record<string, unknown>;
// };
// export type SubscribeEnvelopeType = EnvelopeType<SubscribeContentType> & {
//   label: LabelType & { type: EnvelopeTypeEnum.SUBSCRIBE; event: string };
// };

// // SUBSCRIBE:ACK: broker → client  (label.id echoed)
// export type SubscribeAckEnvelopeType = EnvelopeType<never> & {
//   label: LabelType & {
//     type: `${EnvelopeTypeEnum.SUBSCRIBE}:${EnvelopeTypeEnum.ACK}`;
//     event: string;
//   };
// };

// // DISPATCH: broker → client
// export type DispatchEnvelopeType<T = unknown> = EnvelopeType<T> & {
//   label: LabelType & {
//     type: EnvelopeTypeEnum.DISPATCH;
//     id: string;
//     did: string;
//     event: string;
//   };
// };

// // DISPATCH:ACK — client → broker  (no content; label.id is the dispatch id)
// export type DispatchAckEnvelopeType = EnvelopeType<never> & {
//   label: LabelType & {
//     type: `${EnvelopeTypeEnum.DISPATCH}:${EnvelopeTypeEnum.ACK}`;
//     id: string;
//     event: string;
//   };
// };

// // DISPATCH:NACK — client → broker  (reason in content)
// export type DispatchNackEnvelopeType = EnvelopeType<{ reason: string }> & {
//   label: LabelType & {
//     type: `${EnvelopeTypeEnum.DISPATCH}:${EnvelopeTypeEnum.NACK}`;
//     id: string;
//     event: string;
//   };
// };

// export default {};
