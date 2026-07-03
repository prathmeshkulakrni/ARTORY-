export default function ArtoryLogo({ size = 56, showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <img
        src="/assets/artory-logo.png"
        alt="Artory"
        className="shrink-0 rounded-full object-cover ring-1 ring-white/10 shadow-[0_10px_30px_rgba(124,58,237,0.25)]"
        style={{ width: size, height: size }}
      />
      {showText && (
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-white tracking-tighter leading-none">ARTORY</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Create. Learn. Inspire.</p>
        </div>
      )}
    </div>
  );
}
