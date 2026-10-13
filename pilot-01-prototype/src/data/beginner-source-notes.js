// Official OKX Referral Program FAQ, read 2026-10-14, sections 13 and 17.
// This is an OKX-specific rule, never a universal statement about all exchanges.
export const BEGINNER_SOURCE_NOTES = Object.freeze({
  source: 'https://www.okx.com/en-gb/help/okx-referral-program-faq',
  taxSource: 'https://www.irs.gov/filing/digital-assets',
  en: 'OKX says a referral relationship usually cannot be added or changed after registration. Check the code before completing signup; other exchanges have their own rules.',
  'zh-Hans': 'OKX 说明，注册完成后通常不能补填或更改推荐关系。提交注册前核对邀请码；其他平台应查看各自规则。',
  es: 'OKX indica que normalmente no se puede añadir ni cambiar la relación de referido después del registro. Comprueba el código antes de terminar; otras plataformas tienen sus propias reglas.',
  'pt-BR': 'A OKX informa que normalmente não é possível adicionar ou alterar o vínculo de indicação após o cadastro. Confira o código antes de concluir; outras plataformas têm regras próprias.',
  id: 'OKX menyatakan hubungan referral biasanya tidak dapat ditambahkan atau diubah setelah pendaftaran. Periksa kode sebelum selesai; exchange lain memiliki aturan sendiri.',
  tr: 'OKX, kayıt tamamlandıktan sonra referans ilişkisinin genellikle eklenemeyeceğini veya değiştirilemeyeceğini belirtir. Kodu kaydı bitirmeden kontrol edin; diğer borsaların kuralları farklıdır.',
  ko: 'OKX는 가입이 끝나면 추천 관계를 보통 추가하거나 변경할 수 없다고 설명합니다. 가입을 완료하기 전에 코드를 확인하고, 다른 거래소는 각각의 규칙을 확인하세요.',
  ja: 'OKXでは、登録完了後に紹介関係を追加・変更することは通常できないと説明しています。登録を完了する前にコードを確認し、他の取引所はそれぞれの規則を確認してください。',
  fr: 'OKX indique que le lien de parrainage ne peut généralement pas être ajouté ou modifié après l’inscription. Vérifie le code avant de terminer; les autres plateformes ont leurs propres règles.',
  de: 'Laut OKX lässt sich die Empfehlungszuordnung nach der Registrierung normalerweise nicht ergänzen oder ändern. Prüfe den Code vor dem Abschluss; andere Börsen haben eigene Regeln.',
  it: 'OKX spiega che il rapporto di invito normalmente non può essere aggiunto o modificato dopo la registrazione. Controlla il codice prima di completarla; le altre piattaforme hanno regole proprie.',
  ru: 'По правилам OKX реферальную связь обычно нельзя добавить или изменить после регистрации. Это правило относится к OKX; у других платформ действуют собственные условия.',
  ar: 'توضح OKX أنه لا يمكن عادة إضافة علاقة الإحالة أو تغييرها بعد إتمام التسجيل. هذه قاعدة خاصة بـ OKX، وللمنصات الأخرى قواعدها الخاصة.',
  'zh-Hant': 'OKX 說明，註冊完成後通常不能補填或更改推薦關係。這是 OKX 的規則，其他平台應查看各自條款。',
  ur: 'OKX کے مطابق رجسٹریشن مکمل ہونے کے بعد حوالہ تعلق عموماً شامل یا تبدیل نہیں کیا جا سکتا۔ یہ OKX کا اصول ہے؛ دوسرے پلیٹ فارم کے اپنے قواعد ہوتے ہیں۔',
  uk: 'За правилами OKX реферальний зв’язок зазвичай не можна додати або змінити після реєстрації. Це правило OKX; інші платформи мають власні умови.',
  vi: 'OKX cho biết quan hệ giới thiệu thường không thể thêm hoặc thay đổi sau khi đăng ký xong. Đây là quy tắc riêng của OKX; nền tảng khác có điều khoản riêng.',
});
export const isTaxQuestion = question => /tax|税|稅|impuest|impost|pajak|vergi|세금|impôt|steuer|tass|налог|ضريب|ضریب|ٹیکس|подат|thuế/i.test(question);
