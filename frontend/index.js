import { backend } from 'declarations/backend';

class GemScape {
  constructor() {
    this.canvas = document.getElementById('gemscape-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.shapes = [];
    this.isDragging = false;
    this.isResizing = false;
    this.selectedShape = null;
    this.resizeHandle = null;
    this.offsetX = 0;
    this.offsetY = 0;

    this.initCanvas();
    this.addEventListeners();
    this.loadShapes();
  }

  initCanvas() {
    this.canvas.width = window.innerWidth - 40;
    this.canvas.height = window.innerHeight - 100;
  }

  addEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  async loadShapes() {
    try {
      this.shapes = await backend.getAllShapes();
      this.redrawCanvas();
    } catch (error) {
      console.error('Error loading shapes:', error);
    }
  }

  async saveShape(shape) {
    try {
      await backend.addShape(shape);
    } catch (error) {
      console.error('Error saving shape:', error);
    }
  }

  async updateShape(shape) {
    try {
      await backend.updateShape(shape);
    } catch (error) {
      console.error('Error updating shape:', error);
    }
  }

  async deleteShape(id) {
    try {
      await backend.deleteShape(id);
    } catch (error) {
      console.error('Error deleting shape:', error);
    }
  }

  handleMouseDown(e) {
    const mouseX = e.clientX - this.canvas.offsetLeft;
    const mouseY = e.clientY - this.canvas.offsetTop;

    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const shape = this.shapes[i];
      if (this.isPointInShape(mouseX, mouseY, shape)) {
        this.selectedShape = shape;
        this.isDragging = true;
        this.offsetX = mouseX - shape.x;
        this.offsetY = mouseY - shape.y;
        this.resizeHandle = this.getResizeHandle(mouseX, mouseY, shape);
        if (this.resizeHandle) {
          this.isResizing = true;
        }
        return;
      }
    }
  }

  handleMouseMove(e) {
    const mouseX = e.clientX - this.canvas.offsetLeft;
    const mouseY = e.clientY - this.canvas.offsetTop;

    if (this.isDragging && this.selectedShape) {
      if (this.isResizing) {
        this.resizeShape(mouseX, mouseY);
      } else {
        this.selectedShape.x = mouseX - this.offsetX;
        this.selectedShape.y = mouseY - this.offsetY;
      }
      this.redrawCanvas();
    } else {
      this.updateCursor(mouseX, mouseY);
    }
  }

  handleMouseUp() {
    if (this.selectedShape) {
      this.updateShape(this.selectedShape);
    }
    this.isDragging = false;
    this.isResizing = false;
    this.selectedShape = null;
    this.resizeHandle = null;
  }

  handleDoubleClick(e) {
    const mouseX = e.clientX - this.canvas.offsetLeft;
    const mouseY = e.clientY - this.canvas.offsetTop;
    const shapeTypes = ['Circle', 'Square', 'Line', 'Triangle', 'Ellipse'];
    const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const newShape = {
      id: Date.now().toString(),
      shapeType: randomType,
      x: mouseX,
      y: mouseY,
      width: 50,
      height: 50,
      color: this.getRandomColor()
    };
    this.shapes.push(newShape);
    this.saveShape(newShape);
    this.redrawCanvas();
  }

  handleResize() {
    this.initCanvas();
    this.redrawCanvas();
  }

  redrawCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.shapes.forEach(shape => this.drawShape(shape));
  }

  drawShape(shape) {
    this.ctx.fillStyle = shape.color;
    this.ctx.beginPath();

    switch (shape.shapeType) {
      case 'Circle':
        this.ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, 0, 2 * Math.PI);
        break;
      case 'Square':
        this.ctx.rect(shape.x, shape.y, shape.width, shape.height);
        break;
      case 'Line':
        this.ctx.moveTo(shape.x, shape.y);
        this.ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        break;
      case 'Triangle':
        this.ctx.moveTo(shape.x + shape.width / 2, shape.y);
        this.ctx.lineTo(shape.x, shape.y + shape.height);
        this.ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        this.ctx.closePath();
        break;
      case 'Ellipse':
        this.ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, 2 * Math.PI);
        break;
    }

    this.ctx.fill();
  }

  isPointInShape(x, y, shape) {
    return x >= shape.x && x <= shape.x + shape.width &&
           y >= shape.y && y <= shape.y + shape.height;
  }

  getResizeHandle(x, y, shape) {
    const handleSize = 10;
    const corners = [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x, y: shape.y + shape.height },
      { x: shape.x + shape.width, y: shape.y + shape.height }
    ];

    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      if (Math.abs(x - corner.x) <= handleSize && Math.abs(y - corner.y) <= handleSize) {
        return i;
      }
    }
    return null;
  }

  resizeShape(mouseX, mouseY) {
    const shape = this.selectedShape;
    switch (this.resizeHandle) {
      case 0: // Top-left
        shape.width += shape.x - mouseX;
        shape.height += shape.y - mouseY;
        shape.x = mouseX;
        shape.y = mouseY;
        break;
      case 1: // Top-right
        shape.width = mouseX - shape.x;
        shape.height += shape.y - mouseY;
        shape.y = mouseY;
        break;
      case 2: // Bottom-left
        shape.width += shape.x - mouseX;
        shape.height = mouseY - shape.y;
        shape.x = mouseX;
        break;
      case 3: // Bottom-right
        shape.width = mouseX - shape.x;
        shape.height = mouseY - shape.y;
        break;
    }
  }

  updateCursor(mouseX, mouseY) {
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const shape = this.shapes[i];
      const resizeHandle = this.getResizeHandle(mouseX, mouseY, shape);
      if (resizeHandle !== null) {
        this.canvas.style.cursor = resizeHandle % 2 === 0 ? 'nwse-resize' : 'nesw-resize';
        return;
      }
      if (this.isPointInShape(mouseX, mouseY, shape)) {
        this.canvas.style.cursor = 'move';
        return;
      }
    }
    this.canvas.style.cursor = 'default';
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GemScape();
});
