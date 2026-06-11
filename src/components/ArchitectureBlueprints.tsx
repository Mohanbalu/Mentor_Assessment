import React, { useState } from 'react';
import { ARCHITECTURE_BLUEPRINTS, BlueprintSection } from '../data/blueprint';
import { BookOpen, Map, Settings, Layers, Code, LayoutGrid, CheckCircle2, Cpu, Sparkles, Smartphone, TableProperties } from 'lucide-react';

export default function ArchitectureBlueprints() {
  const [activeTab, setActiveTab] = useState<string>('folder-structure');

  const getSectionIcon = (id: string) => {
    switch (id) {
      case 'folder-structure': return <Layers className="w-5 h-5" />;
      case 'routing': return <LayoutGrid className="w-5 h-5" />;
      case 'state-mgmt': return <Cpu className="w-5 h-5" />;
      case 'design-system': return <Sparkles className="w-5 h-5" />;
      case 'flow-diagram': return <Map className="w-5 h-5" />;
      case 'future-scalability': return <Settings className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const selectedSection = ARCHITECTURE_BLUEPRINTS.find(s => s.id === activeTab) || ARCHITECTURE_BLUEPRINTS[0];

  return (
    <div id="architecture-blueprints-root" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Blueprint Header */}
      <div id="blueprint-intro-header" className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 text-xs font-mono bg-indigo-900/40 text-indigo-300 rounded-full border border-indigo-800/60 uppercase tracking-widest">
              Platform Architecture
            </span>
            <h1 className="text-3xl md:text-4xl font-sans tracking-tight font-bold mt-2 text-slate-100">
              Technical Blueprints & UI/UX Design System
            </h1>
            <p className="text-slate-400 mt-1 max-w-2xl text-sm md:text-base font-sans">
              Comprehensive specifications, design tokens, responsive guides, database-free mechanics, and development plans.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs font-mono text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            COMPILER ACTIVE: REACT 19 + VITEST
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div id="blueprint-navigation-sidebar" className="lg:col-span-1 flex flex-col gap-2">
          <p className="text-xs uppercase font-mono tracking-widest text-slate-500 px-3 mb-2 font-bold">
            Blueprint Modules
          </p>
          {ARCHITECTURE_BLUEPRINTS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`flex items-center gap-3 px-4 py-3.0 rounded-lg text-left transition-all text-sm font-sans ${
                activeTab === section.id
                  ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-950/50 border border-indigo-500/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/40'
              }`}
            >
              {getSectionIcon(section.id)}
              <span className="truncate">{section.title.split('. ')[1]}</span>
            </button>
          ))}

          {/* Interactive Wireframes Shortcut */}
          <div className="mt-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1 font-bold">
              Development Stack
            </h4>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['React 19', 'TypeScript', 'Tailwind v4', 'Lucide Icons', 'HTML5 Telemetry', 'LocalStorage State'].map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] rounded-md border border-slate-700/50">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div id="blueprint-content-viewport" className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3 font-sans">
              {getSectionIcon(selectedSection.id)}
              {selectedSection.title}
            </h2>
            <p className="text-slate-400 text-sm mt-1 font-sans font-medium">
              {selectedSection.subtitle}
            </p>
          </div>

          {/* Render Markdown-like text fields neatly */}
          <div className="prose prose-slate prose-invert max-w-none text-slate-300 font-sans leading-relaxed text-sm md:text-base flex flex-col gap-4 whitespace-pre-wrap">
            {selectedSection.content.split('\n\n').map((para, idx) => {
              // Code Block Formatting
              if (para.startsWith('```')) {
                const codeText = para.replace(/```[a-z]*/g, '').trim();
                return (
                  <pre key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl overflow-x-auto text-xs font-mono text-indigo-300 leading-normal">
                    <code>{codeText}</code>
                  </pre>
                );
              }

              // List Items Formatting
              if (para.startsWith('- ') || para.startsWith('* ')) {
                return (
                  <ul key={idx} className="list-disc pl-5 flex flex-col gap-1 text-slate-300">
                    {para.split('\n').map((item, idy) => (
                      <li key={idy} className="ml-1">
                        {item.replace(/^[-*]\s+/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }

              // Heading level 3 Formatting
              if (para.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-lg font-bold text-white tracking-tight mt-4 border-l-2 border-indigo-500 pl-3">
                    {para.replace('### ', '')}
                  </h3>
                );
              }

              // Heading level 2 Formatting
              if (para.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-xl font-bold text-white tracking-tight mt-6">
                    {para.replace('## ', '')}
                  </h2>
                );
              }

              return <p key={idx} className="text-slate-300">{para}</p>;
            })}
          </div>

          {/* Interactive Extra Custom Visuals for the Design System */}
          {activeTab === 'design-system' && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3 font-bold">
                Live Design Tokens Preview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500">CANVAS GROUND</span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 rounded-md bg-slate-950 border border-slate-800"></div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-200">#0F172A</h4>
                      <p className="text-[10px] text-slate-400">slate-950 (Slate Base)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500">ACCENT METALS</span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 rounded-md bg-indigo-600"></div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-200">#4F46E5</h4>
                      <p className="text-[10px] text-slate-400">indigo-600 (Primary Cobalt)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500">TELEMETRY WARNING</span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 rounded-md bg-amber-500"></div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-200">#F59E0B</h4>
                      <p className="text-[10px] text-slate-400">amber-500 (Cheat Alert Core)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mt-4 flex flex-col gap-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Typeface Pairing Hierarchy</span>
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400">Space Grotesk (Headers)</span>
                    <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
                      Aa Bb Cc Dd Ee Ff Gg 12345
                    </h1>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400">Inter (Body Sans)</span>
                    <p className="text-sm font-sans text-slate-300 mt-0.5">
                      The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400">JetBrains Mono (SaaS / Code Metrics)</span>
                    <p className="text-xs font-mono text-emerald-400 mt-0.5">
                      const evaluateCandidate = (score) =&gt; score &gt;= 80 ? 'Placement Ready' : 'Training Needed';
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Flow Diagram Elements */}
          {activeTab === 'flow-diagram' && (
            <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-4">
                Structured App Routing & View Logic
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { screen: 'Screen 0-2', desc: 'Onboarding prediction & instruction locks' },
                  { screen: 'Screen 3-4', desc: 'Profile and Subjective self scaling' },
                  { screen: 'Screen 5-9', desc: 'Timed Assessments (MCQ & Theory matrices)' },
                  { screen: 'Screen 10-12', desc: 'High fidelity Code Editor & Essays writeouts' },
                ].map((step, index) => (
                  <div key={index} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
                    <span className="text-[11px] font-mono font-bold text-indigo-400">Step 0{index + 1}</span>
                    <h5 className="text-xs font-bold text-slate-200">{step.screen}</h5>
                    <p className="text-[10px] text-slate-400 leading-snug">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wireframe Descriptions for every page in a beautiful expandable grid */}
      <div id="blueprint-wireframe-descriptions" className="max-w-7xl mx-auto mt-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8">
        <h3 className="text-lg font-bold tracking-tight text-white mb-2 flex items-center gap-2 font-sans">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          Interactive Wireframe Specifications (Screens 0 to 14)
        </h3>
        <p className="text-slate-400 text-xs md:text-sm mb-6 font-sans">
          Comprehensive wireframe layout schemes, micro-interactions, responsive adapters, and placement instructions for all 15 assessment screens.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            {
              screen: 'Screen 0: Prediction',
              layout: 'Card centric, minimalist hero box (max-w-md). Off-center background.',
              controls: 'Radio buttons for expected grades (30-40, etc.), big continue slider trigger.',
              responsiveness: 'Single column center layouts. Auto adapts to narrow phone displays.'
            },
            {
              screen: 'Screen 1: Welcome Page',
              layout: 'Bento columns (2x1). Left is meta description, right is syllabus details.',
              controls: 'Prominent 3D indigo start button with hover animation triggers.',
              responsiveness: 'Collapses to single stack layout on tablets with padding.'
            },
            {
              screen: 'Screen 2: Instruction Sheet',
              layout: 'Rules card container layered with critical red alerts warnings.',
              controls: 'Single toggle checkbox triggering action state button (disabled by default).',
              responsiveness: 'Inner text fields wrapped inside auto scroll regions to save height.'
            },
            {
              screen: 'Screen 3: Profile Ledger',
              layout: 'Detailed multi-form input layout columns (2x2 layout matrix).',
              controls: 'Dynamic input validator fields (names, email patterns, cgpa sliders & linkedin urls).',
              responsiveness: 'Single column grid stack rules for mobile view ports.'
            },
            {
              screen: 'Screen 4: Self-Assessment Scale',
              layout: 'Skill checklist metrics layout with vertical parameters.',
              controls: 'Smooth slider handles (1-10 points scales) custom-designed in Tailwind Cobalt.',
              responsiveness: 'Side-by-side grids convert to vertical rows on small displays.'
            },
            {
              screen: 'Screens 5-9: Timed Sections',
              layout: 'Top: persistent section progress metrics, sidebar navigation index, main MCQ grid.',
              controls: 'Radio selection list, Jump Index nodes, countdown clocks triggers.',
              responsiveness: 'Quest navigator moves to header collapse drawer on phone touch screens.'
            },
            {
              screen: 'Screen 10: Coding Round',
              layout: 'Full split-screen code suite (50% instructions & tests, 50% language dropdown + source console).',
              controls: 'Language type dropdown list, monospace editor canvas, execute mock testing variables.',
              responsiveness: 'Stacked tabs layout (Instructions Tab vs Editor Tab) prevents cramming on mobile.'
            },
            {
              screen: 'Screens 11-12: Prompt & Mindset',
              layout: 'Split narrative cards outlining coding prompts and behavioral essays.',
              controls: 'Rich textarea modules counting characters in real time.',
              responsiveness: 'Textareas maximize viewport with bottom action bars.'
            },
            {
              screen: 'Screen 13: Summary Evaluation',
              layout: 'Review card displaying completion state colors (unanswered warnings labeled in red).',
              controls: 'Submit button linked to security confirmation modal overlays.',
              responsiveness: 'Flex headers wrapping content tables neatly into vertical tiles.'
            },
            {
              screen: 'Screen 14: Submission Success',
              layout: 'Minimal display centering positive checkmarks, instructions, and next-steps.',
              controls: 'Redirect trigger buttons allowing users to return to main landing platforms safely.',
              responsiveness: 'Auto margins centered regardless of the client screen sizes.'
            }
          ].map((wire, index) => (
            <div key={index} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span className="text-xs font-mono font-bold text-indigo-400">{wire.screen}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Wireframe Layout</span>
              </div>
              <div className="text-xs font-sans text-slate-300 flex flex-col gap-2">
                <div>
                  <span className="font-mono text-slate-500 text-[10px] uppercase block">Structure:</span>
                  <p className="mt-0.5">{wire.layout}</p>
                </div>
                <div>
                  <span className="font-mono text-slate-500 text-[10px] uppercase block">Controls:</span>
                  <p className="mt-0.5 text-indigo-200">{wire.controls}</p>
                </div>
                <div>
                  <span className="font-mono text-slate-500 text-[10px] uppercase block">Responsive Logic:</span>
                  <p className="mt-0.5 text-slate-400 italic">{wire.responsiveness}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
