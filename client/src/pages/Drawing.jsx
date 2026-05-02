import { useRef, useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Palette, Eraser, Trash2, Download, Minus, Plus } from 'lucide-react';

const colors = ['#FFFFFF','#FF0000','#FF6B35','#FFC107','#4CAF50','#2196F3','#9C27B0','#E91E63','#000000','#8B5CF6'];

export default function Drawing() {
  const canvasRef = useRef(null);
  const socket = useSocket();
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [size, setSize] = useState(3);
  const [tool, setTool] = useState('pen');
  const boardId = 'global';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight - 80;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0F0F1A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (socket) {
      socket.emit('join_board', boardId);
      socket.on('draw_event', (data) => {
        const c = canvas.getContext('2d');
        c.strokeStyle = data.color;
        c.lineWidth = data.size;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(data.x0, data.y0);
        c.lineTo(data.x1, data.y1);
        c.stroke();
      });
      socket.on('clear_board', () => {
        const c = canvas.getContext('2d');
        c.fillStyle = '#0F0F1A';
        c.fillRect(0, 0, canvas.width, canvas.height);
      });
      return () => { socket.off('draw_event'); socket.off('clear_board'); };
    }
  }, [socket]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => { setDrawing(true); const p = getPos(e); canvasRef.current._lastPos = p; };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    const last = canvas._lastPos;
    ctx.strokeStyle = tool === 'eraser' ? '#0F0F1A' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (socket) socket.emit('draw_event', { boardId, drawData: { x0: last.x, y0: last.y, x1: pos.x, y1: pos.y, color: tool === 'eraser' ? '#0F0F1A' : color, size: tool === 'eraser' ? size * 3 : size } });
    canvas._lastPos = pos;
  };

  const stopDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0F0F1A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (socket) socket.emit('clear_board', boardId);
  };

  const download = () => {
    const link = document.createElement('a');
    link.download = 'artory-drawing.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div><h1 className="text-3xl font-bold text-white">Drawing Board</h1><p className="text-gray-400 text-sm">Collaborative canvas — draw together in real-time</p></div>
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4 card py-3">
        <div className="flex gap-1">
          {colors.map(c => (
            <button key={c} onClick={() => {setColor(c);setTool('pen');}}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c && tool === 'pen' ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="w-px h-8 bg-dark-border" />
        <button onClick={() => setTool('pen')} className={`p-2 rounded-lg transition-colors ${tool==='pen'?'bg-primary text-white':'text-gray-400 hover:text-white'}`}><Palette size={18}/></button>
        <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg transition-colors ${tool==='eraser'?'bg-primary text-white':'text-gray-400 hover:text-white'}`}><Eraser size={18}/></button>
        <div className="flex items-center gap-2">
          <button onClick={() => setSize(s => Math.max(1,s-1))} className="text-gray-400 hover:text-white"><Minus size={16}/></button>
          <span className="text-sm text-white w-6 text-center">{size}</span>
          <button onClick={() => setSize(s => Math.min(20,s+1))} className="text-gray-400 hover:text-white"><Plus size={16}/></button>
        </div>
        <div className="w-px h-8 bg-dark-border" />
        <button onClick={clearCanvas} className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 size={18}/></button>
        <button onClick={download} className="p-2 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"><Download size={18}/></button>
      </div>
      {/* Canvas */}
      <div className="flex-1 card p-0 overflow-hidden cursor-crosshair">
        <canvas ref={canvasRef}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      </div>
    </div>
  );
}
