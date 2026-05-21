import * as React from "react";
import { useState } from "react";
import { Review } from "../../../types";
import { 
  MessageSquare, Star, ThumbsUp, ThumbsDown, AlertTriangle, Check, Send 
} from "lucide-react";

interface GameDetailsReviewsProps {
  reviews: Review[];
  onAddReview: (review: { author: string; rating: number; comment: string; recommend: boolean }) => void;
}

export default function GameDetailsReviews({ reviews, onAddReview }: GameDetailsReviewsProps) {
  // form states
  const [authorName, setAuthorName] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successAnimation, setSuccessAnimation] = useState(false);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !userComment.trim()) {
      setErrorMsg("Lütfen isminizi ve inceleme yorumunuzu doldurun!");
      return;
    }
    
    onAddReview({
      author: authorName,
      rating: userRating,
      comment: userComment,
      recommend
    });

    setUserComment("");
    setErrorMsg("");
    setSuccessAnimation(true);
    setTimeout(() => setSuccessAnimation(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Reviews feed/list */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase text-slate-500 tracking-wider border-b border-slate-900 pb-2">
          Kullanıcı İncelemeleri ve Yorumlar
        </h4>

        {reviews.length === 0 ? (
          <div className="text-center py-6 text-slate-500 font-medium font-sans text-sm">
            Henüz hiç inceleme girilmemiş. İlk yorumu aşağıdan yazarak fark yaratın! 🚀
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {reviews.map((rev) => (
              <div 
                key={rev.id}
                className="p-4 bg-slate-900/30 rounded-xl border border-slate-900 space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold font-sans text-sm shrink-0">
                      {rev.author}
                    </span>
                    <span className="text-[10px] text-slate-500 pb-0.5">// {rev.date}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stars visualization */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, index) => (
                        <Star 
                          key={index}
                          className={`w-3.5 h-3.5 ${
                            index < rev.rating ? "fill-current text-white" : "text-slate-800"
                          }`} 
                        />
                      ))}
                    </div>

                    {/* Recommendation Badge */}
                    {rev.recommend ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 shrink-0">
                        <ThumbsUp className="w-3 h-3" /> Tavsiye Ediyor
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-400 bg-red-900/10 px-2.5 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1 shrink-0">
                        <ThumbsDown className="w-3 h-3" /> Tavsiye Etmiyor
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed font-sans font-medium pl-1 italic">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form layout */}
      <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-900 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-violet-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Yeni İnceleme Ekle
          </h4>
        </div>

        <form onSubmit={handleSubmitReview} className="space-y-4 font-sans text-sm text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nickname */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-mono uppercase tracking-wide">
                Adınız veya Oyuncu Adı:
              </label>
              <input
                id="review_author_input"
                type="text"
                placeholder="Örn: X_Gamer_99"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500/80 font-sans"
              />
            </div>

            {/* Stars Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-mono uppercase tracking-wide">
                Değerlendirme Puanı (1-5 Yıldız):
              </label>
              <div className="flex items-center gap-3 h-10">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="focus:outline-none cursor-pointer p-0 border-0 bg-transparent"
                    >
                      <Star className={`w-5.5 h-5.5 ${
                        star <= userRating ? "text-amber-500 fill-current" : "text-slate-700 hover:text-slate-500"
                      }`} />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-amber-500">
                  {userRating} / 5 Yıldız
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 font-mono uppercase tracking-wide">
              Bu oyunu tavsiye ediyor musunuz?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecommend(true)}
                className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  recommend 
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30" 
                    : "bg-slate-950 text-slate-500 border-slate-900"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Tavsiye Ediyorum
              </button>

              <button
                type="button"
                onClick={() => setRecommend(false)}
                className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  !recommend 
                    ? "bg-red-950/40 text-red-400 border-red-500/30" 
                    : "bg-slate-950 text-slate-500 border-slate-900"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Tavsiye Etmiyorum
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-mono uppercase tracking-wide">
              Detaylı İnceleme Yorumunuz:
              </label>
            <textarea
              id="review_comment_area"
              rows={3}
              placeholder="Bu oyuna dair düşüncelerin, komik bir anın veya oynanış önerilerin..."
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500/80 resize-none font-sans"
            />
          </div>

          {/* Submit Action Block */}
          <div className="flex items-center justify-between gap-4 pt-1">
            {errorMsg && (
              <div className="text-red-400 font-semibold text-xs flex items-center gap-1 font-sans">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successAnimation && (
              <div className="text-green-400 font-bold text-xs flex items-center gap-1.5 font-sans">
                <Check className="w-4 h-4" />
                <span>İnceleme başarıyla listeye eklendi!</span>
              </div>
            )}

            <div className="ml-auto">
              <button
                id="submit_review_btn"
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-violet-600/10 border-0"
              >
                <Send className="w-3.5 h-3.5" />
                İncelemeyi Gönder
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
