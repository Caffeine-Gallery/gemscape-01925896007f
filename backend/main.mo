import Hash "mo:base/Hash";

import Array "mo:base/Array";
import Float "mo:base/Float";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Text "mo:base/Text";

actor {
  // Shape types
  type ShapeType = {
    #Circle;
    #Square;
    #Line;
    #Triangle;
    #Ellipse;
  };

  // Shape structure
  type Shape = {
    id: Text;
    shapeType: ShapeType;
    x: Float;
    y: Float;
    width: Float;
    height: Float;
    color: Text;
  };

  // Stable variable to store shapes
  stable var shapes : [Shape] = [];

  // Add a new shape
  public func addShape(shape: Shape) : async () {
    shapes := Array.append(shapes, [shape]);
  };

  // Update an existing shape
  public func updateShape(shape: Shape) : async () {
    shapes := Array.map<Shape, Shape>(shapes, func (s) {
      if (s.id == shape.id) { shape } else { s }
    });
  };

  // Delete a shape
  public func deleteShape(id: Text) : async () {
    shapes := Array.filter<Shape>(shapes, func (s) { s.id != id });
  };

  // Get all shapes
  public query func getAllShapes() : async [Shape] {
    shapes
  };

  // Clear all shapes
  public func clearAllShapes() : async () {
    shapes := [];
  };
}
