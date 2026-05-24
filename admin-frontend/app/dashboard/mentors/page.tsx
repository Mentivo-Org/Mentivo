"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { CheckCircle, XCircle, ExternalLink, UserCheck, Loader2, FileText } from "lucide-react";
import * as pdfjs from "pdfjs-dist";

// Set worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

export default function MentorVerificationPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUnverifiedMentors();
  }, []);

  const fetchUnverifiedMentors = async () => {
    try {
      const { data } = await api.get("/mentors/unverified");
      setMentors(data);
    } catch (err) {
      console.error("Failed to fetch unverified mentors");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    if (!confirm("Are you sure you want to verify this mentor?")) return;
    setVerifyingId(id);
    try {
      await api.post(`/mentors/${id}/verify`, {});
      setMentors(mentors.filter(m => m.mentorId !== id));
    } catch (err) {
      alert("Failed to verify mentor.");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text">Mentor Verification Portal</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-secondary">Loading pending verifications...</div>
      ) : mentors.length === 0 ? (
        <div className="bg-card p-12 rounded-xl border border-gray-200 text-center space-y-4 shadow-sm">
           <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
             <CheckCircle size={32} />
           </div>
           <h2 className="text-xl font-bold text-text">All Caught Up!</h2>
           <p className="text-secondary">There are no mentors waiting for verification at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.mentorId} className="bg-card rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 font-bold text-xl uppercase">
                   {mentor.user?.name?.charAt(0) || "M"}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-text truncate">{mentor.user?.name}</h2>
                  <p className="text-secondary text-sm truncate">{mentor.user?.email}</p>
                  <p className="text-primary text-sm font-semibold">{mentor.iit_name} • {mentor.branch}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                   <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase border border-amber-100">Pending</span>
                   <p className="text-xs text-gray-400 mt-2">Year: {mentor.year}</p>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 flex-1 space-y-4">
                 <div>
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Bio & Expertise</h3>
                    <p className="text-sm text-text line-clamp-3 italic">"{mentor.bio || "No bio provided."}"</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {mentor.expertise?.split(',').map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-full">{tag.trim()}</span>
                        ))}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Identity Document</h3>
                    {mentor.id_doc_url ? (
                        <MentorDocumentViewer mentorId={mentor.mentorId} />
                    ) : (
                        <div className="p-4 bg-red-50 text-red-500 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                           <XCircle size={14} /> No ID document uploaded.
                        </div>
                    )}
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                 <button 
                   disabled={verifyingId === mentor.mentorId}
                   className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium py-2 rounded-lg transition-colors text-sm"
                 >
                    Reject Application
                 </button>
                 <button 
                   onClick={() => handleVerify(mentor.mentorId)}
                   disabled={verifyingId === mentor.mentorId}
                   className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-lg transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2 text-sm"
                 >
                    <UserCheck size={18} /> {verifyingId === mentor.mentorId ? "Verifying..." : "Approve & Verify"}
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
