'use client';

import React from 'react';
import {
  Image as ImageIcon,
  Type,
  PenTool,
  Sparkles,
  Layers,
  Smile,
} from 'lucide-react';
import { TOOL_MODES } from '../types/storyEditorTypes';

const TOOLS = [
  {
    id: TOOL_MODES.MEDIA,
    label: 'Media',
    icon: ImageIcon,
    badge: null,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: TOOL_MODES.TEXT,
    label: 'Text',
    icon: Type,
    badge: null,
    gradient: 'from-fuchsia-500 to-pink-600',
  },
  {
    id: TOOL_MODES.DRAW,
    label: 'Draw',
    icon: PenTool,
    badge: null,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: TOOL_MODES.STICKER,
    label: 'Stickers',
    icon: Sparkles,
    badge: 'New',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    id: TOOL_MODES.LAYERS,
    label: 'Layers',
    icon: Layers,
    badge: null,
    gradient: 'from-emerald-500 to-teal-600',
  },
];

/**
 * BottomToolbar Component
 * Floating/docked bottom toolbar for switching active story creation tool modes.
 * 
 * @param {Object} props
 * @param {string} props.activeTool Currently active tool mode ('media' | 'text' | 'draw' | 'stickers' | 'layers' | 'select')
 * @param {(toolId: string) => void} props.onSelectTool Callback when a tool button is tapped
 * @param {string} [props.className='']
 */
export default function BottomToolbar({
  activeTool,
  onSelectTool,
  className = '',
}) {
  return (
    <nav
      aria-label="Story creation tools"
      className={`relative z-40 w-full flex items-center justify-center px-4 pb-3 sm:pb-5 ${className}`}
      style={{
        paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 12px) + 8px)',
      }}
    >
      <div className="flex items-center gap-1.5 sm:gap-2.5 px-3 py-2 rounded-3xl bg-gray-950/85 dark:bg-black/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 max-w-md w-full justify-around sm:justify-center">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              className={`relative flex flex-col items-center justify-center px-3 sm:px-4 py-2 rounded-2xl transition-all active:scale-95 group ${
                isActive
                  ? 'bg-white/15 text-white font-bold shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {/* Active Indicator Top Glow */}
              {isActive && (
                <div className="absolute -top-1.5 w-6 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-sm" />
              )}

              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-white scale-110'
                    : 'text-gray-400 group-hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
              </div>

              <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight font-medium leading-none">
                {tool.label}
              </span>

              {/* Badge */}
              {tool.badge && !isActive && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-500 text-white leading-tight uppercase scale-90">
                  {tool.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
