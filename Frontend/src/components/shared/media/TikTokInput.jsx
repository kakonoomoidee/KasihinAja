import React from "react";

/**
 * Component for handling TikTok media input with live preview.
 *
 * @param {object} props
 * @param {string} props.mediaLink Current TikTok URL.
 * @param {Function} props.setMediaLink Setter for TikTok URL.
 * @param {string} props.glassInput Base CSS for inputs.
 * @returns {React.ReactElement}
 */
export default function TikTokInput({ mediaLink, setMediaLink, glassInput }) {
  const extractTiktokId = (url) => {
    if (!url) return null;
    const match = url.match(/video\/(\d+)/);
    return match ? match[1] : null;
  };

  const videoId = extractTiktokId(mediaLink);

  return (
    <div className="bg-pink-500/5 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-4 space-y-4">
      <input
        type="text"
        className={`${glassInput} text-sm focus:border-pink-400/50`}
        value={mediaLink}
        onChange={(e) => setMediaLink(e.target.value)}
        placeholder="Paste TikTok video URL here..."
      />

      {videoId && (
        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/50 flex justify-center">
          <iframe
            src={`https://www.tiktok.com/embed/v2/${videoId}`}
            className="w-full max-w-[325px] h-full"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="TikTok video preview"
          />
        </div>
      )}
    </div>
  );
}