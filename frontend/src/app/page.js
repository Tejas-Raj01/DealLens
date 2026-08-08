'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Bookmark,
  Check,
  Upload,
  FileText,
  Trash2,
  Maximize2
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deallens-73yw.onrender.com';

export default function Home() {
  const [appState, setAppState] = useState('LANDING'); // 'LANDING' | 'WORKSPACE'
  const [workspaceTab, setWorkspaceTab] = useState('DOCUMENTS'); // DOCUMENTS, OVERVIEW, FINDINGS, ASK, COMPARE, WORKFLOW, CASE_FILE
  
  // Document State
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // 'UPLOADING', 'PARSING', 'INDEXING', 'READY', 'FAILED'
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null); // Doc ID to view in full screen
  const fileInputRef = useRef(null);

  // General App State
  const [activeEvidence, setActiveEvidence] = useState(null); // Controls the side drawer
  const [savedItems, setSavedItems] = useState([]);
  
  // Ask State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Mock Evidence Store for Demo
  const evidenceStore = {
    'finding-revenue': {
      id: 'finding-revenue',
      title: "Revenue continued to expand.",
      documentName: "Apple FY2025 Annual Report",
      page: 18,
      passage: "Total net sales increased 14.2% year-over-year to $412.5 billion in fiscal 2025, compared to $361.2 billion in fiscal 2024. This growth was driven primarily by momentum in the Services segment and sustained iPhone upgrades across international markets.",
      highlight: "Total net sales increased 14.2% year-over-year to $412.5 billion in fiscal 2025"
    }
  };

  /* =========================================================================
     API: DOCUMENTS
     ========================================================================= */
  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // Start polling if we are in the workspace
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('UPLOADING');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadStatus('UPLOADING ➔ PARSING');
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploadStatus('INDEXING ➔ READY');
        await fetchDocuments();
        setTimeout(() => {
          setIsUploading(false);
          setUploadStatus('');
        }, 2000);
      } else {
        setUploadStatus('PROCESSING FAILED');
        setTimeout(() => setIsUploading(false), 3000);
      }
    } catch (error) {
      console.error("Upload error", error);
      setUploadStatus('PROCESSING FAILED');
      setTimeout(() => setIsUploading(false), 3000);
    }
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteDocument = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  /* =========================================================================
     ACTIONS
     ========================================================================= */
  const handleOpenEvidence = (id) => {
    setActiveEvidence(evidenceStore[id]);
  };
  const closeEvidence = () => {
    setActiveEvidence(null);
  };
  const toggleSaveItem = (item) => {
    if (savedItems.some(i => i.id === item.id)) {
      setSavedItems(savedItems.filter(i => i.id !== item.id));
    } else {
      setSavedItems([...savedItems, item]);
    }
  };

  const handleAskQuestion = async (queryOverride) => {
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchQuery(query);
    await new Promise(r => setTimeout(r, 1200));
    setSearchResult({
      fact: "Total net sales reached $412.5 billion in fiscal 2025.",
      interpretation: "Revenue increased +14.2% YoY compared to $361.2 billion in FY2024.",
      why_it_matters: "Growth remained strong driven by enterprise services expansion despite foreign exchange headwinds.",
      source: "Apple FY2025 Annual Report · Page 18",
      evidence: "Total net sales increased 14.2% year-over-year to $412.5 billion in fiscal 2025.",
      coverage: "4/4 chunks matched",
      verification: "VERIFIED"
    });
    setIsSearching(false);
  };

  /* =========================================================================
     DOCUMENT VIEWER OVERLAY
     ========================================================================= */
  const DocumentViewer = () => {
    if (!viewingDoc) return null;
    const doc = documents.find(d => d.id === viewingDoc);
    const pdfUrl = `${API_BASE_URL}/api/v1/documents/${viewingDoc}/file`;

    return (
      <div className="fixed inset-0 z-50 bg-[#07090c] flex flex-col animate-in fade-in duration-300">
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800/80 bg-[#07090c]">
          <div className="space-y-1">
            <h2 className="text-xl font-light text-slate-200">{doc?.filename || 'Document'}</h2>
            <p className="text-xs font-mono text-slate-500">
              {doc?.metadata?.total_pages ? `${doc.metadata.total_pages} pages` : 'Reading view'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setViewingDoc(null); setWorkspaceTab('OVERVIEW'); }}
              className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
            >
              INVESTIGATE THIS DOCUMENT →
            </button>
            <button onClick={() => setViewingDoc(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 w-full h-full bg-[#11151c]">
          <iframe 
            src={pdfUrl} 
            className="w-full h-full border-none"
            title="Document Viewer"
          />
        </div>
      </div>
    );
  };

  /* =========================================================================
     EVIDENCE DRAWER
     ========================================================================= */
  const EvidenceDrawer = () => {
    if (!activeEvidence) return null;
    const isSaved = savedItems.some(i => i.id === activeEvidence.id);
    
    // Find if we have this doc to view it
    const relatedDoc = documents.find(d => activeEvidence.documentName.includes(d.filename.replace('.pdf', '')));

    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[45vw] lg:w-[40vw] bg-[#0c1015] border-l border-slate-800/60 z-40 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/40">
          <span className="text-xs font-mono text-slate-400 tracking-wider">SOURCE TRACE</span>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => toggleSaveItem(activeEvidence)}
              className={`text-xs font-mono flex items-center gap-2 transition-colors ${isSaved ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'SAVED TO CASE FILE' : 'SAVE FINDING'}
            </button>
            <button onClick={closeEvidence} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-8 flex flex-col gap-12 overflow-y-auto pb-24">
          <div className="space-y-4">
            <span className="text-xs font-mono text-slate-500">THE CLAIM</span>
            <h3 className="text-2xl font-light text-slate-200 leading-snug">
              "{activeEvidence.title}"
            </h3>
          </div>

          <div className="w-px h-12 bg-gradient-to-b from-blue-500/50 to-transparent ml-4"></div>

          <div className="space-y-4 relative">
            <div className="absolute -left-12 top-1 text-blue-500/30">
              <ArrowRight className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-blue-400">THE SOURCE</span>
              {relatedDoc && (
                <button 
                  onClick={() => setViewingDoc(relatedDoc.id)}
                  className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                  View Full Document
                </button>
              )}
            </div>
            
            <div className="text-sm font-mono text-slate-400 space-y-1">
              <p>{activeEvidence.documentName}</p>
              <p>Page {activeEvidence.page}</p>
            </div>

            <div className="mt-6 text-lg text-slate-300 font-serif leading-relaxed space-y-4 tracking-wide bg-[#11151c] p-6 border-l-2 border-blue-500/40">
              <p>
                {activeEvidence.passage.split(activeEvidence.highlight).map((part, index, array) => (
                  <span key={index}>
                    {part}
                    {index < array.length - 1 && (
                      <span className="bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded-sm">{activeEvidence.highlight}</span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =========================================================================
     LANDING PAGE
     ========================================================================= */
  if (appState === 'LANDING') {
    return (
      <div className="min-h-screen bg-[#07090c] text-[#f1f3f5] font-sans selection:bg-[#339af0] selection:text-white">
        <main className="max-w-[700px] mx-auto px-6 py-24 md:py-32 flex flex-col gap-32 relative">
          <section className="space-y-12">
            <span className="text-sm font-mono tracking-widest text-slate-500">DEALLENS</span>
            <h1 className="text-4xl md:text-5xl font-light leading-tight text-slate-100">
              How do you understand a company<br />
              when the answer is buried in<br />
              hundreds of pages?
            </h1>
            <div className="py-8 font-mono text-sm text-slate-400 space-y-4 flex flex-col items-start">
              <div className="flex items-center gap-4">
                <span>84 pages</span>
                <span className="text-slate-600">Annual Report</span>
              </div>
              <div className="flex items-center gap-4">
                <span>+ 42 pages</span>
                <span className="text-slate-600">Financial Results</span>
              </div>
              <div className="h-8 border-l border-slate-700 ml-4 my-2"></div>
              <div className="flex items-center gap-4 text-blue-400">
                <ArrowRight className="w-4 h-4" />
                <span>One evidence-backed research workspace</span>
              </div>
            </div>
            <div className="pt-8">
              <button 
                onClick={() => { setWorkspaceTab('DOCUMENTS'); setAppState('WORKSPACE'); }}
                className="group text-xl font-light text-slate-200 flex items-center gap-4 border-b border-blue-500/30 pb-2 hover:border-blue-500 hover:text-white transition-all"
              >
                START INVESTIGATION 
                <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* =========================================================================
     WORKSPACE
     ========================================================================= */
  const navTabs = ['DOCUMENTS', 'OVERVIEW', 'FINDINGS', 'ASK', 'COMPARE', 'WORKFLOW'];

  return (
    <div className="min-h-screen bg-[#07090c] text-[#f1f3f5] font-sans selection:bg-[#339af0] selection:text-white flex flex-col">
      <EvidenceDrawer />
      <DocumentViewer />
      
      {/* Hidden file input for upload */}
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />

      {/* Sticky Workspace Navigation */}
      <header className="sticky top-0 z-30 bg-[#07090c]/90 backdrop-blur-md border-b border-slate-800/80 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <span className="text-sm font-mono tracking-widest text-slate-300 font-bold">DEALLENS</span>
          <nav className="hidden md:flex items-center gap-8 text-sm font-light">
            {navTabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setWorkspaceTab(tab)}
                className={`transition-colors tracking-wide ${workspaceTab === tab ? 'text-white border-b border-white pb-1' : 'text-slate-500 hover:text-slate-300 pb-1 border-b border-transparent'}`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </nav>
        </div>
        <button 
          onClick={() => setWorkspaceTab('CASE_FILE')}
          className={`text-xs font-mono transition-colors flex items-center gap-2 ${workspaceTab === 'CASE_FILE' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Bookmark className="w-4 h-4" />
          CASE FILE ({savedItems.length})
        </button>
      </header>

      <main className="flex-1 max-w-[900px] w-full mx-auto px-6 py-20 pb-32">
        
        {/* DOCUMENTS TAB */}
        {workspaceTab === 'DOCUMENTS' && (
          <div className="animate-in fade-in duration-300 space-y-16">
            
            {/* Header & Upload Action */}
            <div className="flex items-end justify-between border-b border-slate-800/50 pb-8">
              <div>
                <h1 className="text-3xl font-light text-slate-100">Documents</h1>
                <p className="text-lg text-slate-400 font-light mt-2">These are the sources DealLens uses for its research.</p>
              </div>
              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="text-sm font-mono border-b border-slate-500 pb-1 text-slate-200 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? uploadStatus : '+ UPLOAD PDF'}
              </button>
            </div>

            {/* Empty State */}
            {documents.length === 0 && !isUploading && (
              <div className="py-24 flex flex-col items-center text-center space-y-12">
                <div className="space-y-4">
                  <h2 className="text-3xl font-light text-slate-200">YOUR RESEARCH STARTS HERE</h2>
                  <p className="text-lg text-slate-400 font-light max-w-lg mx-auto leading-relaxed">
                    DealLens needs source documents before it can investigate a company. Upload an annual report, investor presentation, earnings report or other financial filing.
                  </p>
                </div>
                
                <button 
                  onClick={handleUploadClick}
                  className="px-8 py-4 border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-colors font-mono text-sm tracking-widest"
                >
                  + UPLOAD YOUR FIRST PDF
                </button>

                <div className="pt-12 text-left space-y-4 max-w-sm w-full">
                  <span className="text-xs font-mono text-slate-600">EXAMPLE SOURCES:</span>
                  <ul className="text-sm text-slate-400 space-y-2 font-light">
                    <li>• Apple FY2025 Annual Report (10-K)</li>
                    <li>• Tesla Q3 Investor Presentation</li>
                    <li>• Microsoft Earnings Release</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Document List */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="group border-b border-slate-800/30 transition-colors hover:bg-slate-800/10">
                    <div 
                      className="py-6 px-4 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                    >
                      <div className="flex items-center gap-6">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="text-lg text-slate-200 font-light uppercase tracking-wide">{doc.filename.replace('.pdf', '')}</p>
                          <div className="flex gap-4 mt-2 font-mono text-xs text-slate-500">
                            <span>{doc.metadata?.total_pages || 0} pages</span>
                            <span className="flex items-center gap-1">
                              Processed <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 font-mono text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingDoc(doc.id); }}
                          className="text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          [ View ]
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setWorkspaceTab('OVERVIEW'); }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          [ Investigate ]
                        </button>
                      </div>
                    </div>
                    
                    {/* Inline Metadata Expansion */}
                    {expandedDocId === doc.id && (
                      <div className="px-16 pb-6 text-xs font-mono text-slate-500 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-12">
                          <div>
                            <p className="text-slate-600 mb-1">UPLOADED</p>
                            <p>{new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-600 mb-1">INDEXED PASSAGES</p>
                            <p>{doc.metadata?.chunk_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-slate-600 mb-1">SHA256</p>
                            <p className="truncate w-32">{doc.file_hash}</p>
                          </div>
                        </div>
                        <div className="pt-4 flex">
                          <button 
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            className="flex items-center gap-2 text-red-400/70 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Remove Document
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {workspaceTab === 'OVERVIEW' && (
          <div className="animate-in fade-in duration-300 space-y-24">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-100 uppercase">
                Investigation Overview
              </h1>
              <p className="text-xl text-slate-400 font-light">
                Extracted from {documents.length} source documents
              </p>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-slate-500 font-light">Please upload documents first in the Documents tab.</div>
            ) : (
              <>
                <div className="space-y-16 border-t border-slate-800/50 pt-16">
                  <h3 className="text-2xl font-light text-slate-200">Revenue Analysis</h3>
                  <div className="space-y-4">
                    <div className="text-7xl font-light tracking-tighter text-slate-100">$412.5B</div>
                    <div className="flex items-center gap-12 font-mono text-sm text-slate-400 border-l border-slate-800 pl-6 py-1">
                      <div><p className="text-slate-600 mb-1">FY2024</p><p className="text-slate-300">$361.2B</p></div>
                      <div className="flex items-center text-emerald-400/80 gap-2"><ArrowRight className="w-4 h-4" /><span className="text-lg">+14.2%</span></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xl leading-relaxed text-slate-300 font-light max-w-xl">
                      Revenue growth remained resilient despite macroeconomic headwinds, driven entirely by momentum in the Services segment.
                    </p>
                    <button 
                      onClick={() => handleOpenEvidence('finding-revenue')}
                      className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors text-left inline-flex items-center gap-2"
                    >
                      TRACE FINDING →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* OTHER TABS (Simplified for brevity, maintaining styling) */}
        {workspaceTab === 'FINDINGS' && (
          <div className="animate-in fade-in duration-300 space-y-16">
            <h2 className="text-3xl font-light text-slate-100 mb-12">Investigation Findings</h2>
            {documents.length === 0 ? <p className="text-slate-500">No documents uploaded.</p> : (
              <div className="space-y-16">
                <div className="relative flex gap-8">
                  <div className="pt-1"><span className="font-mono text-sm text-slate-500 block w-8 border-b border-slate-800 pb-2">01</span></div>
                  <div className="space-y-4 flex-1">
                    <h4 className="text-2xl text-slate-200 font-light">Revenue continued to expand</h4>
                    <button onClick={() => handleOpenEvidence('finding-revenue')} className="font-mono text-sm text-blue-400 hover:text-blue-300">
                      Trace Finding →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {workspaceTab === 'ASK' && (
          <div className="animate-in fade-in duration-300 space-y-16">
            <h2 className="text-3xl font-light text-slate-100 mb-8">Ask the Documents</h2>
            <div className="space-y-8 max-w-3xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="What drove revenue growth?"
                className="w-full bg-transparent border-b border-slate-700 hover:border-slate-500 focus:border-blue-500 py-4 text-2xl font-light focus:outline-none transition-colors placeholder:text-slate-600"
              />
            </div>
            {isSearching && <div className="pt-12 text-slate-500 font-mono text-sm animate-pulse">Retrieving evidence and verifying claim...</div>}
            {searchResult && !isSearching && (
              <div className="pt-16 mt-8 border-t border-slate-800/50 animate-in fade-in duration-500">
                <div className="pl-6 border-l border-slate-800 space-y-12">
                  <div className="space-y-3">
                    <span className="text-xs font-mono text-slate-600">ANSWER</span>
                    <p className="text-2xl text-slate-200 font-light leading-snug">{searchResult.interpretation}</p>
                  </div>
                  <div className="space-y-4">
                    <span className="text-xs font-mono text-slate-600">SOURCE EVIDENCE</span>
                    <div className="space-y-2">
                      <p className="font-mono text-sm text-blue-400">{searchResult.source}</p>
                      <p className="text-lg text-slate-300 font-serif italic border-l-2 border-slate-700 pl-4 py-1">"{searchResult.evidence}"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
