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
  stable var shapes : [(Text, Shape)] = [];

  // HashMap to store shapes in memory
  var shapesMap = HashMap.HashMap<Text, Shape>(0, Text.equal, Text.hash);

  // Initialize shapesMap from stable shapes on upgrade
  system func preupgrade() {
    shapes := Iter.toArray(shapesMap.entries());
  };

  system func postupgrade() {
    shapesMap := HashMap.fromIter<Text, Shape>(shapes.vals(), 0, Text.equal, Text.hash);
  };

  // Add a new shape
  public func addShape(shape: Shape) : async () {
    shapesMap.put(shape.id, shape);
  };

  // Update an existing shape
  public func updateShape(shape: Shape) : async () {
    shapesMap.put(shape.id, shape);
  };

  // Delete a shape
  public func deleteShape(id: Text) : async () {
    shapesMap.delete(id);
  };

  // Get all shapes
  public query func getAllShapes() : async [Shape] {
    Iter.toArray(shapesMap.vals())
  };

  // Clear all shapes
  public func clearAllShapes() : async () {
    shapesMap := HashMap.HashMap<Text, Shape>(0, Text.equal, Text.hash);
  };
}
