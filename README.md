<div align="center">
  <img src="assets/images/icon.png" alt="Habits Logo" width="120" height="120" />
  <h1>Habits.</h1>
  <p><em>Oyunlaştırma odaklı, yeni nesil alışkanlık kazanma ve bağımlılık kırma deneyimi.</em></p>
  
  [![React Native](https://img.shields.io/badge/React_Native-0.83.6-20232A?style=for-the-badge&logo=react)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-55.0-000020?style=for-the-badge&logo=expo)](https://expo.dev/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
</div>

<br />

**Habits**, standart alışkanlık takip uygulamalarının sıkıcılığını kıran, RPG ögeleri ve zengin oyunlaştırma mekanikleriyle donatılmış açık kaynaklı bir mobil uygulamadır. Gündelik hedeflerinizi eğlenceli bir maceraya, kötü alışkanlıklarınızı ise yenmeniz gereken birer patron (boss) savaşına dönüştürür.

---

## 🌟 Öne Çıkan Özellikler

### 🛡️ Kapsamlı Alışkanlık Yönetimi
- **İki Yönlü Takip:** Yeni alışkanlıklar kazanırken (streak takibi) aynı zamanda kötü alışkanlıkları (bağımlılıkları) kırmak için geri sayım sayacı ve nüksetme (relapse) analizleri.
- **Detaylı Frekanslar:** Hedeflerinizi her gün, hafta içi, hafta sonu veya seçeceğiniz özel günlere göre ayarlayın.
- **Tasarruf Analizi:** Bağımlılıklarınızı bıraktığınızda ne kadar zaman ve para tasarruf ettiğinizi gerçek zamanlı görün.
- **Sürükle & Bırak:** Alışkanlıklarınızı kolayca sıralayın ve önceliklendirin.

### 🎮 Derinlemesine Oyunlaştırma
- **XP ve Seviye Sistemi:** Görevleri tamamladıkça tecrübe puanı kazanın ve maksimum 100 seviyeye kadar yükselin. Nüksetmelerde XP kaybederek disiplininizi koruyun.
- **Habitus Avatar & Mağaza:** Kazandığınız XP'lerle piksel sanat (pixel art) mağazasından avatarınız için gözlük, şapka, aksesuar gibi donanımlar satın alın ve karakterinizi kişiselleştirin.
- **Habitus Diyalogları:** Avatarınız başarılarınıza ve başarısızlıklarınıza göre sizinle konuşur, size anlık motive edici veya uyarıcı geri bildirimler verir.
- **Pomodoro Zamanlayıcı:** Entegre odaklanma sayacı sayesinde alışkanlıklarınızı yaparken dikkatinizi dağıtmadan çalışın.
- **Streak Freeze (Seri Kalkanı):** Ödüllü reklamları izleyerek kazanılan "Streak Freeze" ile kaçırdığınız günlerin serinizi bozmasını engelleyin.
- **Başarımlar ve Evrim:** 40'tan fazla açılabilir başarım (Easy, Hard, Legendary, Epic) ve seviyenize göre evrimleşen ana ekran çekirdeği (Soul Core).

### 🔔 Akıllı Bildirim Motoru
Rahatsız etmeyen ama unutmanıza da izin vermeyen akıllı bildirimler:
- **Zamanlı Hatırlatıcılar:** Sabah, öğle veya gece için farklı ses tonlarıyla döngüsel bildirimler.
- **Streak Guardian:** Sessiz saatlere 30 dakika kala risk altındaki serileriniz için son dakika uyarısı.
- **Haftalık Nabız:** Her Pazar sabahı geçen haftanın analizini sunan raporlar.
- **Kilometre Taşları:** Bağımlılıkları bırakma sürecinizdeki kritik günler için (1, 3, 7, 30, 90. gün) özel tebrikler.

### 📱 Teknik & Sistem Özellikleri
- **Android Ana Ekran Widget'ı:** Uygulamaya girmeden alışkanlık durumunuzu ve serilerinizi telefonunuzun ana ekranından canlı takip edin.
- **7 Farklı Dil Desteği:** Türkçe, İngilizce, İspanyolca, Almanca, Fransızca, Çince, İtalyanca.
- **Haptic Geri Bildirim:** Tıklama ve tamamlamalarda fiziksel titreşim hissiyatı.
- **Time Guard:** Telefonun saatini ileri/geri alarak hile yapmayı engelleyen zaman güvenlik kalkanı.
- **Karanlık & Açık Tema:** NativeWind ve Glassmorphism ile hazırlanan modern ve akıcı arayüz.
- **AdMob Entegrasyonu:** Banner, geçiş (interstitial), ödüllü (rewarded) ve native reklam alanları (Açık kaynak sürümde varsayılan olarak demo reklamlar çalışır).

---

## 🛠️ Kurulum ve Geliştirme

Projeyi kendi bilgisayarınızda çalıştırmak ve geliştirmek oldukça basittir.

### Ön Koşullar
- [Node.js](https://nodejs.org/) (Sürüm 18 veya üzeri önerilir)
- [Expo CLI](https://expo.dev/)
- [EAS CLI](https://expo.dev/eas) (Build almak için)

### Adımlar

1. **Depoyu Klonlayın ve Bağımlılıkları Yükleyin:**
```bash
git clone https://github.com/berkcngnc/habits.git
cd habits
npm install
```

2. **Ortam Değişkenlerini Ayarlayın:**
```bash
cp .env.example .env
```
*(Opsiyonel: Kendi AdMob reklamlarınızı kullanmak isterseniz, `.env` dosyasını açıp gerçek App ID ve Unit ID'lerinizi girebilirsiniz. Girmezseniz Google test reklamları gösterilir.)*

3. **Uygulamayı Başlatın:**
```bash
npx expo start
```
Terminalde çıkan QR kodu Expo Go uygulaması ile okutarak telefonunuzda test edebilir veya `a` tuşuna basarak Android emülatöründe çalıştırabilirsiniz.

---

## 📦 APK Üretme (Production Build)

Kendi Android cihazınıza kurmak üzere bir APK dosyası üretmek için EAS (Expo Application Services) kullanabilirsiniz:

```bash
eas login
eas build --platform android --profile preview
```
Bu komut, Play Store'a yüklenmek üzere tasarlanmış bir "AAB" yerine, doğrudan cihazınıza indirip kurabileceğiniz bir "APK" dosyası üretecektir.

---

## 🤝 Katkıda Bulunma
Bu proje açık kaynaktır! Yeni özellikler eklemek, hataları düzeltmek veya çevirileri geliştirmek isterseniz Pull Request (PR) gönderebilirsiniz. Büyük özellik değişiklikleri yapmadan önce lütfen bir Issue açarak konuyu tartışın.

- Yeni bir dil eklemek için `locales/index.ts` dosyasına göz atabilirsiniz.

---

## 📜 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına göz atabilirsiniz.
