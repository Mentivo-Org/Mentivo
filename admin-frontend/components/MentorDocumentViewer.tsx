"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { XCircle, Loader2, FileText, ExternalLink } from "lucide-react";
import * as pdfjs from "pdfjs-dist";

// Set worker source for PDF.js - only in browser
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const MentorDocumentViewer = ({ mentorId }: { mentorId: string }) => {
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const fetchDoc = async () => {
      try {
        const response = await api.get(`/mentors/${mentorId}/document`, {
          responseType: 'blob'
        });
        
        const blob = response.data;
        setIsPdf(blob.type === 'application/pdf');
        objectUrl = URL.createObjectURL(blob);
        setDocUrl(objectUrl);

        if (blob.type === 'application/pdf') {
          renderPdfPreview(objectUrl);
        }
      } catch (err) {
        console.error("Failed to fetch document", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    const renderPdfPreview = async (url: string) => {
      try {
        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };
        await page.render(renderContext).promise;
      } catch (err) {
        console.error("PDF preview rendering failed", err);
      }
    };

    fetchDoc();
    
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }, [mentorId]);

  if (loading) {
    return (
      <div className="h-48 w-full flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-lg">
        <Loader2 className="animate-spin text-primary mb-2" size={24} />
        <p className="text-xs text-secondary">Decrypting document...</p>
      </div>
    );
  }

  if (error || !docUrl) {
    return (
      <div className="p-4 bg-red-50 text-red-500 text-xs rounded-lg border border-red-100 flex items-center gap-2">
        <XCircle size={14} /> Failed to load identity document.
      </div>
    );
  }

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white aspect-video flex items-center justify-center">
      {isPdf ? (
        <div className="w-full h-full overflow-hidden flex items-start justify-center bg-gray-100">
           <canvas ref={canvasRef} className="max-w-full shadow-lg" />
           <div className="absolute top-2 left-2 px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded flex items-center gap-1">
              <FileText size={12} /> PDF Preview
           </div>
        </div>
      ) : (
        <img 
          src={docUrl} 
          alt="ID Card" 
          className="max-h-full max-w-full object-contain"
        />
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <a 
          href={docUrl} 
          target="_blank" 
          className="bg-white text-text px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm shadow-xl"
        >
          <ExternalLink size={16} /> View Full {isPdf ? 'PDF' : 'Size'}
        </a>
      </div>
    </div>
  );
};

export default MentorDocumentViewer;