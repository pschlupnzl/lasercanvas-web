(function (LaserCanvas) {
  /**
   * Single Graph Collection item containing a 2d heatmap graph, suitable e.g.
   * for plotting the cavity stability.
   * Broadly matches the {@link GraphItem} interface.
   * @param {System|Element} source Data source.
   * @param {string} propertyName Name of property on the data source.
   * @param {string=} fieldName Optional field for ABCD/Q type properties.
   * @param {string=} variableName Optional variable to plot against, default "x".
   */
  var Graph2dItem = function (source, propertyName, fieldName) {
    this._source = source;
    this._propertyName = propertyName;
    this._fieldName = fieldName;
    this._variableNames = ["x", "y"];
    this.graph2d = new LaserCanvas.Graph2d();
    this.el = this.init();
  };

  // ------------
  //  Accessors.
  // ------------

  // Much of this is the same as GraphItem.
  
  /**
   * Returns the crrent variable dependencies.
   * @returns {string[]}
   */
  Graph2dItem.prototype.variableNames = function () {
    return this._variableNames;
  };

  /** Returns this item's source. */
  Graph2dItem.prototype.source = function () {
    return this._source;
  };

  /** Returns a serializable representation of the item. */
  Graph2dItem.prototype.toJson = function () {
    return {
      sourceType: this._source.type,
      sourceName: this._source.name,
      propertyName: this._propertyName,
      fieldName: this._fieldName,
      variableName: this._variableName,
    };
  };

  /**
   * Returns the source corresponding to a previously serialized graph item.
   * If there are multiple elements of the same type and name, then the first
   * matching item is returned. If no match is found, returns `undefined`.
   * @param {object} json Serialized representation of the graph item to create.
   * @param {System} system Reference to system whose properties to check.
   * @param {Array<Element>} elements Reference to system's elements.
   */
  Graph2dItem.sourceFromJson = function (json, system, elements) {
    if (json.sourceType === "System") {
      return system;
    }
    return elements.find(function (element) {
      return (
        element.type === json.sourceType && element.name === json.sourceName
      );
    });
  };

  /** Returns a value indicating whether this item matches the properties. */
  Graph2dItem.prototype.isEqual = function (source, propertyName, fieldName) {
    return (
      source === this._source &&
      propertyName === this._propertyName &&
      (!fieldName || fieldName === this._fieldName)
    );
  };

  LaserCanvas.Graph2dItem = Graph2dItem;
})(window.LaserCanvas);
