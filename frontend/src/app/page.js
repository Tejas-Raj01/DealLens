'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Search, 
  ExternalLink,
  ChevronDown,
  RefreshCw,
  X
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deallens-73yw.onrender.com';

export default function Home() {
  const [activeEvidence, setActiveEvidence] = useState(null); // Controls the side drawer
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);

  // Evidence Drawer Content Map
  const evidenceStore = {
    'finding-revenue': {
      title: "Revenue continued to expand.",
      documentName: "Apple FY2025 Annual Report",
      page: 18,
      passage: "Total net sales increased 14.2% year-over-year to $412.5 billion in fiscal 2025, compared to $361.2 billion in fiscal 2024. This growth was driven primarily by momentum in the Services segment and sustained iPhone upgrades across international markets.",
      highlight: "Total net sales increased 14.2% year-over-year to $412.5 billion in fiscal 2025"
    },
    'finding-profitability': {
      title: "Profitability expanded.",
      documentName: "Apple FY2025 Annual Report",
      page: 18,
      passage: "Gross margin for the fiscal year reached 68.5%, compared to 64.1% in the prior fiscal year. The improvement in gross margin was primarily due to a favorable shift in product mix toward higher-margin Services.",
      highlight: "Gross margin for the fiscal year reached 68.5%"
    },
    'risk-supply': {
      title: "Supply chain exposure",
      documentName: "Apple FY2025 Annual Report",
      page: 24,
      passage: "The Company's business and financial performance are subject to risks including international regulatory compliance, supply chain concentration, and currency exchange volatility. A significant portion of the Company's hardware manufacturing remains concentrated with partners in specialized overseas facilities, making the Company vulnerable to geopolitical disruptions.",
      highlight: "hardware manufacturing remains concentrated with partners in specialized overseas facilities"
    },
    'risk-regulatory': {
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

  const handleAskQuestion = async (queryOverride) => {
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1200));

    // Mock response following the editorial structure
    setSearchResult({
      fact: "Total net sales reached $412.5 billion in fiscal 2025.",
      interpretation: "Revenue increased +14.2% YoY compared to $361.2 billion in FY2024.",
      why_it_matters: "Growth remained strong driven by enterprise services expansion despite foreign exchange headwinds.",
      source: "Apple FY2025 Annual Report · Page 18",
      evidence: "Total net sales increased 14.2% year-over-year to $412.5 billion in fiscal 2025."
    });
    
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-[#07090c] text-[#f1f3f5] font-sans selection:bg-[#339af0] selection:text-white">
      
      {/* 
        ====================================================
        EVIDENCE DRAWER (Right Side Split-Screen/Drawer)
        ====================================================
      */}
      {activeEvidence && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[45vw] lg:w-[40vw] bg-[#0c1015] border-l border-slate-800/60 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/40">
            <span className="text-xs font-mono text-slate-400 tracking-wider">SOURCE TRACE</span>
            <button onClick={closeEvidence} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-8 flex flex-col gap-12 overflow-y-auto">
            {/* The Claim */}
            <div className="space-y-4">
              <span className="text-xs font-mono text-slate-500">THE CLAIM</span>
              <h3 className="text-2xl font-light text-slate-200 leading-snug">
                "{activeEvidence.title}"
              </h3>
            </div>

            {/* Visual Connector */}
            <div className="w-px h-12 bg-gradient-to-b from-blue-500/50 to-transparent ml-4"></div>

            {/* The Document Source */}
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
      )}

      {/* 
        ====================================================
        MAIN EDITORIAL CONTENT
        ====================================================
      */}
      <main className="max-w-[700px] mx-auto px-6 py-24 md:py-32 flex flex-col gap-32 relative">

        {/* 01 — THE QUESTION */}
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
        </section>

        {/* 02 — THE INVESTIGATION */}
        <section className="space-y-12 border-t border-slate-800/50 pt-20">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-100 uppercase">
              Apple
            </h2>
            <p className="text-xl text-slate-400 font-light">
              FY2025 Research
            </p>
          </div>

          <p className="text-xl leading-relaxed text-slate-300 font-light max-w-xl">
            An evidence-backed look at performance, profitability, risks and the signals hidden inside Apple's filings.
          </p>

          <div className="space-y-3 font-mono text-sm text-slate-500 pt-6">
            <p className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              Apple FY2025 Annual Report (10-K)
            </p>
            <p className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              Apple Q3 FY2025 Financial Results
            </p>
            <p className="pt-4 text-slate-600">2 documents · 126 pages · Evidence verified</p>
          </div>
        </section>

        {/* 03 — THE FIRST FINDING */}
        <section className="space-y-16 border-t border-slate-800/50 pt-20">
          <h3 className="text-3xl font-light text-slate-200">
            Revenue continued to expand.
          </h3>

          <div className="space-y-4">
            <div className="text-7xl md:text-8xl font-light tracking-tighter text-slate-100">
              $412.5B
            </div>
            <div className="text-xl text-slate-400 font-mono">
              FY2025 revenue
            </div>
          </div>

          <div className="flex items-center gap-12 font-mono text-sm text-slate-400 border-l-2 border-slate-800 pl-8 py-2">
            <div>
              <p className="text-slate-600 mb-1">FY2024</p>
              <p className="text-lg text-slate-300">$361.2B</p>
            </div>
            <div className="flex items-center text-blue-400 gap-2">
              <span className="w-12 h-px bg-slate-700"></span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-lg">+14.2%</span>
            </div>
            <div>
              <p className="text-slate-600 mb-1">FY2025</p>
              <p className="text-lg text-slate-100">$412.5B</p>
            </div>
          </div>

          <div className="space-y-8 max-w-xl">
            <p className="text-xl leading-relaxed text-slate-300 font-light">
              The important question is not simply whether revenue grew, but what that growth means for the business. Top-line growth remained resilient driven by enterprise services expansion despite foreign exchange headwinds.
            </p>

            <button 
              onClick={() => handleOpenEvidence('finding-revenue')}
              className="group flex flex-col items-start gap-2 font-mono text-xs text-slate-500 hover:text-slate-300 transition-colors text-left"
            >
              <span className="text-slate-600">SOURCE</span>
              <span className="flex items-center gap-2 text-sm">
                Apple FY2025 Annual Report · Page 18 
                <span className="text-blue-400 group-hover:translate-x-1 transition-transform">View evidence →</span>
              </span>
            </button>
          </div>
        </section>

        {/* 05 — THE PROFITABILITY STORY */}
        <section className="space-y-16 border-t border-slate-800/50 pt-20">
          <div className="space-y-4">
            <h3 className="text-3xl font-light text-slate-200">
              Revenue is only half the story.
            </h3>
            <p className="text-xl text-slate-400 font-light">
              What happened to profitability as the business grew?
            </p>
          </div>

          <div className="space-y-8 font-mono max-w-sm">
            <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-4">
              <span className="text-sm text-slate-500">REVENUE</span>
              <span className="text-2xl text-slate-200">$412.5B</span>
            </div>
            <div className="w-px h-6 bg-slate-800 ml-4"></div>
            
            <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-4">
              <span className="text-sm text-slate-500">GROSS PROFIT</span>
              <span className="text-2xl text-slate-200">$282.5B</span>
            </div>
            <div className="w-px h-6 bg-slate-800 ml-4"></div>
            
            <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-4">
              <span className="text-sm text-slate-500">OPERATING INCOME</span>
              <span className="text-2xl text-slate-200">$123.2B</span>
            </div>
            <div className="w-px h-6 bg-slate-800 ml-4"></div>
            
            <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-4">
              <span className="text-sm text-slate-500">NET INCOME</span>
              <span className="text-2xl text-slate-200">$93.7B</span>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-xl leading-relaxed text-slate-300 font-light max-w-xl">
              Gross margin expanded from 64.1% to 68.5%. Profitability improved primarily due to a favorable shift in product mix toward higher-margin Services.
            </p>
            
            <button 
              onClick={() => handleOpenEvidence('finding-profitability')}
              className="group flex flex-col items-start gap-2 font-mono text-xs text-slate-500 hover:text-slate-300 transition-colors text-left"
            >
              <span className="text-slate-600">SOURCE</span>
              <span className="flex items-center gap-2 text-sm">
                Apple FY2025 Annual Report · Page 18 
                <span className="text-blue-400 group-hover:translate-x-1 transition-transform">View evidence →</span>
              </span>
            </button>
          </div>
        </section>

        {/* 06 — THE INTERPRETATION */}
        <section className="space-y-12 border-t border-slate-800/50 pt-20">
          <h3 className="text-3xl font-light text-slate-200">
            Reading between the lines.
          </h3>

          <div className="relative pl-8 border-l border-slate-800 space-y-12">
            
            <div className="space-y-4">
              <span className="text-xs font-mono text-slate-600">DOCUMENT SAYS</span>
              <p className="text-lg text-slate-300 font-serif italic">
                "Services net sales increased 16.5% year-over-year."
              </p>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-mono text-blue-500">DEALLENS READS THIS AS</span>
              <p className="text-xl text-slate-200 font-light">
                Services now accounts for over 23% of total enterprise sales, shifting the core business model.
              </p>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-mono text-slate-400">WHY IT MATTERS</span>
              <p className="text-xl text-slate-400 font-light leading-relaxed max-w-xl">
                This provides predictable recurring cash flows with gross margins exceeding 70%, insulating the company from hardware cycles.
              </p>
            </div>

          </div>
        </section>

        {/* 07 — RISKS */}
        <section className="space-y-16 border-t border-slate-800/50 pt-20">
          <h3 className="text-3xl font-light text-slate-200">
            Where could the story break?
          </h3>

          <div className="space-y-16 relative">
            <div className="absolute top-0 bottom-0 left-3.5 w-px bg-slate-800 -z-10"></div>
            
            {/* Risk 1 */}
            <div className="relative flex gap-8">
              <div className="bg-[#07090c] pt-1">
                <span className="font-mono text-sm text-slate-500 block w-8">01</span>
              </div>
              <div className="space-y-4 flex-1">
                <h4 className="text-2xl text-slate-200 font-light">Supply chain exposure</h4>
                <p className="text-lg text-slate-400 font-light leading-relaxed max-w-lg">
                  Hardware component manufacturing remains heavily concentrated in specialized overseas facilities, increasing vulnerability to geopolitical trade friction.
                </p>
                <button 
                  onClick={() => handleOpenEvidence('risk-supply')}
                  className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors text-left"
                >
                  Source · Page 24 →
                </button>
              </div>
            </div>

            {/* Risk 2 */}
            <div className="relative flex gap-8">
              <div className="bg-[#07090c] pt-1">
                <span className="font-mono text-sm text-slate-500 block w-8">02</span>
              </div>
              <div className="space-y-4 flex-1">
                <h4 className="text-2xl text-slate-200 font-light">Regulatory pressure</h4>
                <p className="text-lg text-slate-400 font-light leading-relaxed max-w-lg">
                  Compliance with evolving international privacy and AI frameworks (GDPR/EU AI Act) could significantly increase localized legal expenses.
                </p>
                <button 
                  onClick={() => handleOpenEvidence('risk-regulatory')}
                  className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors text-left"
                >
                  Source · Page 24 →
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 08 — POSITIVE SIGNALS */}
        <section className="space-y-12 border-t border-slate-800/50 pt-20">
          <h3 className="text-3xl font-light text-slate-200">
            But the filings also reveal positive signals.
          </h3>

          <div className="space-y-6 pt-4 text-xl font-light text-slate-300 border-l border-slate-800 pl-8">
            <p className="flex items-center gap-6">
              <span className="text-emerald-500/50">+</span>
              Sustained margin expansion
            </p>
            <div className="w-24 h-px bg-slate-800"></div>
            <p className="flex items-center gap-6">
              <span className="text-emerald-500/50">+</span>
              Services segment recurring revenue growth
            </p>
            <div className="w-24 h-px bg-slate-800"></div>
            <p className="flex items-center gap-6">
              <span className="text-emerald-500/50">+</span>
              Robust operating cash generation ($120.5B)
            </p>
          </div>
        </section>

        {/* 09 — WHAT REMAINS UNKNOWN */}
        <section className="space-y-12 border-t border-slate-800/50 pt-20">
          <h3 className="text-3xl font-light text-slate-200">
            Not everything can be answered from these filings.
          </h3>
          <p className="text-lg text-slate-400 font-light">
            Good research knows what it doesn't know. 
          </p>

          <div className="space-y-10 pt-4 max-w-xl">
            <div className="space-y-2">
              <span className="font-mono text-xs text-amber-500/60">01</span>
              <p className="text-lg text-slate-300 font-light leading-relaxed">
                Current filings do not disclose exact Q4 product line breakdowns before the upcoming 10-K release.
              </p>
            </div>
            
            <div className="space-y-2">
              <span className="font-mono text-xs text-amber-500/60">02</span>
              <p className="text-lg text-slate-300 font-light leading-relaxed">
                Management commentary provides guidance ranges, but no independently verified audit evidence is available for Q1 FY2026 projections.
              </p>
            </div>
          </div>
        </section>

        {/* 10 — CROSS-DOCUMENT CHECK */}
        <section className="space-y-16 border-t border-slate-800/50 pt-20">
          <h3 className="text-3xl font-light text-slate-200">
            Do the documents agree?
          </h3>

          <div className="grid grid-cols-2 gap-8 font-mono text-sm text-slate-400 border-b border-slate-800/50 pb-8">
            <div>
              <p className="text-slate-600 mb-2">DOCUMENT A</p>
              <p className="text-slate-200">Annual Report FY2025</p>
            </div>
            <div>
              <p className="text-slate-600 mb-2">DOCUMENT B</p>
              <p className="text-slate-200">Q3 Results FY2025</p>
            </div>
          </div>

          <div className="space-y-12">
            
            {/* Metric 1 */}
            <div className="space-y-6">
              <p className="text-lg font-medium text-slate-200 font-sans">Reported Revenue</p>
              <div className="grid grid-cols-2 gap-8 font-mono text-lg text-slate-300">
                <div>$412.5B</div>
                <div>$94.0B</div>
              </div>
              <div className="flex items-center gap-3 text-sm font-mono text-slate-500 pt-2 border-t border-slate-800/40 w-fit">
                <span className="text-emerald-500">✓</span>
                Expected (Different reporting periods)
              </div>
            </div>

            {/* Metric 2 */}
            <div className="space-y-6">
              <p className="text-lg font-medium text-slate-200 font-sans">Net Retention Rate</p>
              <div className="grid grid-cols-2 gap-8 font-mono text-lg text-slate-300">
                <div>94% NRR</div>
                <div>98% Retention claimed</div>
              </div>
              <div className="flex items-center gap-3 text-sm font-mono text-slate-500 pt-2 border-t border-slate-800/40 w-fit">
                <span className="text-amber-500">⚠</span>
                Reporting scope differs between audited vs deck
              </div>
            </div>

          </div>
        </section>

        {/* 11 — THE RESEARCH DESK */}
        <section className="space-y-16 border-t border-slate-800/50 pt-20">
          <div className="space-y-4">
            <h3 className="text-3xl font-light text-slate-200">
              You've seen what we found.<br />
              Now ask your own question.
            </h3>
          </div>

          <div className="space-y-8 max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Ask anything about the documents..."
              className="w-full bg-transparent border-b border-slate-700 hover:border-slate-500 focus:border-blue-500 py-4 text-xl font-light focus:outline-none transition-colors placeholder:text-slate-600"
            />

            <div className="space-y-4 font-mono text-sm">
              <button onClick={() => handleAskQuestion("What drove the change in profitability?")} className="block text-slate-500 hover:text-slate-300 transition-colors text-left">
                What drove the change in profitability?
              </button>
              <button onClick={() => handleAskQuestion("Which segment grew fastest?")} className="block text-slate-500 hover:text-slate-300 transition-colors text-left">
                Which segment grew fastest?
              </button>
              <button onClick={() => handleAskQuestion("Does management's guidance align with historical performance?")} className="block text-slate-500 hover:text-slate-300 transition-colors text-left">
                Does management's guidance align with historical performance?
              </button>
            </div>
          </div>

          {/* Search Result Inline Editoral Display */}
          {searchResult && (
            <div className="pt-12 mt-12 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative pl-8 border-l border-slate-800 space-y-12">
                <div className="space-y-4">
                  <span className="text-xs font-mono text-slate-600">ANSWER</span>
                  <p className="text-xl text-slate-200 font-light">
                    {searchResult.fact} {searchResult.interpretation}
                  </p>
                </div>

                <div className="space-y-4">
                  <span className="text-xs font-mono text-slate-600">WHY IT MATTERS</span>
                  <p className="text-xl text-slate-400 font-light leading-relaxed max-w-xl">
                    {searchResult.why_it_matters}
                  </p>
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
        </section>

        {/* 13 — WHY DEALLENS */}
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

        {/* 14 — UNDER THE HOOD */}
        <section className="pt-32 pb-12 text-sm">
          <button 
            onClick={() => setShowArchitecture(!showArchitecture)}
            className="font-mono text-xs text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest flex items-center gap-2"
          >
            Under the Hood
            <ChevronDown className={`w-3 h-3 transition-transform ${showArchitecture ? 'rotate-180' : ''}`} />
          </button>

          {showArchitecture && (
            <div className="mt-12 space-y-12 animate-in fade-in duration-300">
              <div className="font-mono text-xs text-slate-500 space-y-4 whitespace-pre">
                <p>PDF</p>
                <p> ↓ </p>
                <p>Parsing</p>
                <p> ↓ </p>
                <p>Page-aware chunks</p>
                <p> ↓ </p>
                <p>Hybrid retrieval (Dense + Sparse RRF)</p>
                <p> ↓ </p>
                <p>Evidence verification</p>
                <p> ↓ </p>
                <p>Deterministic workflow</p>
                <p> ↓ </p>
                <p className="text-blue-400">Research result</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs text-slate-600 pt-8 border-t border-slate-800/30">
                <p>FastAPI</p>
                <p>PostgreSQL 16 + pgvector</p>
                <p>Celery 5 + Redis 7</p>
                <p>Hybrid RRF retrieval</p>
                <p>Citation verification</p>
                <p>Evaluation framework</p>
                <p>Docker / CI</p>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
