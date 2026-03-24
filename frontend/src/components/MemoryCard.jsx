import './MemoryCard.css';

const TYPE_META = {
  note: { icon: '📝', label: 'Note' },
  audio: { icon: '🎙️', label: 'Audio' },
  image: { icon: '🖼️', label: 'Image' },
  event: { icon: '📅', label: 'Event' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function MemoryCard({ memory, onClick }) {
  const { type = 'note', title, content, audio_url, image_url, created_at } = memory || {};
  const meta = TYPE_META[type] || TYPE_META.note;

  return (
    <article className="memory-card" role="button" tabIndex={0} onClick={() => onClick?.(memory)} onKeyDown={(e) => e.key === 'Enter' && onClick?.(memory)}>
      <div className="memory-card-header">
        <span className="memory-type-badge">{meta.icon} {meta.label}</span>
        {created_at && <time className="memory-date">{formatDate(created_at)}</time>}
      </div>

      {title && <h3 className="memory-title">{title}</h3>}

      {type === 'image' && image_url && (
        <img className="memory-image" src={image_url} alt={title || 'Memory image'} loading="lazy" />
      )}

      {type === 'audio' && audio_url && (
        <audio className="memory-audio" src={audio_url} controls onClick={(e) => e.stopPropagation()} />
      )}

      {content && <p className="memory-content">{content}</p>}
    </article>
  );
}
