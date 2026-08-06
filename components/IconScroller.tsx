"use client";

import React from 'react'
import IconPreview from './IconPreview'

interface ScrollerItem {
  id: string;
  type: 'library' | 'svg';
  key?: string;
  svgData?: string;
  title?: string;
}

interface IconScrollerProps {
  profile: any;
  siteSettings?: any;
}

// This component is a client component (file already has "use client")
export default function IconScroller({ profile }: IconScrollerProps) {
  const items: ScrollerItem[] = (profile && profile.iconScroller) || [];
  if (!items || items.length === 0) return null;

  // Duplicate items to make a seamless loop
  const displayItems = items.concat(items);
  const marqueeDurationSec = Math.max(8, items.length * 4); // scale duration with number of items

  return (
    <div className="w-full flex justify-center pt-0 pb-6 bg-transparent">
      <div className="scroller-viewport">
        <div
          className="scroller-track"
          role="presentation"
          // CSS var controls the speed/duration from JS
          style={{ ['--marquee-duration' as any]: `${marqueeDurationSec}s` }}
        >
          {displayItems.map((it, idx) => (
            <div key={`${it.id}-${idx}`} className="scroller-item">
              <div className="orbit">
                {it.type === 'library' ? (
                  <IconPreview name={it.key || 'external'} className="icon" />
                ) : (
                  it.svgData ? (
                    <div className="icon" dangerouslySetInnerHTML={{ __html: it.svgData }} />
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
          .scroller-viewport {
          width: min(680px, 80%);
          max-width: 960px;
          height: 96px; /* reduced height to tighten spacing */
          overflow: hidden; /* container overflow hidden: hides the duplicated set as it moves */
          display: flex;
          align-items: center;
          justify-content: center;
          /* fade edges so outer elements smoothly disappear */
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%);
        }

        /* the track holds two identical sets of icons (we duplicate in JS) and is moved left by 50% to create a seamless loop */
        .scroller-track {
          display: flex;
          flex-wrap: nowrap; /* important: do not wrap items */
          align-items: center;
          gap: 36px; /* consistent spacing between items */
          transform: translate3d(0,0,0);
          will-change: transform;
          /* marquee disabled to keep icons static on hero */
          animation: none;
        }

        /* each item size; adjust to show roughly 3 icons in the viewport depending on gap */
        .scroller-item {
          flex: 0 0 auto;
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

          .orbit {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          /* subtle background to make icons pop */
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(4px);
          transform-origin: center;
          /* orbit motion disabled to keep icons static */
          animation: none;
        }

        .icon {
          width: 56px;
          height: 56px;
          display: inline-flex;
        }

        /* marquee moves the track left by 50% (duplicate content ensures seamless loop) */
        /* move the whole track left by 50% (because track contains two identical sets) to create a seamless loop */
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        /* small circular orbiting motion */
        @keyframes orbit {
          0% { transform: translateY(-6px) rotate(0deg); }
          25% { transform: translateX(6px) rotate(15deg); }
          50% { transform: translateY(6px) rotate(0deg); }
          75% { transform: translateX(-6px) rotate(-15deg); }
          100% { transform: translateY(-6px) rotate(0deg); }
        }

        /* reduce motion for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .scroller-track { animation: none; }
          .orbit { animation: none; }
        }
      `}</style>
    </div>
  );
}
