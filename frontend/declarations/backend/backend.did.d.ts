import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Shape {
  'x' : number,
  'y' : number,
  'id' : string,
  'height' : number,
  'color' : string,
  'width' : number,
  'shapeType' : ShapeType,
}
export type ShapeType = { 'Line' : null } |
  { 'Triangle' : null } |
  { 'Circle' : null } |
  { 'Square' : null } |
  { 'Ellipse' : null };
export interface _SERVICE {
  'addShape' : ActorMethod<[Shape], undefined>,
  'clearAllShapes' : ActorMethod<[], undefined>,
  'deleteShape' : ActorMethod<[string], undefined>,
  'getAllShapes' : ActorMethod<[], Array<Shape>>,
  'updateShape' : ActorMethod<[Shape], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
