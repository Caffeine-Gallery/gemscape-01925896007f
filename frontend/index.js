import { backend } from 'declarations/backend';

class GemScape {
  constructor() {
    this.canvas = document.getElementById('gemscape-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.shapes = [];
    this.isDragging = false;
    this.isResizing = false;
    this.isSelecting = false;
    this.selectedShape = null;
    this.selectedShapes = [];
    this.resizeHandle = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.currentTool = 'Circle';
    this.currentColor = '#FF0000';
    this.isDrawingLine = false;
    this.lineStartPoint = null;
    this.colorPalette = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    this.colorIndex = 0;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.isDraggingLineEndpoint = false;
    this.draggedLineEndpoint = null;

    this.initCanvas();
    this.addEventListeners();
    this.initToolbox();
    this.init();
  }

  async init() {
    await this.loadShapes();
    this.redrawCanvas();
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
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.getElementById('reset-button').addEventListener('click', this.resetCanvas.bind(this));
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
      ctx.strokeStyle = this.currentColor;
      
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
        case 'Select':
          ctx.strokeRect(5, 5, 30, 30);
          ctx.beginPath();
          ctx.moveTo(5, 5);
          ctx.lineTo(35, 35);
          ctx.moveTo(35, 5);
          ctx.lineTo(5, 35);
          ctx.stroke();
          break;
      }
    });
  }

  setCurrentTool(shape) {
    this.currentTool = shape;
    document.querySelectorAll('.tool').forEach(tool => {
      tool.classList.toggle('active', tool.dataset.shape === shape);
    });
    if (shape !== 'Select') {
      this.colorIndex = (this.colorIndex + 1) % this.colorPalette.length;
      this.currentColor = this.colorPalette[this.colorIndex];
    }
    this.drawToolboxShapes();
  }

  async loadShapes() {
    try {
      this.shapes = await backend.getAllShapes();
    } catch (error) {
      console.error('Error loading shapes:', error);
      // Implement retry mechanism
      await this.retryLoadShapes();
    }
  }

  async retryLoadShapes(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        this.shapes = await backend.getAllShapes();
        return;
      } catch (error) {
        console.error(`Retry ${i + 1} failed:`, error);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
    console.error('Failed to load shapes after multiple attempts');
  }

  async saveShapes() {
    try {
      await backend.saveShapes(this.shapes);
    } catch (error) {
      console.error('Error saving shapes:', error);
      // Implement retry mechanism
      await this.retrySaveShapes();
    }
  }

  async retrySaveShapes(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await backend.saveShapes(this.shapes);
        return;
      } catch (error) {
        console.error(`Retry ${i + 1} failed:`, error);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
    console.error('Failed to save shapes after multiple attempts');
  }

  async resetCanvas() {
    try {
      await backend.clearAllShapes();
      this.shapes = [];
      this.redrawCanvas();
    } catch (error) {
      console.error('Error resetting canvas:', error);
    }
  }

  handleMouseDown(e) {
    const mouseX = e.clientX - this.canvas.offsetLeft;
    const mouseY = e.clientY - this.canvas.offsetTop;

    if (this.currentTool === 'Select') {
      this.isSelecting = true;
      this.selectionStart = { x: mouseX, y: mouseY };
      this.selectionEnd = { x: mouseX, y: mouseY };
      this.selectedShapes = [];
    } else if (this.currentTool === 'Line' && !this.isDrawingLine) {
      this.isDrawingLine = true;
      this.lineStartPoint = { x: mouseX, y: mouseY };
      return;
    }

    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const shape = this.shapes[i];
      if (this.isPointInShape(mouseX, mouseY, shape)) {
        if (this.currentTool === 'Select') {
          this.selectedShapes = [shape];
          this.redrawCanvas();
          return;
        }
        this.selectedShape = shape;
        this.isDragging = true;
        this.offsetX = mouseX - shape.x;
        this.offsetY = mouseY - shape.y;
        this.resizeHandle = this.getResizeHandle(mouseX, mouseY, shape);
        if (this.resizeHandle) {
          this.isResizing = true;
        } else if (shape.shapeType === 'Line') {
          const endpoint = this.getLineEndpoint(mouseX, mouseY, shape);
          if (endpoint) {
            this.isDraggingLineEndpoint = true;
            this.draggedLineEndpoint = endpoint;
          }
        }
        return;
      }
    }

    if (this.currentTool !== 'Select') {
      this.createShape(mouseX, mouseY);
    }
  }

  handleMouseMove(e) {
    const mouseX = e.clientX - this.canvas.offsetLeft;
    const mouseY = e.clientY - this.canvas.offsetTop;

    if (this.isSelecting) {
      this.selectionEnd = { x: mouseX, y: mouseY };
      this.redrawCanvas();
      this.drawSelectionBox();
    } else if (this.isDragging && this.selectedShape) {
      if (this.isResizing) {
        this.resizeShape(mouseX, mouseY);
      } else if (this.isDraggingLineEndpoint) {
        this.dragLineEndpoint(mouseX, mouseY);
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

  async handleMouseUp(e) {
    if (this.isSelecting) {
      this.finalizeSelection();
    } else if (this.selectedShape) {
      await this.saveShapes();
    } else if (this.isDrawingLine) {
      const mouseX = e.clientX - this.canvas.offsetLeft;
      const mouseY = e.clientY - this.canvas.offsetTop;
      this.createShape(mouseX, mouseY);
      this.isDrawingLine = false;
      this.lineStartPoint = null;
    }
    this.isDragging = false;
    this.isResizing = false;
    this.isSelecting = false;
    this.isDraggingLineEndpoint = false;
    this.draggedLineEndpoint = null;
    this.selectedShape = null;
    this.resizeHandle = null;
    this.redrawCanvas();
  }

  handleResize() {
    this.initCanvas();
    this.redrawCanvas();
  }

  async handleKeyDown(e) {
    if (e.key === 'Delete' && this.selectedShapes.length > 0) {
      await this.deleteSelectedShapes();
    }
  }

  async createShape(mouseX, mouseY) {
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
      await this.saveShapes();
      this.redrawCanvas();
    }
  }

  redrawCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.shapes.forEach(shape => {
      this.drawShape(shape);
      if (this.selectedShapes.includes(shape)) {
        this.drawSelectionBorder(shape);
      }
    });
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

  drawSelectionBorder(shape) {
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    this.ctx.setLineDash([]);
  }

  drawSelectionBox() {
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    const width = this.selectionEnd.x - this.selectionStart.x;
    const height = this.selectionEnd.y - this.selectionStart.y;
    this.ctx.strokeRect(this.selectionStart.x, this.selectionStart.y, width, height);
    this.ctx.setLineDash([]);
  }

  isPointInShape(x, y, shape) {
    if (shape.shapeType === 'Circle' || shape.shapeType === 'Ellipse') {
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      const radiusX = shape.width / 2;
      const radiusY = shape.height / 2;
      return (Math.pow(x - centerX, 2) / Math.pow(radiusX, 2) + Math.pow(y - centerY, 2) / Math.pow(radiusY, 2)) <= 1;
    } else if (shape.shapeType === 'Triangle') {
      const area = this.triangleArea(
        { x: shape.x + shape.width / 2, y: shape.y },
        { x: shape.x, y: shape.y + shape.height },
        { x: shape.x + shape.width, y: shape.y + shape.height }
      );
      const area1 = this.triangleArea(
        { x, y },
        { x: shape.x, y: shape.y + shape.height },
        { x: shape.x + shape.width, y: shape.y + shape.height }
      );
      const area2 = this.triangleArea(
        { x: shape.x + shape.width / 2, y: shape.y },
        { x, y },
        { x: shape.x + shape.width, y: shape.y + shape.height }
      );
      const area3 = this.triangleArea(
        { x: shape.x + shape.width / 2, y: shape.y },
        { x: shape.x, y: shape.y + shape.height },
        { x, y }
      );
      return Math.abs(area - (area1 + area2 + area3)) < 0.1;
    } else if (shape.shapeType === 'Line') {
      const lineLength = Math.sqrt(Math.pow(shape.width, 2) + Math.pow(shape.height, 2));
      const d1 = this.distancePointToPoint(x, y, shape.x, shape.y);
      const d2 = this.distancePointToPoint(x, y, shape.x + shape.width, shape.y + shape.height);
      return Math.abs(d1 + d2 - lineLength) < 0.1;
    } else {
      return x >= shape.x && x <= shape.x + shape.width &&
             y >= shape.y && y <= shape.y + shape.height;
    }
  }

  triangleArea(p1, p2, p3) {
    return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
  }

  distancePointToPoint(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  getResizeHandle(x, y, shape) {
    const handleSize = 10;
    const corners = [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x, y: shape.y + shape.height },
      { x: shape.x + shape.width, y: shape.y + shape.height }
    ];

    if (shape.shapeType === 'Triangle') {
      corners.shift(); // Remove top corner for triangle
    }

    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      if (Math.abs(x - corner.x) <= handleSize && Math.abs(y - corner.y) <= handleSize) {
        return i;
      }
    }
    return null;
  }

  getLineEndpoint(x, y, shape) {
    const handleSize = 10;
    const start = { x: shape.x, y: shape.y };
    const end = { x: shape.x + shape.width, y: shape.y + shape.height };

    if (Math.abs(x - start.x) <= handleSize && Math.abs(y - start.y) <= handleSize) {
      return 'start';
    }
    if (Math.abs(x - end.x) <= handleSize && Math.abs(y - end.y) <= handleSize) {
      return 'end';
    }
    return null;
  }

  async resizeShape(mouseX, mouseY) {
    const shape = this.selectedShape;
    switch (this.resizeHandle) {
      case 0: // Top-left
        if (shape.shapeType !== 'Triangle') {
          shape.width += shape.x - mouseX;
          shape.height += shape.y - mouseY;
          shape.x = mouseX;
          shape.y = mouseY;
        }
        break;
      case 1: // Top-right
        shape.width = mouseX - shape.x;
        if (shape.shapeType !== 'Triangle') {
          shape.height += shape.y - mouseY;
          shape.y = mouseY;
        }
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
    await this.saveShapes();
  }

  async dragLineEndpoint(mouseX, mouseY) {
    const shape = this.selectedShape;
    if (this.draggedLineEndpoint === 'start') {
      shape.width += shape.x - mouseX;
      shape.height += shape.y - mouseY;
      shape.x = mouseX;
      shape.y = mouseY;
    } else if (this.draggedLineEndpoint === 'end') {
      shape.width = mouseX - shape.x;
      shape.height = mouseY - shape.y;
    }
    await this.saveShapes();
  }

  updateCursor(mouseX, mouseY) {
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const shape = this.shapes[i];
      const resizeHandle = this.getResizeHandle(mouseX, mouseY, shape);
      if (resizeHandle !== null) {
        switch (resizeHandle) {
          case 0:
          case 3:
            this.canvas.style.cursor = 'nwse-resize';
            break;
          case 1:
          case 2:
            this.canvas.style.cursor = 'nesw-resize';
            break;
        }
        return;
      }
      if (shape.shapeType === 'Line') {
        const endpoint = this.getLineEndpoint(mouseX, mouseY, shape);
        if (endpoint) {
          this.canvas.style.cursor = 'move';
          return;
        }
      }
      if (this.isPointInShape(mouseX, mouseY, shape)) {
        this.canvas.style.cursor = 'move';
        return;
      }
    }
    this.canvas.style.cursor = this.currentTool === 'Select' ? 'crosshair' : 'default';
  }

  finalizeSelection() {
    const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const right = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const bottom = Math.max(this.selectionStart.y, this.selectionEnd.y);

    this.selectedShapes = this.shapes.filter(shape => 
      shape.x >= left && shape.x + shape.width <= right &&
      shape.y >= top && shape.y + shape.height <= bottom
    );

    this.redrawCanvas();
  }

  async deleteSelectedShapes() {
    this.shapes = this.shapes.filter(shape => !this.selectedShapes.includes(shape));
    this.selectedShapes = [];
    await this.saveShapes();
    this.redrawCanvas();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const gemscape = new GemScape();
  await gemscape.init();
});
