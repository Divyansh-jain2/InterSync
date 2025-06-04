import React, { useRef, useEffect, useState, useCallback } from "react"; // Import useCallback
import { Button } from "./ui/button";
import { EraserIcon, DownloadIcon } from "lucide-react";

interface WhiteBoardProps {
  initialData: string | null;
  onSaveData: (data: string) => void;
}

const WhiteBoard: React.FC<WhiteBoardProps> = ({ initialData, onSaveData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(2);

  // Helper function to get canvas context
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      return canvas.getContext("2d");
    }
    return null;
  }, []);

  // Effect for initial canvas setup and loading data (runs once on mount)
  useEffect(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const canvas = canvasRef.current!; // Non-null assertion after check
    ctx.lineCap = "round";
    ctx.fillStyle = "#1e1e1e"; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill background

    // Load initial data if available
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear current before drawing
        ctx.fillStyle = "#1e1e1e"; // Re-fill background before drawing image
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialData;
    }
  }, [initialData, getCanvasContext]); // Depend on initialData to load it, and getCanvasContext to ensure it's stable

  // Effect for drawing logic and saving data
  useEffect(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const canvas = canvasRef.current!; // Non-null assertion after check

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    const getCoordinates = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      if (e instanceof MouseEvent) {
        return { offsetX: e.offsetX, offsetY: e.offsetY };
      } else {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        return {
          offsetX: touch.clientX - rect.left,
          offsetY: touch.clientY - rect.top,
        };
      }
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      setIsDrawing(true);
      const { offsetX, offsetY } = getCoordinates(e, canvas);
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      const { offsetX, offsetY } = getCoordinates(e, canvas);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    };

    const endDrawing = () => {
      setIsDrawing(false);
      // Save the canvas data after each drawing session ends
      onSaveData(canvas.toDataURL());
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", endDrawing);
    canvas.addEventListener("mouseout", endDrawing);

    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", endDrawing);
    canvas.addEventListener("touchcancel", endDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", endDrawing);
      canvas.removeEventListener("mouseout", endDrawing);

      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", endDrawing);
      canvas.removeEventListener("touchcancel", endDrawing);
    };
  }, [isDrawing, color, lineWidth, getCanvasContext, onSaveData]); // Added onSaveData and getCanvasContext to dependencies

  const clearCanvas = () => {
    const ctx = getCanvasContext();
    if (ctx) {
      const canvas = canvasRef.current!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      onSaveData(canvas.toDataURL()); // Save empty canvas
    }
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = "whiteboard-drawing.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const handleLineWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLineWidth(Number(e.target.value));
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-[#1e1e1e] rounded-lg">
      <canvas
        ref={canvasRef}
        width={window.innerWidth * 0.9}
        height={window.innerHeight * 0.5}
        className="border border-gray-700 rounded-md shadow-lg"
      ></canvas>
      <div className="absolute top-4 right-4 flex gap-2">
        <input type="color" value={color} onChange={handleColorChange} className="w-8 h-8 rounded-full border-none cursor-pointer" />
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={handleLineWidthChange}
          className="w-24 h-8"
          title="Line Width"
        />
        <Button variant="outline" size="icon" onClick={clearCanvas} aria-label="Clear Whiteboard">
          <EraserIcon className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={downloadDrawing} aria-label="Download Drawing">
          <DownloadIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default WhiteBoard;