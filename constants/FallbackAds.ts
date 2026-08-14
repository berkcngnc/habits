export type FallbackCategory = 'rating' | 'social' | 'motivation' | 'feedback';

export type ExerciseMode = 'breathe' | 'focus' | 'pep_talk' | 'affirm' | 'stretch' | 'gratitude';

export type FallbackAction =
  | 'rate'
  | 'share'
  | 'none'
  | 'feedback'
  | 'exercise';

export type FallbackAd = {
  id: string;
  category: FallbackCategory;
  title: string;
  subtitle: string;
  cta: string;
  icon: string; // FontAwesome name
  action: FallbackAction;
  /** when action === 'exercise', which mini-exercise to launch */
  exercise?: ExerciseMode;
};

export const FALLBACK_ADS: FallbackAd[] = [
  // ─── RATING (10) ───
  { id: 'r1', category: 'rating', title: 'Yolculuğunu seviyor musun?', subtitle: '5 yıldız bizi motive ediyor.', cta: 'Puan Ver', icon: 'star', action: 'rate' },
  { id: 'r2', category: 'rating', title: 'Habits sana yardım ettiyse', subtitle: 'Mağazada kısa bir yorum bırak.', cta: 'Yorum Yaz', icon: 'star-o', action: 'rate' },
  { id: 'r3', category: 'rating', title: 'Geliştirici sevgisi', subtitle: 'Tek tıkla bize destek ol.', cta: '⭐⭐⭐⭐⭐', icon: 'heart', action: 'rate' },
  { id: 'r4', category: 'rating', title: 'Reklamsız bir an', subtitle: 'Bu boşluğu puanınla doldur.', cta: 'Puan Ver', icon: 'star', action: 'rate' },
  { id: 'r5', category: 'rating', title: 'Sessiz kahramanlar', subtitle: 'Yorumlar bizi ayakta tutuyor.', cta: 'Mağazaya Git', icon: 'comment', action: 'rate' },
  { id: 'r6', category: 'rating', title: '30 saniye, koca etki', subtitle: 'Kısa bir puan algoritmayı değiştirir.', cta: 'Puan Ver', icon: 'thumbs-up', action: 'rate' },
  { id: 'r7', category: 'rating', title: 'Habits’i öneriyor musun?', subtitle: 'Mağazada söyle ✨', cta: 'Yorum Bırak', icon: 'star', action: 'rate' },
  { id: 'r8', category: 'rating', title: 'Premium hissi, ücretsiz', subtitle: 'Karşılığında sadece bir puan.', cta: 'Puan Ver', icon: 'gem', action: 'rate' },
  { id: 'r9', category: 'rating', title: 'Bağımsız geliştirici', subtitle: 'Senin yıldızın bütçemiz.', cta: '5 Yıldız', icon: 'star', action: 'rate' },
  { id: 'r10', category: 'rating', title: 'Habits topluluğuna katıl', subtitle: 'Mağazada izini bırak.', cta: 'Puan Ver', icon: 'users', action: 'rate' },

  // ─── SOCIAL (10) ───
  { id: 's1', category: 'social', title: 'Bir arkadaşına ilham ol', subtitle: 'Habits’i paylaş, birlikte değişin.', cta: 'Paylaş', icon: 'share', action: 'share' },
  { id: 's2', category: 'social', title: 'Kötü alışkanlık yalnız bırakılır', subtitle: 'Bir dostunu davet et.', cta: 'Davet Et', icon: 'user-plus', action: 'share' },
  { id: 's3', category: 'social', title: 'Birlikte daha güçlü', subtitle: 'Habits’i paylaş.', cta: 'Paylaş', icon: 'share-alt', action: 'share' },
  { id: 's4', category: 'social', title: 'Sevdiğine bir hediye', subtitle: 'Ona Habits’i öner.', cta: 'Paylaş', icon: 'gift', action: 'share' },
  { id: 's5', category: 'social', title: 'Zincir ne kadar uzun?', subtitle: 'Arkadaşlarınla yarış.', cta: 'Davet Et', icon: 'link', action: 'share' },
  { id: 's6', category: 'social', title: 'Habits ailesi büyüyor', subtitle: 'Sen de katkıda bulun.', cta: 'Paylaş', icon: 'users', action: 'share' },
  { id: 's7', category: 'social', title: 'Bir mesaj, bir hayat', subtitle: 'Habits linkini gönder.', cta: 'Paylaş', icon: 'paper-plane', action: 'share' },
  { id: 's8', category: 'social', title: 'Topluluğa hoş geldin', subtitle: 'Yeni birini davet et.', cta: 'Davet Et', icon: 'user-plus', action: 'share' },
  { id: 's9', category: 'social', title: 'Sosyal medya gücü', subtitle: 'Hikayene Habits’i ekle.', cta: 'Paylaş', icon: 'instagram', action: 'share' },
  { id: 's10', category: 'social', title: 'Habits’i hediye et', subtitle: 'Birinin hayatını değiştirebilir.', cta: 'Paylaş', icon: 'gift', action: 'share' },

  // ─── MOTIVATION (10) — interactive mini-exercises ───
  { id: 'm1', category: 'motivation', title: 'Bugün küçük bir adım', subtitle: 'Yarın büyük bir zafer.', cta: 'İlham Al', icon: 'fire', action: 'exercise', exercise: 'pep_talk' },
  { id: 'm2', category: 'motivation', title: 'Disiplin, motivasyondan güçlüdür', subtitle: 'Kendine güven.', cta: 'Hatırla', icon: 'bolt', action: 'exercise', exercise: 'affirm' },
  { id: 'm3', category: 'motivation', title: 'Geri dönüş yoluna kıymet ver', subtitle: 'Her seri yeni bir başlangıç.', cta: 'İlham Al', icon: 'rocket', action: 'exercise', exercise: 'pep_talk' },
  { id: 'm4', category: 'motivation', title: 'Sen çoktan değiştin', subtitle: 'Sadece henüz farkında değilsin.', cta: 'Hatırla', icon: 'star', action: 'exercise', exercise: 'affirm' },
  { id: 'm5', category: 'motivation', title: 'Bir gün daha, bir adım daha', subtitle: 'Sürekli ilerleme her şeydir.', cta: '1dk Odak', icon: 'flag', action: 'exercise', exercise: 'focus' },
  { id: 'm6', category: 'motivation', title: 'Şükret, hafifle', subtitle: 'Üç şeye minnettar ol.', cta: 'Başla', icon: 'leaf', action: 'exercise', exercise: 'gratitude' },
  { id: 'm7', category: 'motivation', title: 'Sessiz tutarlılık', subtitle: 'En yüksek sesli başarıdır.', cta: '1dk Odak', icon: 'volume-off', action: 'exercise', exercise: 'focus' },
  { id: 'm8', category: 'motivation', title: 'Hadi gerin', subtitle: '30 saniye bedenini uyandır.', cta: 'Başla', icon: 'heartbeat', action: 'exercise', exercise: 'stretch' },
  { id: 'm9', category: 'motivation', title: 'Bir dakika nefes', subtitle: 'Beyin sıfırlanır.', cta: 'Dene', icon: 'cloud', action: 'exercise', exercise: 'breathe' },
  { id: 'm10', category: 'motivation', title: 'En iyi versiyonun yolda', subtitle: 'Yavaşla ama durma.', cta: 'Hatırla', icon: 'rocket', action: 'exercise', exercise: 'affirm' },

  // ─── FEEDBACK (10) ───
  { id: 'f1', category: 'feedback', title: 'Bir özellik mi eksik?', subtitle: 'Bize yaz, hemen ekleyelim.', cta: 'Geri Bildirim', icon: 'envelope', action: 'feedback' },
  { id: 'f2', category: 'feedback', title: 'Hata mı buldun?', subtitle: 'Tek mail bizi kurtarır.', cta: 'Bildir', icon: 'bug', action: 'feedback' },
  { id: 'f3', category: 'feedback', title: 'Fikrin altın değerinde', subtitle: 'Önerini paylaş.', cta: 'Yaz', icon: 'lightbulb-o', action: 'feedback' },
  { id: 'f4', category: 'feedback', title: 'Birlikte geliştirelim', subtitle: 'Habits seninle büyür.', cta: 'Mesaj At', icon: 'comments', action: 'feedback' },
  { id: 'f5', category: 'feedback', title: 'Hangi dili istersin?', subtitle: 'Yeni diller için oy ver.', cta: 'Bildir', icon: 'globe', action: 'feedback' },
  { id: 'f6', category: 'feedback', title: 'Geliştiriciyle konuş', subtitle: 'Yanıt 24 saat içinde.', cta: 'İletişim', icon: 'envelope-o', action: 'feedback' },
  { id: 'f7', category: 'feedback', title: 'Ne ekleyelim?', subtitle: 'Yol haritasını sen belirle.', cta: 'Öneride Bulun', icon: 'map', action: 'feedback' },
  { id: 'f8', category: 'feedback', title: 'Bir cümle bile yeter', subtitle: 'Ne hissediyorsun?', cta: 'Yaz', icon: 'pencil', action: 'feedback' },
  { id: 'f9', category: 'feedback', title: 'Çeviri hatası mı?', subtitle: 'Bize bildir, düzeltelim.', cta: 'Bildir', icon: 'language', action: 'feedback' },
  { id: 'f10', category: 'feedback', title: 'Sesini duyur', subtitle: 'Geri bildirim = yön.', cta: 'Mesaj', icon: 'microphone', action: 'feedback' },
];

export function getRandomFallbackAd(exclude?: string): FallbackAd {
  const pool = exclude ? FALLBACK_ADS.filter(a => a.id !== exclude) : FALLBACK_ADS;
  return pool[Math.floor(Math.random() * pool.length)];
}
