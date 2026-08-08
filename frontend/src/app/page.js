'use client';

import { useState } from 'react';
import { 
  ArrowRight, 
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Bookmark,
  Check
} from 'lucide-react';

export default function Home() {
  const [appState, setAppState] = useState('LANDING'); // 'LANDING' | 'WORKSPACE'
  const [workspaceTab, setWorkspaceTab] = useState('OVERVIEW'); // OVERVIEW, FINDINGS, ASK, COMPARE, WORKFLOW, CASE_FILE
  const [activeEvidence, setActiveEvidence] = useState(null); // Controls the side drawer
  const [savedItems, setSavedItems] = useState([]);
  
  // Ask State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Compare State
  const [isComparing, setIsComparing] = useState(false);

  // Evidence Drawer Content Map
  const evidenceStore = {
    'finding-revenue': {
      id: 'finding-revenue',
      title: "Revenue continued to expand.",
      documentName: "Apple FY2025 Annual Report",
      page: 18,
      passage: "Total net sales increased 14.2% year-over-year to $412.5 billion in fiscal 2025, compared to $361.2 billion in fiscal 2024. This growth was driven primarily by momentum in the Services segment and sustained iPhone upgrades across international markets.",
      highlight: "Total net sales increased 14.2% year-over-year to $412.5 billion in fiscal 2025"
    },
    'finding-profitability': {
      id: 'finding-profitability',
      title: "Profitability expanded.",
      documentName: "Apple FY2025 Annual Report",
      page: 18,
      passage: "Gross margin for the fiscal year reached 68.5%, compared to 64.1% in the prior fiscal year. The improvement in gross margin was primarily due to a favorable shift in product mix toward higher-margin Services.",
      highlight: "Gross margin for the fiscal year reached 68.5%"
    },
    'risk-supply': {
      id: 'risk-supply',
      title: "Supply chain exposure",
      documentName: "Apple FY2025 Annual Report",
      page: 24,
      passage: "The Company's business and financial performance are subject to risks including international regulatory compliance, supply chain concentration, and currency exchange volatility. A significant portion of the Company's hardware manufacturing remains concentrated with partners in specialized overseas facilities, making the Company vulnerable to geopolitical disruptions.",
      highlight: "hardware manufacturing remains concentrated with partners in specialized overseas facilities"
    },
    'risk-regulatory': {
      id: 'risk-regulatory',
      title: "Regulatory pressure",
      documentName: "Apple FY2025 Annual Report",
      page: 24,
      passage: "The Company is subject to complex and evolving international privacy and AI compliance frameworks. In particular, the European Union's GDPR and the incoming EU AI Act may increase legal and compliance expenses and result in significant fines if violations occur.",
      highlight: "European Union's GDPR and the incoming EU AI Act may increase legal and compliance expenses"
    }
  };

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
    
    // Simulate API delay
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
     EVIDENCE DRAWER (SHARED)
     ========================================================================= */
  const EvidenceDrawer = () => {
    if (!activeEvidence) return null;
    const isSaved = savedItems.some(i => i.id === activeEvidence.id);

    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[45vw] lg:w-[40vw] bg-[#0c1015] border-l border-slate-800/60 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
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
            <span className="text-xs font-mono text-blue-400">THE SOURCE</span>
            
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
     LANDING PAGE STORY
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

            <p className="text-xl text-slate-400 font-light max-w-lg">
              Let's investigate Apple.
            </p>

            <div className="pt-8">
              <button 
                onClick={() => setAppState('WORKSPACE')}
                className="group text-xl font-light text-slate-200 flex items-center gap-4 border-b border-blue-500/30 pb-2 hover:border-blue-500 hover:text-white transition-all"
              >
                START INVESTIGATION 
                <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </section>

          <section className="space-y-12 border-t border-slate-800/50 pt-20">
            <div className="text-2xl md:text-3xl font-light leading-relaxed text-slate-300 max-w-2xl">
              <p>AI can give you an answer in seconds.</p>
              <p className="mt-8">The harder question is:</p>
              <p className="text-white mt-2">Can you prove it?</p>
            </div>
            
            <div className="pt-8">
              <p className="text-lg text-slate-400 font-light max-w-xl">
                DealLens was built around that problem.
              </p>
              <div className="flex gap-4 md:gap-8 pt-8 font-mono text-sm text-slate-500">
                <span>Documents.</span>
                <span>Evidence.</span>
                <span>Reasoning.</span>
                <span>Verification.</span>
              </div>
            </div>
          </section>

        </main>
      </div>
    );
  }

  /* =========================================================================
     INTERACTIVE RESEARCH WORKSPACE
     ========================================================================= */
  return (
    <div className="min-h-screen bg-[#07090c] text-[#f1f3f5] font-sans selection:bg-[#339af0] selection:text-white flex flex-col">
      <EvidenceDrawer />

      {/* Sticky Workspace Navigation */}
      <header className="sticky top-0 z-40 bg-[#07090c]/90 backdrop-blur-md border-b border-slate-800/80 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <span className="text-sm font-mono tracking-widest text-slate-300 font-bold">DEALLENS</span>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-light">
            {['OVERVIEW', 'FINDINGS', 'ASK', 'COMPARE', 'WORKFLOW'].map(tab => (
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

      {/* Workspace Main Content Area */}
      <main className="flex-1 max-w-[800px] w-full mx-auto px-6 py-20 pb-32">
        
        {/* OVERVIEW TAB */}
        {workspaceTab === 'OVERVIEW' && (
          <div className="animate-in fade-in duration-300 space-y-24">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-100 uppercase">
                Apple
              </h1>
              <p className="text-xl text-slate-400 font-light">
                FY2025 Investigation Overview
              </p>
              <div className="pt-4 text-xs font-mono text-slate-500 flex gap-4">
                <span>Documents Indexed: 2</span>
                <span>Evidence Coverage: 126 passages</span>
              </div>
            </div>

            <div className="space-y-16 border-t border-slate-800/50 pt-16">
              <h3 className="text-2xl font-light text-slate-200">Revenue Analysis</h3>
              
              <div className="space-y-4">
                <div className="text-7xl font-light tracking-tighter text-slate-100">
                  $412.5B
                </div>
                <div className="flex items-center gap-12 font-mono text-sm text-slate-400 border-l border-slate-800 pl-6 py-1">
                  <div>
                    <p className="text-slate-600 mb-1">FY2024</p>
                    <p className="text-slate-300">$361.2B</p>
                  </div>
                  <div className="flex items-center text-emerald-400/80 gap-2">
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-lg">+14.2%</span>
                  </div>
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

            <div className="space-y-16 border-t border-slate-800/50 pt-16">
              <h3 className="text-2xl font-light text-slate-200">Profitability Expansion</h3>
              
              <div className="space-y-6 font-mono max-w-md text-sm">
                <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-3">
                  <span className="text-slate-500">REVENUE</span>
                  <span className="text-xl text-slate-200">$412.5B</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-3">
                  <span className="text-slate-500">GROSS PROFIT</span>
                  <span className="text-xl text-slate-200">$282.5B</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-3 text-slate-400">
                  <span>GROSS MARGIN</span>
                  <span>68.5% (+4.4%)</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xl leading-relaxed text-slate-300 font-light max-w-xl">
                  Profitability improved primarily due to a favorable shift in product mix toward higher-margin Services.
                </p>
                <button 
                  onClick={() => handleOpenEvidence('finding-profitability')}
                  className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors text-left inline-flex items-center gap-2"
                >
                  TRACE FINDING →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FINDINGS TAB */}
        {workspaceTab === 'FINDINGS' && (
          <div className="animate-in fade-in duration-300 space-y-16">
            <h2 className="text-3xl font-light text-slate-100 mb-12">Investigation Findings</h2>

            <div className="space-y-16">
              
              <div className="relative flex gap-8">
                <div className="pt-1"><span className="font-mono text-sm text-slate-500 block w-8 border-b border-slate-800 pb-2">01</span></div>
                <div className="space-y-4 flex-1">
                  <h4 className="text-2xl text-slate-200 font-light">Revenue continued to expand</h4>
                  <p className="text-lg text-slate-400 font-light leading-relaxed max-w-lg">
                    Total net sales increased 14.2% year-over-year to $412.5 billion in fiscal 2025.
                  </p>
                  <button onClick={() => handleOpenEvidence('finding-revenue')} className="font-mono text-sm text-blue-400 hover:text-blue-300">
                    Trace Finding →
                  </button>
                </div>
              </div>

              <div className="relative flex gap-8">
                <div className="pt-1"><span className="font-mono text-sm text-slate-500 block w-8 border-b border-slate-800 pb-2">02</span></div>
                <div className="space-y-4 flex-1">
                  <h4 className="text-2xl text-slate-200 font-light">Profitability expanded significantly</h4>
                  <p className="text-lg text-slate-400 font-light leading-relaxed max-w-lg">
                    Gross margin reached 68.5%, expanding +4.4 points due to Services mix shift.
                  </p>
                  <button onClick={() => handleOpenEvidence('finding-profitability')} className="font-mono text-sm text-blue-400 hover:text-blue-300">
                    Trace Finding →
                  </button>
                </div>
              </div>

              <div className="relative flex gap-8">
                <div className="pt-1"><span className="font-mono text-sm text-slate-500 block w-8 border-b border-slate-800 pb-2">03</span></div>
                <div className="space-y-4 flex-1">
                  <h4 className="text-2xl text-slate-200 font-light">Supply chain vulnerability remains</h4>
                  <p className="text-lg text-slate-400 font-light leading-relaxed max-w-lg">
                    Hardware manufacturing concentration in overseas facilities poses geopolitical disruption risks.
                  </p>
                  <button onClick={() => handleOpenEvidence('risk-supply')} className="font-mono text-sm text-blue-400 hover:text-blue-300">
                    Trace Finding →
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ASK TAB */}
        {workspaceTab === 'ASK' && (
          <div className="animate-in fade-in duration-300 space-y-16">
            <h2 className="text-3xl font-light text-slate-100 mb-8">Ask the Documents</h2>

            <div className="space-y-8 max-w-3xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="What drove Apple's revenue growth?"
                className="w-full bg-transparent border-b border-slate-700 hover:border-slate-500 focus:border-blue-500 py-4 text-2xl font-light focus:outline-none transition-colors placeholder:text-slate-600"
              />

              <div className="space-y-4 font-mono text-sm">
                <button onClick={() => handleAskQuestion("What drove the change in profitability?")} className="block text-slate-500 hover:text-slate-300 transition-colors text-left">
                  What drove the change in profitability?
                </button>
                <button onClick={() => handleAskQuestion("What are the key regulatory risks?")} className="block text-slate-500 hover:text-slate-300 transition-colors text-left">
                  What are the key regulatory risks?
                </button>
              </div>
            </div>

            {isSearching && (
              <div className="pt-12 text-slate-500 font-mono text-sm animate-pulse">
                Retrieving evidence and verifying claim...
              </div>
            )}

            {searchResult && !isSearching && (
              <div className="pt-16 mt-8 border-t border-slate-800/50 animate-in fade-in duration-500">
                <div className="pl-6 border-l border-slate-800 space-y-12">
                  <div className="space-y-3">
                    <span className="text-xs font-mono text-slate-600">ANSWER</span>
                    <p className="text-2xl text-slate-200 font-light leading-snug">
                      {searchResult.interpretation}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-mono text-slate-600">WHY IT MATTERS</span>
                    <p className="text-lg text-slate-400 font-light leading-relaxed max-w-xl">
                      {searchResult.why_it_matters}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 max-w-md pt-4">
                    <div className="space-y-1">
                      <span className="text-xs font-mono text-slate-600">EVIDENCE COVERAGE</span>
                      <p className="font-mono text-sm text-slate-300">{searchResult.coverage}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-mono text-slate-600">CITATION VERIFICATION</span>
                      <p className="font-mono text-sm text-emerald-400">{searchResult.verification}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xs font-mono text-slate-600">SOURCE EVIDENCE</span>
                    <div className="space-y-2">
                      <p className="font-mono text-sm text-blue-400">{searchResult.source}</p>
                      <p className="text-lg text-slate-300 font-serif italic border-l-2 border-slate-700 pl-4 py-1">
                        "{searchResult.evidence}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPARE TAB */}
        {workspaceTab === 'COMPARE' && (
          <div className="animate-in fade-in duration-300 space-y-16">
            <h2 className="text-3xl font-light text-slate-100 mb-12">Cross-Document Validation</h2>

            <div className="grid grid-cols-2 gap-12 font-mono text-sm border-b border-slate-800/50 pb-8">
              <div>
                <p className="text-slate-600 mb-2">SOURCE A</p>
                <p className="text-slate-200">Apple FY2025 Annual Report</p>
                <p className="text-slate-500 mt-1">Full Fiscal Year scope</p>
              </div>
              <div>
                <p className="text-slate-600 mb-2">SOURCE B</p>
                <p className="text-slate-200">Q3 Financial Results</p>
                <p className="text-slate-500 mt-1">Single Quarter scope</p>
              </div>
            </div>

            <div className="space-y-16">
              {/* Metric 1 */}
              <div className="space-y-6">
                <p className="text-xl font-light text-slate-200">Net Retention Rate</p>
                <div className="grid grid-cols-2 gap-12 font-mono text-lg text-slate-300">
                  <div>94% NRR</div>
                  <div>98% Retention claimed</div>
                </div>
                
                <div className="pt-6 mt-6 border-t border-slate-800/40 space-y-8 pl-6 border-l border-amber-500/30">
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-slate-600">WHAT DIFFERED</span>
                    <p className="text-slate-300 font-light">The annual report discloses 94% Net Revenue Retention, while the Q3 presentation claims 98% gross retention.</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-slate-600">WHY IT MAY DIFFER</span>
                    <p className="text-slate-400 font-light">NRR accounts for downgrades and churn (audited standard), whereas gross retention only measures logo retention (marketing metric).</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-slate-600">MATERIALITY</span>
                    <p className="text-amber-400/80 font-mono text-sm">⚠️ High — Do not use 98% for financial modeling.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW TAB */}
        {workspaceTab === 'WORKFLOW' && (
          <div className="animate-in fade-in duration-300 space-y-12">
            <h2 className="text-3xl font-light text-slate-100 mb-12">Investigation Workflow</h2>
            
            <p className="text-lg text-slate-400 font-light max-w-xl pb-8">
              DealLens does not simply pass documents to an LLM. It orchestrates a deterministic evidence-gathering pipeline.
            </p>

            <div className="relative pl-6 border-l border-slate-800 space-y-12 font-mono text-sm">
              
              <div className="relative">
                <div className="absolute -left-[30px] top-1 bg-[#07090c] p-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/80" />
                </div>
                <p className="text-slate-200">Document Validation & Extraction</p>
                <p className="text-slate-500 mt-2">Parsed 126 pages into 342 semantic chunks retaining page boundaries.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[30px] top-1 bg-[#07090c] p-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/80" />
                </div>
                <p className="text-slate-200">Financial Analysis Engine</p>
                <p className="text-slate-500 mt-2">Extracted core revenue, operating income, and net margin flow.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[30px] top-1 bg-[#07090c] p-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/80" />
                </div>
                <p className="text-slate-200">Risk Disclosure Retrieval</p>
                <p className="text-slate-500 mt-2">Identified 3 material risk factors using hybrid RRF search.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[30px] top-1 bg-[#07090c] p-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/80" />
                </div>
                <p className="text-slate-200">Evidence Verification Guard</p>
                <p className="text-slate-500 mt-2">Cross-referenced 100% of claims against document chunks to prevent hallucination.</p>
              </div>

            </div>
          </div>
        )}

        {/* CASE FILE TAB */}
        {workspaceTab === 'CASE_FILE' && (
          <div className="animate-in fade-in duration-300 space-y-12">
            <div className="flex items-end justify-between border-b border-slate-800/50 pb-8">
              <div>
                <h2 className="text-3xl font-light text-slate-100">Research Case File</h2>
                <p className="text-lg text-slate-400 font-light mt-2">Saved findings for Apple FY2025.</p>
              </div>
              <button 
                disabled={savedItems.length === 0}
                className="text-sm font-mono border-b border-slate-500 pb-1 text-slate-200 hover:text-white transition-colors disabled:opacity-30 disabled:border-slate-800"
              >
                GENERATE RESEARCH MEMO →
              </button>
            </div>

            {savedItems.length === 0 ? (
              <div className="py-20 text-center font-mono text-sm text-slate-500">
                No findings saved. Browse the Overview or Findings tab and click "SAVE FINDING".
              </div>
            ) : (
              <div className="space-y-6">
                {savedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-4 border-b border-slate-800/30 group">
                    <div className="space-y-1">
                      <p className="text-lg text-slate-200 font-light">{item.title}</p>
                      <p className="text-xs font-mono text-slate-500">{item.documentName} · Page {item.page}</p>
                    </div>
                    <button 
                      onClick={() => handleOpenEvidence(item.id)}
                      className="font-mono text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Trace Evidence →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
