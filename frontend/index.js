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
    this.currentTool = 'Circle';
    this.currentColor = '#FF0000';
    this.isDrawingLine = false;
    this.lineStartPoint = null;
    this.colorPalette = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    this.colorIndex = 0;

    this.initCanvas();
    this.addEventListeners();
    this.loadShapes();
    this.initToolbox();
  }

  initCanvas() {
    this.canvas.width = window.innerWidth - 40;
    this.canvas.height = window.innerHeight - 150;
  }

  addEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  initToolbox() {
    const toolbox = document.getElementById('toolbox');
    toolbox.addEventListener('click', (e) => {
      if (e.target.classList.contains('tool')) {
        this.setCurrentTool(e.target.dataset.shape);
      }
    });
    this.setCurrentTool('Circle');
    this.drawToolboxShapes();
  }

  drawToolboxShapes() {
    document.querySelectorAll('.tool').forEach(tool => {
      const ctx = tool.getContext('2d');
      ctx.clearRect(0, 0, tool.width, tool.height);
      ctx.fillStyle = this.currentColor;
      
      switch (tool.dataset.shape) {
        case 'Circle':
          ctx.beginPath();
          ctx.arc(20, 20, 15, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'Square':
          ctx.fillRect(5, 5, 30, 30);
          break;
        case 'Line':
          ctx.beginPath();
          ctx.moveTo(5, 5);
          ctx.lineTo(35, 35);
          ctx.lineWidth = 2;
          ctx.strokeStyle = this.currentColor;
          ctx.stroke();
          break;
        case 'Triangle':
          ctx.beginPath();
          ctx.moveTo(20, 5);
          ctx.lineTo(5, 35);
          ctx.lineTo(35, 35);
          ctx.closePath();
          ctx.fill();
          break;
        case 'Ellipse':
          ctx.beginPath();
          ctx.ellipse(20, 20, 15, 10, 0, 0, 2 * Math.PI);
          ctx.fill();
          break;
      }
    });
  }

  setCurrentTool(shape) {
    this.currentTool = shape;
    document.querySelectorAll('.tool').forEach(tool => {
      tool.classList.toggle('active', tool.dataset.shape === shape);
    });
    this.colorIndex = (this.colorIndex + 1) % this.colorPalette.length;
    this.currentColor = this.colorPalette[this.colorIndex];
    this.drawToolboxShapes();
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

    if (this.currentTool === 'Line' && !this.isDrawingLine) {
      this.isDrawingLine = true;
      this.lineStartPoint = { x: mouseX, y: mouseY };
      return;
    }

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

    this.createShape(mouseX, mouseY);
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
    } else if (this.isDrawingLine) {
      this.redrawCanvas();
      this.ctx.beginPath();
      this.ctx.moveTo(this.lineStartPoint.x, this.lineStartPoint.y);
      this.ctx.lineTo(mouseX, mouseY);
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    } else {
      this.updateCursor(mouseX, mouseY);
    }
  }

  handleMouseUp(e) {
    if (this.selectedShape) {
      this.updateShape(this.selectedShape);
    }
    if (this.isDrawingLine) {
      const mouseX = e.clientX - this.canvas.offsetLeft;
      const mouseY = e.clientY - this.canvas.offsetTop;
      this.createShape(mouseX, mouseY);
      this.isDrawingLine = false;
      this.lineStartPoint = null;
    }
    this.isDragging = false;
    this.isResizing = false;
    this.selectedShape = null;
    this.resizeHandle = null;
  }

  handleResize() {
    this.initCanvas();
    this.redrawCanvas();
  }

  createShape(mouseX, mouseY) {
    let newShape;
    switch (this.currentTool) {
      case 'Circle':
        newShape = {
          id: Date.now().toString(),
          shapeType: 'Circle',
          x: mouseX - 25,
          y: mouseY - 25,
          width: 50,
          height: 50,
          color: this.currentColor
        };
        break;
      case 'Square':
        newShape = {
          id: Date.now().toString(),
          shapeType: 'Square',
          x: mouseX - 25,
          y: mouseY - 25,
          width: 50,
          height: 50,
          color: this.currentColor
        };
        break;
      case 'Line':
        if (this.lineStartPoint) {
          newShape = {
            id: Date.now().toString(),
            shapeType: 'Line',
            x: this.lineStartPoint.x,
            y: this.lineStartPoint.y,
            width: mouseX - this.lineStartPoint.x,
            height: mouseY - this.lineStartPoint.y,
            color: this.currentColor
          };
        }
        break;
      case 'Triangle':
        newShape = {
          id: Date.now().toString(),
          shapeType: 'Triangle',
          x: mouseX - 25,
          y: mouseY - 25,
          width: 50,
          height: 50,
          color: this.currentColor
        };
        break;
      case 'Ellipse':
        newShape = {
          id: Date.now().toString(),
          shapeType: 'Ellipse',
          x: mouseX - 25,
          y: mouseY - 25,
          width: 50,
          height: 30,
          color: this.currentColor
        };
        break;
    }
    if (newShape) {
      this.shapes.push(newShape);
      this.saveShape(newShape);
      this.redrawCanvas();
    }
  }

  redrawCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.shapes.forEach(shape => this.drawShape(shape));
  }

  drawShape(shape) {
    this.ctx.fillStyle = shape.color;
    this.ctx.strokeStyle = shape.color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    switch (shape.shapeType) {
      case 'Circle':
        this.ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, 0, 2 * Math.PI);
        this.ctx.fill();
        break;
      case 'Square':
        this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        break;
      case 'Line':
        this.ctx.moveTo(shape.x, shape.y);
        this.ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        this.ctx.stroke();
        break;
      case 'Triangle':
        this.ctx.moveTo(shape.x + shape.width / 2, shape.y);
        this.ctx.lineTo(shape.x, shape.y + shape.height);
        this.ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      case 'Ellipse':
        this.ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        break;
    }
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
    this.canvas.style.cursor = this.currentTool === 'Line' && this.isDrawingLine ? 'crosshair' : 'default';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GemScape();
});
