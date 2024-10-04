export const idlFactory = ({ IDL }) => {
  const ShapeType = IDL.Variant({
    'Line' : IDL.Null,
    'Triangle' : IDL.Null,
    'Circle' : IDL.Null,
    'Square' : IDL.Null,
    'Ellipse' : IDL.Null,
  });
  const Shape = IDL.Record({
    'x' : IDL.Float64,
    'y' : IDL.Float64,
    'id' : IDL.Text,
    'height' : IDL.Float64,
    'color' : IDL.Text,
    'width' : IDL.Float64,
    'shapeType' : ShapeType,
  });
  return IDL.Service({
    'addShape' : IDL.Func([Shape], [], []),
    'clearAllShapes' : IDL.Func([], [], []),
    'deleteShape' : IDL.Func([IDL.Text], [], []),
    'getAllShapes' : IDL.Func([], [IDL.Vec(Shape)], ['query']),
    'updateShape' : IDL.Func([Shape], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
