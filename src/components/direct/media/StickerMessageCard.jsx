const LEGACY_STICKER_MAP = {
  'marathi_study_start.png': '/stickers/exam_mode/a9f02a12-c5cb-4916-a0eb-d00ef3977558.webp',
  'marathi_crying_study.png': '/stickers/exam_mode/9943a213-0058-4d99-b7f1-e525e7150195.webp',
  'marathi_syllabus_shock.png': '/stickers/exam_mode/73137091-68c1-481c-b69e-5653530a7641.webp',
  'marathi_god_save_me.png': '/stickers/exam_mode/6cfee4b4-a440-4e69-a700-2b4243cf0e78.webp',
  'marathi_one_night_enough.png': '/stickers/exam_mode/236c5357-19aa-4856-bb66-6dbf6236b28b.webp',
  'marathi_pass_party.png': '/stickers/exam_mode/3aff3d20-d78f-4f7b-b0e9-d125f0b61da5.webp',
  'marathi_paper_easy_lie.png': '/stickers/exam_mode/1c76ce99-256c-4b08-b503-1baef6700b71.webp',
  'marathi_mazha_sampal.png': '/stickers/exam_mode/311998db-4e3b-4564-9112-82b02f1b8c9a.webp',
  'marathi_result_out.png': '/stickers/exam_mode/85626539-a8d3-4c21-b82b-baa6dc1fb04d.webp',
  'marathi_topper_mode.png': '/stickers/exam_mode/6766db98-c5ad-497d-9d36-61a35a4540ad.webp',
  'marathi_gossip_kutheye.png': '/stickers/friend_group_reactions/7817be9d-a7e1-4252-8434-382c1d4e681f.webp',
  'marathi_kay_zhal_pudhe.png': '/stickers/friend_group_reactions/10b3aee3-8731-42ba-9138-508f9a0604ba.webp',
  'marathi_sang_sagla.png': '/stickers/friend_group_reactions/35ada447-153f-4413-bfa1-31604ae03e68.webp',
  'marathi_bhau_aapan_adaklo.png': '/stickers/friend_group_reactions/679b7be4-e298-4684-832e-dab717492c59.webp',
  'marathi_tu_kharach_kelas.png': '/stickers/friend_group_reactions/6c9e15cc-26bc-4887-86b2-7f39b560f190.webp',
  'marathi_plan_fail.png': '/stickers/friend_group_reactions/937df8b2-0a73-441f-9ac3-018cd1554e00.webp',
  'marathi_mi_kahi_aiklach_nahi.png': '/stickers/friend_group_reactions/a8846a5e-285f-4599-a365-e27b7c1f6bfb.webp',
  'marathi_game_zhalay_bhau.png': '/stickers/meme_chaotic/feef4509-bec9-429a-b3cd-acda409e2a85.webp',
  'marathi_lay_bhari.png': '/stickers/meme_chaotic/fd8b8a88-0ec0-41d5-9f7f-00c8f8e57031.webp',
  'marathi_bc_kay_chalay.png': '/stickers/meme_chaotic/f1be9717-e0a9-4d19-b361-06d9a14a1284.webp',
  'marathi_kay_pan_rav.png': '/stickers/meme_chaotic/98e448b3-9bdc-4837-9f26-1f90e50cc79b.webp',
  'marathi_mazha_doka_firal.png': '/stickers/meme_chaotic/d8c0c2a2-ef0a-4cc9-86d3-63378ee71d40.webp',
  'marathi_he_kay_zhal.png': '/stickers/meme_chaotic/4df7c914-3241-49ac-b465-9c116e8b08ac.webp',
  'marathi_aata_mazhi_vat_lagli.png': '/stickers/meme_chaotic/443b4d3c-8a8d-4ad5-b004-3035092466ef.webp',
  'marathi_fuck_this.png': '/stickers/meme_chaotic/b0ec9686-359f-4537-ae18-5351825c0698.webp',
  'marathi_reply_aala.png': '/stickers/crush_romance/dcc361a9-14f0-4b7e-a67a-1400356c0ecd.png',
  'marathi_seen_sodla.png': '/stickers/crush_romance/c6f61d45-3890-4874-99f3-25359cafbd74.png',
  'marathi_crush_online.png': '/stickers/crush_romance/a22a0a8c-2a47-4271-92c0-806e9dc4c994.png',
  'marathi_ti_disli.png': '/stickers/crush_romance/5c20b875-44d9-4201-8e07-7b8aa49a7954.png',
  'marathi_bhau_kahitari_kar.png': '/stickers/crush_romance/68700e5b-aabf-4860-bd11-2d3169779b4f.png',
};

function resolveStickerUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  for (const [legacyKey, newTarget] of Object.entries(LEGACY_STICKER_MAP)) {
    if (rawUrl.includes(legacyKey)) {
      return newTarget;
    }
  }
  return rawUrl;
}

/**
 * StickerMessageCard — Renders transparent, borderless floating stickers in chat
 * with zero Cumulative Layout Shift (CLS) and no container clipping.
 */
export default function StickerMessageCard({ attachment, isMine, status = 'sent', onRetry }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!attachment) return null;

  let parsed = attachment;
  if (typeof attachment === 'string') {
    try {
      parsed = JSON.parse(attachment);
    } catch {
      parsed = { url: attachment };
    }
  }

  const rawUrl = parsed.url || parsed.preview_url || parsed.file || parsed.src || (typeof parsed === 'string' ? parsed : null);
  const url = resolveStickerUrl(rawUrl);
  const alt = parsed.alt || parsed.name || parsed.title || 'Sticker';

  // Revoke temporary blob URL on unmount or URL change
  useEffect(() => {
    return () => {
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  if (!url || error) {
    return (
      <div
        className="flex items-center justify-between p-3 rounded-2xl text-xs font-mono gap-2"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px dashed rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
        }}
      >
        <span>[Sticker Unavailable]</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white text-[10px] cursor-pointer"
          >
            <RotateCw size={10} /> Retry
          </button>
        )}
      </div>
    );
  }

  const isFailed = status === 'failed';

  return (
    <div
      className="sticker-message-container select-none group relative"
      style={{
        width: 'fit-content',
        maxWidth: 'min(240px, 60vw)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Skeleton Pulse before load */}
      {!loaded && !isFailed && (
        <div
          className="rounded-2xl animate-pulse"
          style={{
            width: 180,
            height: 180,
            background: 'rgba(255, 255, 255, 0.06)',
          }}
        />
      )}

      <img
        src={url}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-auto h-auto max-w-[220px] max-h-[220px] object-contain transition-all duration-200 group-hover:scale-105 ${
          loaded ? (isFailed ? 'opacity-40 grayscale' : 'opacity-100') : 'opacity-0 absolute inset-0'
        }`}
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.28))',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
      />

      {/* In-Bubble Retry Overlay on Upload Failure */}
      {isFailed && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-2 gap-1.5 z-10">
          <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
            <AlertCircle size={12} /> Failed
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <RotateCw size={10} /> Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
