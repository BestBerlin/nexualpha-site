// R212: localized NexuAlpha-owned research explanations.
// Official source titles, URLs, timestamps, IDs and campaign metadata stay in official-campaign-research.js.
// This file localizes only site-authored summaries, conditions, source notes and notices.

export const OFFICIAL_CAMPAIGN_LOCALIZED_LOCALES = Object.freeze(["en","zh-Hans","zh-Hant","ja","ko","tr","ar","es","pt-BR","fr","de","ru","id","vi","it","ur","uk"]);

export const officialCampaignResearchLocalizations = Object.freeze({
  "binance": {
    "summary": {
      "en": "The public Rewards Hub separates tasks, points and vouchers; a visible hub is not a personal reward offer.",
      "zh-Hans": "福利中心分列任务、积分与卡券；看到入口不代表账户已获得某项奖励。",
      "zh-Hant": "福利中心分列任務、積分與卡券；看到入口不代表帳戶已獲得某項獎勵。",
      "ja": "パブリック Rewards Hub は、タスク、ポイント、バウチャーを分離します。目に見えるハブは個人的な特典の提供ではありません。",
      "ko": "공개 보상 허브는 작업, 포인트 및 바우처를 분리합니다. 눈에 보이는 허브는 개인적인 보상 제안이 아닙니다.",
      "tr": "Herkese açık Ödül Merkezi görevleri, puanları ve kuponları ayırır; görünür bir merkez kişisel bir ödül teklifi değildir.",
      "ar": "يفصل مركز المكافآت العام بين المهام والنقاط والقسائم؛ المركز المرئي ليس عرضًا لمكافأة شخصية.",
      "es": "El Rewards Hub público separa tareas, puntos y vales; un centro visible no es una oferta de recompensa personal.",
      "pt-BR": "O Rewards Hub público separa tarefas, pontos e vouchers; um hub visível não é uma oferta de recompensa pessoal.",
      "fr": "Le Rewards Hub public sépare les tâches, les points et les bons ; un hub visible n'est pas une offre de récompense personnelle.",
      "de": "Der öffentliche Rewards Hub trennt Aufgaben, Punkte und Gutscheine; Ein sichtbarer Hub ist kein persönliches Prämienangebot.",
      "ru": "Публичный центр вознаграждений разделяет задачи, баллы и ваучеры; доступность хаба не является персональным предложением вознаграждения.",
      "id": "Rewards Hub publik memisahkan tugas, poin, dan voucher; hub yang terlihat bukanlah tawaran hadiah pribadi.",
      "vi": "Rewards Hub công khai phân tách rõ nhiệm vụ, điểm thưởng và voucher; việc nhìn thấy giao diện trung tâm không đồng nghĩa với một đề nghị tặng thưởng cá nhân.",
      "it": "Il Rewards Hub pubblico separa attività, punti e voucher; un hub visibile non è un'offerta di ricompensa personale.",
      // l10n: needs native review
      "ur": "عوامی Rewards Hub کاموں، پوائنٹ بیلنسز اور واؤچرز کو الگ کرتا ہے؛ نظر آنے والا مرکز ذاتی انعامی پیشکش نہیں۔",
      // l10n: needs native review
      "uk": "Публічний Rewards Hub розділяє завдання, бали і ваучери; видимий хаб не є персональною пропозицією винагороди."
    },
    "signupReward": {
      "summary": {
        "en": "No account-specific amount or qualifying task was exposed in this public view.",
        "zh-Hans": "本次公开页面没有显示账户专属金额或达标任务。",
        "zh-Hant": "本次公開頁面沒有顯示帳戶專屬金額或達標任務。",
        "ja": "この公開では、アカウント固有の金額や対象となるタスクは公開されませんでした。",
        "ko": "이 공개 보기에는 계정별 금액이나 적격 작업이 노출되지 않았습니다.",
        "tr": "Bu genel görünümde hesaba özel hiçbir miktar veya nitelikli görev gösterilmemiştir.",
        "ar": "لم يتم عرض أي مبلغ خاص بالحساب أو مهمة مؤهلة في طريقة العرض العامة هذه.",
        "es": "En esta vista pública no se expuso ningún monto específico de la cuenta ni tarea calificada.",
        "pt-BR": "Nenhum valor específico da conta ou tarefa de qualificação foi exposta nesta visualização pública.",
        "fr": "Aucun montant spécifique au compte ou tâche éligible n'a été exposé dans cette vue publique.",
        "de": "In dieser öffentlichen Ansicht wurde kein kontospezifischer Betrag oder keine qualifizierende Aufgabe offengelegt.",
        "ru": "Никакая сумма по конкретному счету или квалификационная задача не были представлены в этом публичном представлении.",
        "id": "Tidak ada jumlah khusus akun atau tugas yang memenuhi syarat yang terungkap dalam tampilan publik ini.",
        "vi": "Không có số tiền cụ thể của tài khoản hoặc nhiệm vụ đủ điều kiện nào được hiển thị ở chế độ xem công khai này.",
        "it": "Nessun importo specifico per l'account o attività qualificante è stato esposto in questa visualizzazione pubblica.",
        // l10n: needs native review
        "ur": "اس عوامی منظر میں کوئی اکاؤنٹ مخصوص رقم یا اہل کام ظاہر نہیں ہوا۔",
        // l10n: needs native review
        "uk": "У цьому публічному перегляді не показано жодної специфічної для акаунта суми або кваліфікованого завдання."
      },
      "conditions": [
        {
          "en": "Open the task assigned to the eligible account before acting.",
          "zh-Hans": "操作前查看合资格账户实际获得的任务。",
          "zh-Hant": "操作前查看合資格帳戶實際獲得的任務。",
          "ja": "行動する前に、対象となるアカウントに割り当てられたタスクを開きます。",
          "ko": "조치를 취하기 전에 적격 계정에 할당된 작업을 엽니다.",
          "tr": "Harekete geçmeden önce uygun hesaba atanan görevi açın.",
          "ar": "افتح المهمة المخصصة للحساب المؤهل قبل التصرف.",
          "es": "Abra la tarea asignada a la cuenta elegible antes de actuar.",
          "pt-BR": "Abra a tarefa atribuída à conta elegível antes de agir.",
          "fr": "Ouvrez la tâche assignée au compte éligible avant d'agir.",
          "de": "Öffnen Sie die dem berechtigten Konto zugewiesene Aufgabe, bevor Sie handeln.",
          "ru": "Прежде чем действовать, откройте задачу, назначенную подходящей учетной записи.",
          "id": "Buka tugas yang diberikan ke akun yang memenuhi syarat sebelum bertindak.",
          "vi": "Mở nhiệm vụ được giao cho tài khoản đủ điều kiện trước khi hành động.",
          "it": "Apri l'attività assegnata all'account idoneo prima di agire.",
          // l10n: needs native review
          "ur": "عمل کرنے سے پہلے اہل اکاؤنٹ کو تفویض شدہ کام کھولیں۔",
          // l10n: needs native review
          "uk": "Перед дією відкрийте призначене завдання для придатного акаунта."
        },
        {
          "en": "Read voucher use and expiry separately from points redemption.",
          "zh-Hans": "卡券用途与有效期、积分兑换条件需分别查看。",
          "zh-Hant": "卡券用途與有效期、積分兌換條件需分別查看。",
          "ja": "バウチャーの使用と有効期限については、ポイントの引き換えとは別にお読みください。",
          "ko": "바우처 사용 및 만료는 포인트 상환과 별도로 읽어보세요.",
          "tr": "Kupon kullanımını ve sona erme tarihini puan kullanımından ayrı olarak okuyun.",
          "ar": "اقرأ استخدام القسيمة وانتهاء صلاحيتها بشكل منفصل عن استبدال النقاط.",
          "es": "Lea el uso y vencimiento del cupón por separado del canje de puntos.",
          "pt-BR": "Leia o uso e o vencimento do voucher separadamente do resgate de pontos.",
          "fr": "Lisez l'utilisation et l'expiration du bon séparément de l'échange de points.",
          "de": "Lesen Sie die Nutzung und den Ablauf des Gutscheins getrennt von der Punkteeinlösung.",
          "ru": "Прочтите информацию об использовании и сроке действия ваучера отдельно от пункта об использовании баллов.",
          "id": "Baca penggunaan dan masa berlaku voucher secara terpisah dari penukaran poin.",
          "vi": "Xem kỹ điều kiện sử dụng cùng thời hạn của voucher riêng biệt với phần quy đổi điểm thưởng.",
          "it": "Leggi l'utilizzo e la scadenza del voucher separatamente dal riscatto dei punti.",
          // l10n: needs native review
          "ur": "واؤچر استعمال اور ختم ہونے کی تاریخ کو پوائنٹس ریڈمپشن سے الگ پڑھیں۔",
          // l10n: needs native review
          "uk": "Читайте використання ваучера і закінчення строку окремо від погашення балів."
        },
        {
          "en": "Region, KYC and funding thresholds remain unconfirmed in this view.",
          "zh-Hans": "此页面未确认地区、KYC 与入金门槛。",
          "zh-Hant": "此頁面未確認地區、KYC 與入金門檻。",
          "ja": "この表示では、地域、KYC、入金条件はまだ確認されていません。",
          "ko": "이 화면에서는 지역, KYC 및 입금 조건이 아직 확인되지 않았습니다.",
          "tr": "Bu görünümde bölge, KYC ve para yatırma eşikleri hâlâ doğrulanmamıştır.",
          "ar": "لا تزال المنطقة ومتطلبات KYC وحدود الإيداع غير مؤكدة في هذه الصفحة.",
          "es": "En esta vista siguen sin confirmarse la región, el KYC y los umbrales de depósito.",
          "pt-BR": "Nesta visualização, região, KYC e limites de depósito ainda não foram confirmados.",
          "fr": "Dans cette vue, la région, le KYC et les seuils de dépôt restent non confirmés.",
          "de": "In dieser Ansicht bleiben Region, KYC und Einzahlungsschwellen unbestätigt.",
          "ru": "В этом представлении регион, KYC и пороги пополнения остаются неподтвержденными.",
          "id": "Dalam tampilan ini, wilayah, KYC, dan ambang setoran masih belum dikonfirmasi.",
          "vi": "Trong chế độ xem này, khu vực, KYC và ngưỡng nạp tiền vẫn chưa được xác nhận.",
          "it": "In questa vista, area geografica, KYC e soglie di deposito restano non confermati.",
          // l10n: needs native review
          "ur": "علاقہ، KYC اور فنڈنگ حدیں اس منظر میں غیر تصدیق شدہ رہتے ہیں۔",
          // l10n: needs native review
          "uk": "Регіон, KYC і пороги фінансування у цьому перегляді залишаються непідтвердженими."
        }
      ]
    },
    "sources": {
      "binance-rewards": {
        "summary": {
          "en": "Public task, points and voucher navigation was readable; personal terms were not.",
          "zh-Hans": "已读到任务、积分和卡券导航，未读到账户专属条款。",
          "zh-Hant": "已讀到任務、積分和卡券導覽，未讀到帳戶專屬條款。",
          "ja": "公開タスク、ポイント、バウチャーのナビゲーションは判読可能でした。個人的な条件はそうではありませんでした。",
          "ko": "공개 작업, 포인트 및 바우처 탐색을 읽을 수 있었습니다. 개인적인 조건은 그렇지 않았습니다.",
          "tr": "Genel görev, puanlar ve kupon navigasyonu okunabilir nitelikteydi; kişisel şartlar değildi.",
          "ar": "كانت المهمة العامة والنقاط وقسيمة التنقل قابلة للقراءة؛ لم تكن الشروط الشخصية.",
          "es": "La navegación por tareas públicas, puntos y vales era legible; Los términos personales no lo eran.",
          "pt-BR": "A navegação de tarefas públicas, pontos e vouchers era legível; termos pessoais não.",
          "fr": "La navigation dans les tâches publiques, les points et les bons était lisible ; les conditions personnelles ne l’étaient pas.",
          "de": "Öffentliche Aufgaben-, Punkte- und Gutscheinnavigation war lesbar; Persönliche Begriffe waren es nicht.",
          "ru": "Навигация по общедоступным заданиям, баллам и ваучерам была читабельной; личных условий не было.",
          "id": "Navigasi tugas publik, poin dan voucher dapat dibaca; istilah pribadi tidak.",
          "vi": "Đã xem được điều hướng nhiệm vụ công khai, điểm thưởng và voucher; các điều khoản cá nhân không được hiển thị.",
          "it": "La navigazione delle attività pubbliche, dei punti e dei voucher era leggibile; i termini personali non lo erano.",
          // l10n: needs native review
          "ur": "عوامی کاموں، پوائنٹ بیلنسز اور واؤچر نیویگیشن قابل مطالعہ تھی؛ ذاتی شرائط نہیں تھیں۔",
          // l10n: needs native review
          "uk": "Публічні завдання, бали і навігація ваучерів були читабельні; персональні умови — ні."
        }
      },
      "binance-monitoring-september": {
        "summary": {
          "en": "The 4 September notice adds AVA, GNS, SCR and TOWNS to Monitoring Tags, identifying possible delisting risk. The UK page warns that some named tokens may not be available there; this is a monitoring notice, not a new listing or reward.",
          "zh-Hans": "9 月 4 日公告将 AVA、GNS、SCR、TOWNS 纳入监控标签，提示潜在下架风险。英国页面说明部分代币在当地可能不可用；这是监控通知，不是上币或奖励。",
          "zh-Hant": "9 月 4 日公告將 AVA、GNS、SCR、TOWNS 納入監控標籤，提示潛在下架風險。英國頁面說明部分代幣在當地可能不可用；這是監控通知，不是上幣或獎勵。",
          "ja": "9 月 4 日の通知では、AVA、GNS、SCR、および TOWNS がモニタリングタグに追加され、上場廃止リスクの可能性が特定されています。英国のページでは、一部の名前付きトークンが英国では利用できない可能性があると警告しています。これはモニタリング通知であり、新しいリストや報酬ではありません。",
          "ko": "9월 4일 공지에서는 AVA, GNS, SCR 및 TOWNS를 모니터링 태그에 추가하여 상장 폐지 위험을 식별합니다. 영국 페이지에서는 일부 명명된 토큰을 사용하지 못할 수도 있다고 경고합니다. 이는 신규 상장이나 보상이 아닌 모니터링 공지입니다.",
          "tr": "4 Eylül bildirimi, olası liste dışı bırakma riskini belirleyerek AVA, GNS, SCR ve TOWNS'ı İzleme Etiketlerine ekliyor. Birleşik Krallık sayfası, bazı adlandırılmış tokenların orada bulunmayabileceği konusunda uyarıyor; bu bir izleme bildirimidir, yeni bir listeleme veya ödül değildir.",
          "ar": "يضيف إشعار 4 سبتمبر AVA وGNS وSCR وTOWNS إلى علامات المراقبة، مما يحدد مخاطر الحذف المحتملة. تحذر صفحة المملكة المتحدة من أن بعض الرموز المميزة قد لا تكون متاحة هناك؛ هذا إشعار مراقبة، وليس قائمة جديدة أو مكافأة.",
          "es": "El aviso del 4 de septiembre agrega AVA, GNS, SCR y TOWNS a las etiquetas de monitoreo, identificando un posible riesgo de exclusión de la lista. La página del Reino Unido advierte que es posible que algunos tokens con nombre no estén disponibles allí; Este es un aviso de seguimiento, no un nuevo listado o recompensa.",
          "pt-BR": "O aviso de 4 de setembro adiciona AVA, GNS, SCR e TOWNS às tags de monitoramento, identificando possível risco de fechamento de capital. A página do Reino Unido alerta que alguns tokens nomeados podem não estar disponíveis lá; este é um aviso de monitoramento, não uma nova listagem ou recompensa.",
          "fr": "L'avis du 4 septembre ajoute AVA, GNS, SCR et TOWNS aux balises de surveillance, identifiant ainsi un risque possible de radiation. La page britannique prévient que certains jetons nommés pourraient ne pas y être disponibles ; il s'agit d'un avis de surveillance, pas d'une nouvelle annonce ou d'une récompense.",
          "de": "In der Bekanntmachung vom 4. September werden AVA, GNS, SCR und TOWNS zu den Monitoring-Tags hinzugefügt, um ein mögliches Delisting-Risiko zu identifizieren. Die britische Seite warnt davor, dass einige benannte Token dort möglicherweise nicht verfügbar sind; Dies ist eine Überwachungsmitteilung, keine neue Auflistung oder Belohnung.",
          "ru": "В уведомлении от 4 сентября к тегам мониторинга добавлены AVA, GNS, SCR и TOWNS, что указывает на возможный риск исключения из списка. Страница Великобритании предупреждает, что некоторые именованные токены могут быть там недоступны; это уведомление о мониторинге, а не новое объявление или вознаграждение.",
          "id": "Pemberitahuan tanggal 4 September menambahkan AVA, GNS, SCR, dan TOWNS ke Tag Pemantauan, yang mengidentifikasi kemungkinan risiko penghapusan pencatatan. Halaman Inggris memperingatkan bahwa beberapa token bernama mungkin tidak tersedia di sana; ini adalah pemberitahuan pemantauan, bukan daftar atau hadiah baru.",
          "vi": "Thông báo ngày 4 tháng 9 bổ sung AVA, GNS, SCR và TOWNS vào Thẻ giám sát, xác định rủi ro có thể xảy ra khi hủy niêm yết. Trang ở Vương quốc Anh cảnh báo rằng một số mã thông báo được đặt tên có thể không có sẵn ở đó; đây là thông báo giám sát, không phải danh sách hoặc phần thưởng mới.",
          "it": "L'avviso del 4 settembre aggiunge AVA, GNS, SCR e TOWNS ai Monitoring Tag, individuando possibili rischi di delisting. La pagina del Regno Unito avverte che alcuni token nominati potrebbero non essere disponibili lì; si tratta di un avviso di monitoraggio, non di una nuova inserzione o di un premio.",
          // l10n: needs native review
          "ur": "4 ستمبر کا نوٹس AVA، GNS، SCR اور TOWNS کو نگرانی کے ٹیگز میں شامل کرتا ہے، جو ممکنہ ڈی لسٹنگ خطرہ دکھاتا ہے۔ UK صفحہ خبردار کرتا ہے کہ کچھ نامزد ٹوکن وہاں دستیاب نہیں ہو سکتے؛ یہ نگرانی کا نوٹس ہے، نئی لسٹنگ یا انعام نہیں۔",
          // l10n: needs native review
          "uk": "Повідомлення від 4 вересня додає AVA, GNS, SCR і TOWNS до тегів моніторингу, позначаючи можливий ризик делістингу. Сторінка UK попереджає, що деякі названі токени можуть бути там недоступні; це повідомлення про моніторинг, а не новий лістинг чи винагорода."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "Open the task assigned to the eligible account before acting.",
        "zh-Hans": "操作前查看合资格账户实际获得的任务。",
        "zh-Hant": "操作前查看合資格帳戶實際獲得的任務。",
        "ja": "行動する前に、対象となるアカウントに割り当てられたタスクを開きます。",
        "ko": "조치를 취하기 전에 적격 계정에 할당된 작업을 엽니다.",
        "tr": "Harekete geçmeden önce uygun hesaba atanan görevi açın.",
        "ar": "افتح المهمة المخصصة للحساب المؤهل قبل التصرف.",
        "es": "Abra la tarea asignada a la cuenta elegible antes de actuar.",
        "pt-BR": "Abra a tarefa atribuída à conta elegível antes de agir.",
        "fr": "Ouvrez la tâche assignée au compte éligible avant d'agir.",
        "de": "Öffnen Sie die dem berechtigten Konto zugewiesene Aufgabe, bevor Sie handeln.",
        "ru": "Прежде чем действовать, откройте задачу, назначенную подходящей учетной записи.",
        "id": "Buka tugas yang diberikan ke akun yang memenuhi syarat sebelum bertindak.",
        "vi": "Mở nhiệm vụ được giao cho tài khoản đủ điều kiện trước khi hành động.",
        "it": "Apri l'attività assegnata all'account idoneo prima di agire.",
        // l10n: needs native review
        "ur": "عمل کرنے سے پہلے اہل اکاؤنٹ کو تفویض شدہ کام کھولیں۔",
        // l10n: needs native review
        "uk": "Відкрийте завдання, призначені для відповідного акаунта, перед дією."
      },
      "rewardType": {
        "en": "Account-assigned tasks, points and vouchers",
        "zh-Hans": "账户分配的任务、积分与卡券",
        "zh-Hant": "帳戶分配的任務、積分與卡券",
        "ja": "アカウントに割り当てられたタスク、ポイント、バウチャー",
        "ko": "계정에 할당된 작업, 포인트 및 바우처",
        "tr": "Hesap tarafından atanan görevler, puanlar ve kuponlar",
        "ar": "المهام والنقاط والقسائم المخصصة للحساب",
        "es": "Tareas, puntos y vales asignados a la cuenta",
        "pt-BR": "Tarefas, pontos e vouchers atribuídos à conta",
        "fr": "Tâches, points et bons attribués au compte",
        "de": "Kontobezogene Aufgaben, Punkte und Gutscheine",
        "ru": "Задания, баллы и ваучеры, назначенные учетной записи",
        "id": "Tugas, poin, dan voucher yang diberikan akun",
        "vi": "Nhiệm vụ, điểm thưởng và voucher được chỉ định cho tài khoản",
        "it": "Attività, punti e voucher assegnati all'account",
        // l10n: needs native review
        "ur": "اکاؤنٹ کے لیے تفویض کردہ ٹاسکس، پوائنٹس اور واؤچرز",
        // l10n: needs native review
        "uk": "Завдання, бали та ваучери, призначені для акаунта"
      },
      "limitations": {
        "en": "Read voucher use and expiry separately from points redemption.",
        "zh-Hans": "卡券用途与有效期、积分兑换条件需分别查看。",
        "zh-Hant": "卡券用途與有效期、積分兌換條件需分別查看。",
        "ja": "バウチャーの使用と有効期限については、ポイントの引き換えとは別にお読みください。",
        "ko": "바우처 사용 및 만료는 포인트 상환과 별도로 읽어보세요.",
        "tr": "Kupon kullanımını ve sona erme tarihini puan kullanımından ayrı olarak okuyun.",
        "ar": "اقرأ استخدام القسيمة وانتهاء صلاحيتها بشكل منفصل عن استبدال النقاط.",
        "es": "Lea el uso y vencimiento del cupón por separado del canje de puntos.",
        "pt-BR": "Leia o uso e o vencimento do voucher separadamente do resgate de pontos.",
        "fr": "Lisez l'utilisation et l'expiration du bon séparément de l'échange de points.",
        "de": "Lesen Sie die Nutzung und den Ablauf des Gutscheins getrennt von der Punkteeinlösung.",
        "ru": "Прочтите информацию об использовании и сроке действия ваучера отдельно от пункта об использовании баллов.",
        "id": "Baca penggunaan dan masa berlaku voucher secara terpisah dari penukaran poin.",
        "vi": "Xem kỹ điều kiện sử dụng cùng thời hạn của voucher riêng biệt với phần quy đổi điểm thưởng.",
        "it": "Leggi l'utilizzo e la scadenza del voucher separatamente dal riscatto dei punti.",
        // l10n: needs native review
        "ur": "واؤچر استعمال اور اختتام کو پوائنٹس کے استعمال سے الگ پڑھیں۔",
        // l10n: needs native review
        "uk": "Читайте умови використання та термін дії ваучера окремо від використання балів."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ماخذ قابل اطلاق شناختی تصدیق کا تقاضا قائم نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; порожнє значення не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "No account-specific amount or qualifying task was exposed in this public view.",
          "zh-Hans": "本次公开页面没有显示账户专属金额或达标任务。",
          "zh-Hant": "本次公開頁面沒有顯示帳戶專屬金額或達標任務。",
          "ja": "この公開では、アカウント固有の金額や対象となるタスクは公開されませんでした。",
          "ko": "이 공개 보기에는 계정별 금액이나 적격 작업이 노출되지 않았습니다.",
          "tr": "Bu genel görünümde hesaba özel hiçbir miktar veya nitelikli görev gösterilmemiştir.",
          "ar": "لم يتم عرض أي مبلغ خاص بالحساب أو مهمة مؤهلة في طريقة العرض العامة هذه.",
          "es": "En esta vista pública no se expuso ningún monto específico de la cuenta ni tarea calificada.",
          "pt-BR": "Nenhum valor específico da conta ou tarefa de qualificação foi exposta nesta visualização pública.",
          "fr": "Aucun montant spécifique au compte ou tâche éligible n'a été exposé dans cette vue publique.",
          "de": "In dieser öffentlichen Ansicht wurde kein kontospezifischer Betrag oder keine qualifizierende Aufgabe offengelegt.",
          "ru": "Никакая сумма по конкретному счету или квалификационная задача не были представлены в этом публичном представлении.",
          "id": "Tidak ada jumlah khusus akun atau tugas yang memenuhi syarat yang terungkap dalam tampilan publik ini.",
          "vi": "Không có số tiền cụ thể của tài khoản hoặc nhiệm vụ đủ điều kiện nào được hiển thị ở chế độ xem công khai này.",
          "it": "Nessun importo specifico per l'account o attività qualificante è stato esposto in questa visualizzazione pubblica.",
          // l10n: needs native review
          "ur": "اس عوامی منظر میں کوئی اکاؤنٹ مخصوص رقم یا اہل کام ظاہر نہیں ہوا۔",
          // l10n: needs native review
          "uk": "У цьому публічному перегляді не показано жодної специфічної для акаунта суми або кваліфікованого завдання."
        }
      ]
    }
  },
  "coinbase": {
    "summary": {
      "en": "New-customer promotions and referral rewards are different entry paths; some cannot be combined.",
      "zh-Hans": "新客促销与邀请奖励属于不同参与路径，部分优惠不能叠加。",
      "zh-Hant": "新客促銷與邀請獎勵屬於不同參與路徑，部分優惠不能疊加。",
      "ja": "新規顧客プロモーションと紹介報酬は異なる参入経路です。いくつかは組み合わせることはできません。",
      "ko": "신규 고객 프로모션과 추천 보상은 진입 경로가 다릅니다. 일부는 결합할 수 없습니다.",
      "tr": "Yeni müşteri promosyonları ve tavsiye ödülleri farklı giriş yollarıdır; bazıları birleştirilemez.",
      "ar": "تعد العروض الترويجية للعملاء الجدد ومكافآت الإحالة بمثابة مسارات دخول مختلفة؛ لا يمكن الجمع بين بعضها.",
      "es": "Las promociones para nuevos clientes y las recompensas por referencias son diferentes vías de entrada; algunos no se pueden combinar.",
      "pt-BR": "Promoções para novos clientes e recompensas por indicação são caminhos de entrada diferentes; alguns não podem ser combinados.",
      "fr": "Les promotions pour les nouveaux clients et les récompenses de parrainage sont des voies d'entrée différentes ; certains ne peuvent pas être combinés.",
      "de": "Neukundenaktionen und Empfehlungsprämien sind unterschiedliche Einstiegswege; einige sind nicht kombinierbar.",
      "ru": "Акции для новых клиентов и вознаграждения за рефералов — это разные пути входа; некоторые невозможно объединить.",
      "id": "Promosi pelanggan baru dan hadiah rujukan merupakan jalur masuk yang berbeda; beberapa tidak dapat digabungkan.",
      "vi": "Khuyến mãi dành cho khách hàng mới và phần thưởng giới thiệu là những con đường gia nhập khác nhau; một số không thể kết hợp được.",
      "it": "Le promozioni per i nuovi clienti e i premi per i referral sono percorsi di ingresso diversi; alcuni non possono essere combinati.",
      // l10n: needs native review
      "ur": "نئے صارف پروموشنز اور ریفرل انعامات مختلف داخلہ راستے ہیں؛ کچھ کو یکجا نہیں کیا جا سکتا۔",
      // l10n: needs native review
      "uk": "Промоакції для нових клієнтів і реферальні винагороди — це різні шляхи реєстрації; деякі з них не можна поєднувати."
    },
    "signupReward": {
      "summary": {
        "en": "The official page describes country- and offer-specific rewards, including random prizes. No universal amount is established.",
        "zh-Hans": "官方条款按国家和优惠区分奖励，包含随机奖项，不能概括为人人可领的统一金额。",
        "zh-Hant": "官方條款按國家和優惠區分獎勵，包含隨機獎項，不能概括為人人可領的統一金額。",
        "ja": "公式ページでは、ランダムな賞品を含む、国およびオファー固有の報酬について説明しています。普遍的な金額は確立されていません。",
        "ko": "공식 페이지에는 무작위 상품을 포함한 국가별 및 제안별 보상이 설명되어 있습니다. 보편적인 금액은 설정되어 있지 않습니다.",
        "tr": "Resmi sayfada rastgele ödüller de dahil olmak üzere ülkeye ve teklife özel ödüller açıklanmaktadır. Evrensel bir miktar belirlenmemiştir.",
        "ar": "تصف الصفحة الرسمية المكافآت الخاصة بكل بلد والعروض، بما في ذلك الجوائز العشوائية. لم يتم تحديد مبلغ عالمي.",
        "es": "La página oficial describe recompensas específicas por país y oferta, incluidos premios aleatorios. No se establece ninguna cantidad universal.",
        "pt-BR": "A página oficial descreve recompensas específicas de cada país e de ofertas, incluindo prêmios aleatórios. Não está estabelecido nenhum montante universal.",
        "fr": "La page officielle décrit les récompenses spécifiques au pays et à l'offre, y compris les prix aléatoires. Aucun montant universel n’est établi.",
        "de": "Auf der offiziellen Seite werden länder- und angebotsspezifische Belohnungen beschrieben, darunter auch Zufallspreise. Es wird kein allgemeingültiger Betrag festgelegt.",
        "ru": "На официальной странице описаны награды для конкретных стран и предложений, включая случайные призы. Универсальная сумма не установлена.",
        "id": "Halaman resmi menjelaskan hadiah khusus negara dan penawaran, termasuk hadiah acak. Tidak ada jumlah universal yang ditetapkan.",
        "vi": "Trang chính thức mô tả các phần thưởng theo quốc gia và ưu đãi cụ thể, bao gồm các giải thưởng ngẫu nhiên. Không có số tiền phổ quát được thiết lập.",
        "it": "La pagina ufficiale descrive i premi specifici per paese e offerta, inclusi premi casuali. Non è stabilito alcun importo universale.",
        // l10n: needs native review
        "ur": "سرکاری صفحہ ملک اور پیشکش کے لحاظ سے انعامات بیان کرتا ہے، جن میں بے ترتیب انعامات بھی شامل ہیں۔ کوئی مشترک رقم ثابت نہیں۔",
        // l10n: needs native review
        "uk": "Офіційна сторінка описує винагороди для окремих країн і конкретних пропозицій, зокрема випадкові призи. Жодної універсальної суми не встановлено."
      },
      "conditions": [
        {
          "en": "For the referral path, apply the link or code while creating the new account.",
          "zh-Hans": "选择邀请路径时，需在创建新账户时使用链接或代码。",
          "zh-Hant": "選擇邀請路徑時，需在建立新帳戶時使用連結或代碼。",
          "ja": "紹介パスについては、新しいアカウントの作成時にリンクまたはコードを適用します。",
          "ko": "추천 경로의 경우 새 계정을 만들 때 링크나 코드를 적용하세요.",
          "tr": "Yönlendirme yolu için, yeni hesabı oluştururken bağlantıyı veya kodu uygulayın.",
          "ar": "بالنسبة لمسار الإحالة، قم بتطبيق الرابط أو الكود أثناء إنشاء الحساب الجديد.",
          "es": "Para la ruta de referencia, aplique el enlace o código al crear la nueva cuenta.",
          "pt-BR": "Para o caminho de referência, aplique o link ou código ao criar a nova conta.",
          "fr": "Pour le chemin de référence, appliquez le lien ou le code lors de la création du nouveau compte.",
          "de": "Wenden Sie für den Empfehlungspfad den Link oder Code an, während Sie das neue Konto erstellen.",
          "ru": "Для реферального пути примените ссылку или код при создании новой учетной записи.",
          "id": "Untuk jalur referral, terapkan link atau kode saat membuat akun baru.",
          "vi": "Đối với đường dẫn giới thiệu, hãy áp dụng liên kết hoặc mã trong khi tạo tài khoản mới.",
          "it": "Per il percorso di riferimento, applica il collegamento o il codice durante la creazione del nuovo account.",
          // l10n: needs native review
          "ur": "ریفرل راستہ کے لیے نیا اکاؤنٹ بناتے وقت لنک یا کوڈ لاگو کریں۔",
          // l10n: needs native review
          "uk": "Для реферального шляху застосуйте посилання або код під час створення нового акаунта."
        },
        {
          "en": "Referral purchases use eligible retail payment methods; Advanced and Prime trades are excluded.",
          "zh-Hans": "邀请奖励需通过合资格零售支付方式购买；Advanced 与 Prime 交易不计入。",
          "zh-Hant": "邀請獎勵需透過合資格零售支付方式購買；Advanced 與 Prime 交易不計入。",
          "ja": "紹介購入では、対象となる小売支払い方法を使用します。アドバンスト取引とプライム取引は除外されます。",
          "ko": "추천 구매는 적격 소매 결제 방법을 사용합니다. 고급 및 프라임 거래는 제외됩니다.",
          "tr": "Tavsiye satın alımlarında uygun perakende ödeme yöntemleri kullanılır; Gelişmiş ve Prime işlemler hariçtir.",
          "ar": "تستخدم مشتريات الإحالة طرق الدفع بالتجزئة المؤهلة؛ يتم استبعاد الصفقات المتقدمة والرئيسية.",
          "es": "Las compras por referencia utilizan métodos de pago minoristas elegibles; Se excluyen las operaciones avanzadas y Prime.",
          "pt-BR": "As compras por indicação usam métodos de pagamento de varejo qualificados; As negociações Advanced e Prime estão excluídas.",
          "fr": "Les achats de parrainage utilisent des méthodes de paiement au détail éligibles ; Les transactions avancées et Prime sont exclues.",
          "de": "Für Empfehlungskäufe werden zulässige Einzelhandelszahlungsmethoden verwendet. Advanced- und Prime-Trades sind ausgeschlossen.",
          "ru": "При реферальных покупках используются подходящие способы розничной оплаты; Сделки Advanced и Prime исключены.",
          "id": "Pembelian rujukan menggunakan metode pembayaran ritel yang memenuhi syarat; Perdagangan tingkat lanjut dan Perdana tidak termasuk.",
          "vi": "Mua hàng giới thiệu sử dụng các phương thức thanh toán bán lẻ đủ điều kiện; Các giao dịch nâng cao và Prime bị loại trừ.",
          "it": "Gli acquisti tramite referral utilizzano metodi di pagamento al dettaglio idonei; Sono escluse le operazioni Advanced e Prime.",
          // l10n: needs native review
          "ur": "ریفرل خریداریوں کے لیے اہل ریٹیل ادائیگی طریقے استعمال ہوتے ہیں؛ Advanced اور Prime ٹریڈز خارج ہیں۔",
          // l10n: needs native review
          "uk": "Реферальні купівлі мають використовувати придатні роздрібні способи оплати; угоди Advanced і Prime виключені."
        },
        {
          "en": "Check country, purchase deadline and non-stacking terms. Referral participants are excluded from specified new-user spin promotions.",
          "zh-Hans": "核对国家、购买期限及互斥条款；邀请活动参与者不适用于条款列出的新客转盘优惠。",
          "zh-Hant": "核對國家、購買期限及互斥條款；邀請活動參與者不適用於條款列出的新客轉盤優惠。",
          "ja": "国、購入期限、非スタッキング条件を確認してください。紹介参加者は、指定された新規ユーザースピンプロモーションから除外されます。",
          "ko": "국가, 구매 기한, 비적재 조건을 확인하세요. 추천 참가자는 지정된 신규 사용자 스핀 프로모션에서 제외됩니다.",
          "tr": "Ülkeyi, satın alma son tarihini ve istiflenmeyen koşulları kontrol edin. Yönlendirme katılımcıları, belirtilen yeni kullanıcı spin promosyonlarının dışında tutulur.",
          "ar": "تحقق من البلد والموعد النهائي للشراء وشروط عدم التراص. يتم استبعاد المشاركين في الإحالة من العروض الترويجية المحددة للمستخدم الجديد.",
          "es": "Consulta país, fecha límite de compra y condiciones no acumulables. Los participantes recomendados están excluidos de promociones de giros específicas para nuevos usuarios.",
          "pt-BR": "Verifique país, prazo de compra e condições não empilháveis. Os participantes indicados são excluídos de promoções específicas de spin para novos usuários.",
          "fr": "Vérifiez le pays, la date limite d'achat et les conditions de non-cumul. Les participants parrainés sont exclus des promotions spécifiques pour les nouveaux utilisateurs.",
          "de": "Überprüfen Sie das Land, die Kauffrist und die nicht stapelbaren Bedingungen. Empfehlungsteilnehmer sind von bestimmten Spin-Aktionen für neue Benutzer ausgeschlossen.",
          "ru": "Проверьте страну, срок покупки и условия отсутствия суммирования. Реферальные участники исключаются из определенных рекламных акций для новых пользователей.",
          "id": "Periksa negara, batas waktu pembelian, dan persyaratan non-tumpukan. Peserta rujukan dikecualikan dari promosi putaran pengguna baru yang ditentukan.",
          "vi": "Kiểm tra quốc gia, thời hạn mua hàng và các điều khoản không xếp chồng. Những người tham gia giới thiệu sẽ bị loại khỏi các chương trình khuyến mãi vòng quay dành cho người dùng mới được chỉ định.",
          "it": "Controlla il paese, la scadenza per l'acquisto e i termini non cumulabili. I partecipanti referral sono esclusi dalle promozioni di spin per nuovi utenti specificate.",
          // l10n: needs native review
          "ur": "ملک، خریداری کی آخری تاریخ اور ایک ساتھ نہ لگنے والی شرائط چیک کریں۔ ریفرل شرکا مخصوص نئے صارف کی اسپن پروموشنز سے خارج ہیں۔",
          // l10n: needs native review
          "uk": "Перевірте країну, кінцевий строк купівлі і умови несумісності з іншими акціями. Учасники реферальної програми виключені з указаних спін-акцій для нових користувачів."
        }
      ]
    },
    "sources": {
      "coinbase-new-customer": {
        "summary": {
          "en": "One help page covers several distinct offers; advertised random maximums are not guaranteed payouts.",
          "zh-Hans": "同一帮助页涵盖多种独立优惠，随机奖项的最高额不等于保证到账额。",
          "zh-Hant": "同一說明頁涵蓋多種獨立優惠，隨機獎項的最高額不等於保證到帳額。",
          "ja": "1 つのヘルプ ページには、いくつかの異なるオファーが記載されています。公表されているランダムな最大値は支払いを保証するものではありません。",
          "ko": "하나의 도움말 페이지에서는 여러 가지 고유한 제안을 다룹니다. 광고된 무작위 최대 금액은 지불금을 보장하지 않습니다.",
          "tr": "Bir yardım sayfası birçok farklı teklifi kapsar; reklamı yapılan rastgele maksimumlar, ödeme garantisi vermez.",
          "ar": "تغطي صفحة المساعدة الواحدة العديد من العروض المتميزة؛ الحدود القصوى العشوائية المعلن عنها ليست مضمونة للدفعات.",
          "es": "Una página de ayuda cubre varias ofertas distintas; Los máximos aleatorios anunciados no son pagos garantizados.",
          "pt-BR": "Uma página de ajuda cobre diversas ofertas distintas; os máximos aleatórios anunciados não são pagamentos garantidos.",
          "fr": "Une page d'aide couvre plusieurs offres distinctes ; les maximums aléatoires annoncés ne constituent pas des paiements garantis.",
          "de": "Eine Hilfeseite deckt mehrere unterschiedliche Angebote ab; Bei den angegebenen zufälligen Höchstbeträgen handelt es sich nicht um garantierte Auszahlungen.",
          "ru": "Одна страница справки охватывает несколько различных предложений; объявленные случайные максимумы не являются гарантированными выплатами.",
          "id": "Satu halaman bantuan mencakup beberapa penawaran berbeda; maksimum acak yang diiklankan bukanlah jaminan pembayaran.",
          "vi": "Một trang trợ giúp bao gồm một số ưu đãi riêng biệt; mức tối đa ngẫu nhiên được quảng cáo không phải là khoản thanh toán được đảm bảo.",
          "it": "Una pagina di aiuto copre diverse offerte distinte; i massimi casuali pubblicizzati non sono pagamenti garantiti.",
          // l10n: needs native review
          "ur": "ایک ہیلپ پیج کئی الگ پیشکشوں کا احاطہ کرتا ہے؛ مشتہر بے ترتیب زیادہ سے زیادہ رقوم ضمانت شدہ ادائیگیاں نہیں۔",
          // l10n: needs native review
          "uk": "Одна довідкова сторінка охоплює кілька окремих пропозицій; рекламовані випадкові максимуми не є гарантованими виплатами."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "For the referral path, apply the link or code while creating the new account.",
        "zh-Hans": "选择邀请路径时，需在创建新账户时使用链接或代码。",
        "zh-Hant": "選擇邀請路徑時，需在建立新帳戶時使用連結或代碼。",
        "ja": "紹介パスについては、新しいアカウントの作成時にリンクまたはコードを適用します。",
        "ko": "추천 경로의 경우 새 계정을 만들 때 링크나 코드를 적용하세요.",
        "tr": "Yönlendirme yolu için, yeni hesabı oluştururken bağlantıyı veya kodu uygulayın.",
        "ar": "بالنسبة لمسار الإحالة، قم بتطبيق الرابط أو الكود أثناء إنشاء الحساب الجديد.",
        "es": "Para la ruta de referencia, aplique el enlace o código al crear la nueva cuenta.",
        "pt-BR": "Para o caminho de referência, aplique o link ou código ao criar a nova conta.",
        "fr": "Pour le chemin de référence, appliquez le lien ou le code lors de la création du nouveau compte.",
        "de": "Wenden Sie für den Empfehlungspfad den Link oder Code an, während Sie das neue Konto erstellen.",
        "ru": "Для реферального пути примените ссылку или код при создании новой учетной записи.",
        "id": "Untuk jalur referral, terapkan link atau kode saat membuat akun baru.",
        "vi": "Đối với đường dẫn giới thiệu, hãy áp dụng liên kết hoặc mã trong khi tạo tài khoản mới.",
        "it": "Per il percorso di riferimento, applica il collegamento o il codice durante la creazione del nuovo account.",
        // l10n: needs native review
        "ur": "ریفرل راستہ کے لیے نیا اکاؤنٹ بناتے وقت لنک یا کوڈ لاگو کریں۔",
        // l10n: needs native review
        "uk": "Для реферального маршруту застосуйте посилання або код під час створення нового акаунта."
      },
      "deposit": {
        "en": "Referral purchases use eligible retail payment methods; Advanced and Prime trades are excluded.",
        "zh-Hans": "邀请奖励需通过合资格零售支付方式购买；Advanced 与 Prime 交易不计入。",
        "zh-Hant": "邀請獎勵需透過合資格零售支付方式購買；Advanced 與 Prime 交易不計入。",
        "ja": "紹介購入では、対象となる小売支払い方法を使用します。アドバンスト取引とプライム取引は除外されます。",
        "ko": "추천 구매는 적격 소매 결제 방법을 사용합니다. 고급 및 프라임 거래는 제외됩니다.",
        "tr": "Tavsiye satın alımlarında uygun perakende ödeme yöntemleri kullanılır; Gelişmiş ve Prime işlemler hariçtir.",
        "ar": "تستخدم مشتريات الإحالة طرق الدفع بالتجزئة المؤهلة؛ يتم استبعاد الصفقات المتقدمة والرئيسية.",
        "es": "Las compras por referencia utilizan métodos de pago minoristas elegibles; Se excluyen las operaciones avanzadas y Prime.",
        "pt-BR": "As compras por indicação usam métodos de pagamento de varejo qualificados; As negociações Advanced e Prime estão excluídas.",
        "fr": "Les achats de parrainage utilisent des méthodes de paiement au détail éligibles ; Les transactions avancées et Prime sont exclues.",
        "de": "Für Empfehlungskäufe werden zulässige Einzelhandelszahlungsmethoden verwendet. Advanced- und Prime-Trades sind ausgeschlossen.",
        "ru": "При реферальных покупках используются подходящие способы розничной оплаты; Сделки Advanced и Prime исключены.",
        "id": "Pembelian rujukan menggunakan metode pembayaran ritel yang memenuhi syarat; Perdagangan tingkat lanjut dan Perdana tidak termasuk.",
        "vi": "Mua hàng giới thiệu sử dụng các phương thức thanh toán bán lẻ đủ điều kiện; Các giao dịch nâng cao và Prime bị loại trừ.",
        "it": "Gli acquisti tramite referral utilizzano metodi di pagamento al dettaglio idonei; Sono escluse le operazioni Advanced e Prime.",
        // l10n: needs native review
        "ur": "ریفرل خریداریوں کے لیے اہل ریٹیل ادائیگی طریقے استعمال ہوتے ہیں؛ Advanced اور Prime ٹریڈز خارج ہیں۔",
        // l10n: needs native review
        "uk": "Реферальні купівлі мають використовувати придатні роздрібні способи оплати; угоди Advanced і Prime виключені."
      },
      "trading": {
        "en": "Referral purchases use eligible retail payment methods; Advanced and Prime trades are excluded.",
        "zh-Hans": "邀请奖励需通过合资格零售支付方式购买；Advanced 与 Prime 交易不计入。",
        "zh-Hant": "邀請獎勵需透過合資格零售支付方式購買；Advanced 與 Prime 交易不計入。",
        "ja": "紹介購入では、対象となる小売支払い方法を使用します。アドバンスト取引とプライム取引は除外されます。",
        "ko": "추천 구매는 적격 소매 결제 방법을 사용합니다. 고급 및 프라임 거래는 제외됩니다.",
        "tr": "Tavsiye satın alımlarında uygun perakende ödeme yöntemleri kullanılır; Gelişmiş ve Prime işlemler hariçtir.",
        "ar": "تستخدم مشتريات الإحالة طرق الدفع بالتجزئة المؤهلة؛ يتم استبعاد الصفقات المتقدمة والرئيسية.",
        "es": "Las compras por referencia utilizan métodos de pago minoristas elegibles; Se excluyen las operaciones avanzadas y Prime.",
        "pt-BR": "As compras por indicação usam métodos de pagamento de varejo qualificados; As negociações Advanced e Prime estão excluídas.",
        "fr": "Les achats de parrainage utilisent des méthodes de paiement au détail éligibles ; Les transactions avancées et Prime sont exclues.",
        "de": "Für Empfehlungskäufe werden zulässige Einzelhandelszahlungsmethoden verwendet. Advanced- und Prime-Trades sind ausgeschlossen.",
        "ru": "При реферальных покупках используются подходящие способы розничной оплаты; Сделки Advanced и Prime исключены.",
        "id": "Pembelian rujukan menggunakan metode pembayaran ritel yang memenuhi syarat; Perdagangan tingkat lanjut dan Perdana tidak termasuk.",
        "vi": "Mua hàng giới thiệu sử dụng các phương thức thanh toán bán lẻ đủ điều kiện; Các giao dịch nâng cao và Prime bị loại trừ.",
        "it": "Gli acquisti tramite referral utilizzano metodi di pagamento al dettaglio idonei; Sono escluse le operazioni Advanced e Prime.",
        // l10n: needs native review
        "ur": "ریفرل خریداریوں کے لیے اہل ریٹیل ادائیگی طریقے استعمال ہوتے ہیں؛ Advanced اور Prime ٹریڈز خارج ہیں۔",
        // l10n: needs native review
        "uk": "Реферальні купівлі мають використовувати придатні роздрібні способи оплати; угоди Advanced і Prime виключені."
      },
      "rewardType": {
        "en": "Offer-specific crypto or random prize",
        "zh-Hans": "依优惠条款发放的加密资产或随机奖",
        "zh-Hant": "依優惠條款發放的加密資產或隨機獎",
        "ja": "オファー固有の暗号通貨またはランダムな賞品",
        "ko": "특정 암호화폐 또는 무작위 경품 제공",
        "tr": "Teklife özel kripto veya rastgele ödül",
        "ar": "عرض خاص بالعملات المشفرة أو جائزة عشوائية",
        "es": "Criptomoneda específica de la oferta o premio aleatorio",
        "pt-BR": "Criptografia específica da oferta ou prêmio aleatório",
        "fr": "Crypto spécifique à l'offre ou prix aléatoire",
        "de": "Angebotsspezifische Krypto oder Zufallspreis",
        "ru": "Специальная криптовалюта или случайный приз",
        "id": "Kripto khusus penawaran atau hadiah acak",
        "vi": "Tiền điện tử dành riêng cho ưu đãi hoặc giải thưởng ngẫu nhiên",
        "it": "Criptovaluta specifica dell'offerta o premio casuale",
        // l10n: needs native review
        "ur": "پیشکش-مخصوص کرپٹو یا بے ترتیب انعام۔",
        // l10n: needs native review
        "uk": "Крипто за конкретною пропозицією або випадковий приз."
      },
      "limitations": {
        "en": "Check country, purchase deadline and non-stacking terms. Referral participants are excluded from specified new-user spin promotions.",
        "zh-Hans": "核对国家、购买期限及互斥条款；邀请活动参与者不适用于条款列出的新客转盘优惠。",
        "zh-Hant": "核對國家、購買期限及互斥條款；邀請活動參與者不適用於條款列出的新客轉盤優惠。",
        "ja": "国、購入期限、非スタッキング条件を確認してください。紹介参加者は、指定された新規ユーザースピンプロモーションから除外されます。",
        "ko": "국가, 구매 기한, 비적재 조건을 확인하세요. 추천 참가자는 지정된 신규 사용자 스핀 프로모션에서 제외됩니다.",
        "tr": "Ülkeyi, satın alma son tarihini ve istiflenmeyen koşulları kontrol edin. Yönlendirme katılımcıları, belirtilen yeni kullanıcı spin promosyonlarının dışında tutulur.",
        "ar": "تحقق من البلد والموعد النهائي للشراء وشروط عدم التراص. يتم استبعاد المشاركين في الإحالة من العروض الترويجية المحددة للمستخدم الجديد.",
        "es": "Consulta país, fecha límite de compra y condiciones no acumulables. Los participantes recomendados están excluidos de promociones de giros específicas para nuevos usuarios.",
        "pt-BR": "Verifique país, prazo de compra e condições não empilháveis. Os participantes indicados são excluídos de promoções específicas de spin para novos usuários.",
        "fr": "Vérifiez le pays, la date limite d'achat et les conditions de non-cumul. Les participants parrainés sont exclus des promotions spécifiques pour les nouveaux utilisateurs.",
        "de": "Überprüfen Sie das Land, die Kauffrist und die nicht stapelbaren Bedingungen. Empfehlungsteilnehmer sind von bestimmten Spin-Aktionen für neue Benutzer ausgeschlossen.",
        "ru": "Проверьте страну, срок покупки и условия отсутствия суммирования. Реферальные участники исключаются из определенных рекламных акций для новых пользователей.",
        "id": "Periksa negara, batas waktu pembelian, dan persyaratan non-tumpukan. Peserta rujukan dikecualikan dari promosi putaran pengguna baru yang ditentukan.",
        "vi": "Kiểm tra quốc gia, thời hạn mua hàng và các điều khoản không xếp chồng. Những người tham gia giới thiệu sẽ bị loại khỏi các chương trình khuyến mãi vòng quay dành cho người dùng mới được chỉ định.",
        "it": "Controlla il paese, la scadenza per l'acquisto e i termini non cumulabili. I partecipanti referral sono esclusi dalle promozioni di spin per nuovi utenti specificate.",
        // l10n: needs native review
        "ur": "ملک، خریداری کی آخری تاریخ اور اکٹھا نہ ہونے والی شرائط چیک کریں۔ ریفرل شرکا مخصوص نئے صارف اسپن پروموشنز سے خارج ہیں۔",
        // l10n: needs native review
        "uk": "Перевірте країну, дедлайн покупки й умови несумісні з іншими. Учасники реферальної програми виключені з окремих обертань промоакцій для нових користувачів."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ذریعہ لاگو شناختی تصدیق کی شرط ثابت نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; null не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مہم کی کوئی قطعی مدت تصدیق شدہ نہیں ہے؛ صرف پڑھنے کے قابل صفحہ پیشکش فعال ہونے کو ثابت نہیں کر سکتا۔",
          // l10n: needs native review
          "uk": "Повне абсолютне вікно кампанії не підтверджено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The official page describes country- and offer-specific rewards, including random prizes. No universal amount is established.",
          "zh-Hans": "官方条款按国家和优惠区分奖励，包含随机奖项，不能概括为人人可领的统一金额。",
          "zh-Hant": "官方條款按國家和優惠區分獎勵，包含隨機獎項，不能概括為人人可領的統一金額。",
          "ja": "公式ページでは、ランダムな賞品を含む、国およびオファー固有の報酬について説明しています。普遍的な金額は確立されていません。",
          "ko": "공식 페이지에는 무작위 상품을 포함한 국가별 및 제안별 보상이 설명되어 있습니다. 보편적인 금액은 설정되어 있지 않습니다.",
          "tr": "Resmi sayfada rastgele ödüller de dahil olmak üzere ülkeye ve teklife özel ödüller açıklanmaktadır. Evrensel bir miktar belirlenmemiştir.",
          "ar": "تصف الصفحة الرسمية المكافآت الخاصة بكل بلد والعروض، بما في ذلك الجوائز العشوائية. لم يتم تحديد مبلغ عالمي.",
          "es": "La página oficial describe recompensas específicas por país y oferta, incluidos premios aleatorios. No se establece ninguna cantidad universal.",
          "pt-BR": "A página oficial descreve recompensas específicas de cada país e de ofertas, incluindo prêmios aleatórios. Não está estabelecido nenhum montante universal.",
          "fr": "La page officielle décrit les récompenses spécifiques au pays et à l'offre, y compris les prix aléatoires. Aucun montant universel n’est établi.",
          "de": "Auf der offiziellen Seite werden länder- und angebotsspezifische Belohnungen beschrieben, darunter auch Zufallspreise. Es wird kein allgemeingültiger Betrag festgelegt.",
          "ru": "На официальной странице описаны награды для конкретных стран и предложений, включая случайные призы. Универсальная сумма не установлена.",
          "id": "Halaman resmi menjelaskan hadiah khusus negara dan penawaran, termasuk hadiah acak. Tidak ada jumlah universal yang ditetapkan.",
          "vi": "Trang chính thức mô tả các phần thưởng theo quốc gia và ưu đãi cụ thể, bao gồm các giải thưởng ngẫu nhiên. Không có số tiền phổ quát được thiết lập.",
          "it": "La pagina ufficiale descrive i premi specifici per paese e offerta, inclusi premi casuali. Non è stabilito alcun importo universale.",
          // l10n: needs native review
          "ur": "سرکاری صفحہ ملک اور پیشکش-مخصوص انعامات بیان کرتا ہے، جن میں بےترتیب انعامات بھی شامل ہیں۔ کوئی یکساں رقم طے نہیں۔",
          // l10n: needs native review
          "uk": "Офіційна сторінка описує винагороди для окремих країн і конкретних пропозицій, включно з випадковими призами. Універсальної суми не встановлено."
        }
      ]
    }
  },
  "bybit": {
    "summary": {
      "en": "Bybit distinguishes bonuses, Fee Savers, airdrops and trial funds; these do not share the same withdrawal rules.",
      "zh-Hans": "Bybit 将赠金、手续费抵扣、空投与体验金分开管理，提现规则并不相同。",
      "zh-Hant": "Bybit 將贈金、手續費抵扣、空投與體驗金分開管理，提領規則並不相同。",
      "ja": "Bybit はボーナス、手数料セーバー、エアドロップ、トライアルファンドを区別しています。これらは同じ出金ルールを共有しません。",
      "ko": "Bybit는 보너스, 수수료 절약, 에어드롭 및 시험 자금을 구분합니다. 이들은 동일한 철수 규칙을 공유하지 않습니다.",
      "tr": "Bybit, bonusları, Ücret Tasarruflarını, airdropları ve deneme fonlarını birbirinden ayırır; bunlar aynı para çekme kurallarını paylaşmaz.",
      "ar": "تميز Bybit بين المكافآت وموفرات الرسوم والإسقاط الجوي والأموال التجريبية؛ هذه لا تشترك في نفس قواعد السحب.",
      "es": "Bybit distingue bonificaciones, ahorros de tarifas, lanzamientos aéreos y fondos de prueba; estos no comparten las mismas reglas de retiro.",
      "pt-BR": "Bybit distingue bônus, poupadores de taxas, airdrops e fundos de teste; estes não compartilham as mesmas regras de retirada.",
      "fr": "Bybit distingue les bonus, les Fee Savers, les parachutages et les fonds d'essai ; ceux-ci ne partagent pas les mêmes règles de retrait.",
      "de": "Bybit unterscheidet Boni, Gebührenersparnisse, Airdrops und Testgelder; Für diese gelten nicht die gleichen Auszahlungsregeln.",
      "ru": "Bybit различает бонусы, Fee Savers, airdrop и пробные фонды; у них разные правила вывода средств.",
      "id": "Bybit membedakan bonus, Penghemat Biaya, airdrop, dan dana percobaan; ini tidak memiliki aturan penarikan yang sama.",
      "vi": "Bybit phân biệt tiền thưởng, Tiết kiệm phí, airdrop và quỹ dùng thử; những điều này không có chung quy tắc rút tiền.",
      "it": "Bybit distingue bonus, Fee Savers, airdrop e fondi di prova; questi non condividono le stesse regole di prelievo.",
      // l10n: needs native review
      "ur": "Bybit بونسز، فیس سیورز، ایئرڈراپس اور آزمائشی فنڈز میں فرق کرتا ہے؛ ان کے نکاسی قواعد ایک جیسے نہیں۔",
      // l10n: needs native review
      "uk": "Bybit розрізняє бонуси, купони на знижку комісій (Fee Savers), ейрдропи та пробні кошти; для них діють різні правила виведення."
    },
    "signupReward": {
      "summary": {
        "en": "The Rewards Hub FAQ confirms that bonuses and Fee Savers are not withdrawable and unused rewards can expire.",
        "zh-Hans": "福利中心 FAQ 明确：赠金和手续费抵扣不能直接提现，未使用奖励可能到期失效。",
        "zh-Hant": "福利中心 FAQ 明確：贈金和手續費抵扣不能直接提領，未使用獎勵可能到期失效。",
        "ja": "Rewards Hub FAQ では、ボーナスと手数料セーバーは出金できず、未使用の特典は期限切れになる可能性があることを確認しています。",
        "ko": "보상 허브 FAQ에서는 보너스와 수수료 절약 혜택은 철회할 수 없으며 사용하지 않은 보상은 만료될 수 있음을 확인합니다.",
        "tr": "Ödül Merkezi SSS, bonusların ve Ücret Tasarruflarının çekilemeyeceğini ve kullanılmayan ödüllerin süresinin dolabileceğini doğrulamaktadır.",
        "ar": "تؤكد الأسئلة الشائعة لـ Rewards Hub أن المكافآت ورسوم توفير الرسوم غير قابلة للسحب وأن المكافآت غير المستخدمة يمكن أن تنتهي صلاحيتها.",
        "es": "Las preguntas frecuentes de Rewards Hub confirman que los bonos y los ahorros de tarifas no se pueden retirar y que las recompensas no utilizadas pueden caducar.",
        "pt-BR": "As perguntas frequentes do Rewards Hub confirmam que os bônus e os poupadores de taxas não podem ser retirados e as recompensas não utilizadas podem expirar.",
        "fr": "La FAQ du Rewards Hub confirme que les bonus et les réductions de frais ne sont pas retirables et que les récompenses inutilisées peuvent expirer.",
        "de": "In den häufig gestellten Fragen zum Rewards Hub wird bestätigt, dass Boni und Gebührenersparnisse nicht auszahlbar sind und ungenutzte Prämien verfallen können.",
        "ru": "Часто задаваемые вопросы о Rewards Hub подтверждают, что бонусы и бонусы Fee Saver нельзя вывести, а срок действия неиспользованных вознаграждений может истечь.",
        "id": "FAQ Rewards Hub mengonfirmasi bahwa bonus dan Penghemat Biaya tidak dapat ditarik dan hadiah yang tidak digunakan dapat kedaluwarsa.",
        "vi": "Câu hỏi thường gặp về Trung tâm Phần thưởng xác nhận rằng tiền thưởng và Tiết kiệm phí không thể rút được và phần thưởng chưa sử dụng có thể hết hạn.",
        "it": "Le domande frequenti sul Rewards Hub confermano che i bonus e i Fee Saver non sono ritirabili e che i premi non utilizzati possono scadere.",
        // l10n: needs native review
        "ur": "Rewards Hub FAQ تصدیق کرتا ہے کہ بونسز اور Fee Savers نکلوائی کے قابل نہیں، اور غیر استعمال شدہ انعامات ختم ہو سکتے ہیں۔",
        // l10n: needs native review
        "uk": "Rewards Hub FAQ підтверджує, що бонуси і Fee Savers не є доступними для виведення, а невикористані винагороди можуть закінчуватися."
      },
      "conditions": [
        {
          "en": "Complete the required identity verification before claiming.",
          "zh-Hans": "领取前完成所需身份验证。",
          "zh-Hant": "領取前完成所需身分驗證。",
          "ja": "請求する前に、必要な本人確認を完了してください。",
          "ko": "청구하기 전에 필수 신원 확인을 완료하세요.",
          "tr": "Hak talebinde bulunmadan önce gerekli kimlik doğrulamasını tamamlayın.",
          "ar": "أكمل التحقق من الهوية المطلوبة قبل المطالبة.",
          "es": "Complete la verificación de identidad requerida antes de realizar el reclamo.",
          "pt-BR": "Conclua a verificação de identidade necessária antes de reivindicar.",
          "fr": "Effectuez la vérification d’identité requise avant de réclamer.",
          "de": "Führen Sie die erforderliche Identitätsüberprüfung durch, bevor Sie einen Anspruch geltend machen.",
          "ru": "Прежде чем подавать заявку, пройдите необходимую проверку личности.",
          "id": "Selesaikan verifikasi identitas yang diperlukan sebelum mengklaim.",
          "vi": "Hoàn thành xác minh danh tính cần thiết trước khi yêu cầu.",
          "it": "Completa la verifica dell'identità richiesta prima di effettuare la richiesta.",
          // l10n: needs native review
          "ur": "کلیم کرنے سے پہلے لازمی شناختی تصدیق مکمل کریں۔",
          // l10n: needs native review
          "uk": "Завершіть обов’язкову перевірку особи перед отриманням винагороди."
        },
        {
          "en": "Complete and claim each task before its own deadline.",
          "zh-Hans": "按各任务的独立期限完成并领取。",
          "zh-Hant": "按各任務的獨立期限完成並領取。",
          "ja": "各タスクをそれぞれの期限までに完了して申請してください。",
          "ko": "마감일 이전에 각 작업을 완료하고 청구하세요.",
          "tr": "Her görevi kendi son teslim tarihinden önce tamamlayın ve talep edin.",
          "ar": "أكمل كل مهمة وطالب بها قبل الموعد النهائي الخاص بها.",
          "es": "Complete y reclame cada tarea antes de su fecha límite.",
          "pt-BR": "Conclua e reivindique cada tarefa antes do prazo.",
          "fr": "Terminez et réclamez chaque tâche avant sa propre date limite.",
          "de": "Erledigen und beanspruchen Sie jede Aufgabe vor Ablauf ihrer Frist.",
          "ru": "Выполняйте каждое задание и забирайте награду до истечения установленного срока.",
          "id": "Selesaikan dan klaim setiap tugas sebelum tenggat waktunya.",
          "vi": "Hoàn thành và yêu cầu mỗi nhiệm vụ trước thời hạn riêng của nó.",
          "it": "Completa e richiedi ogni attività prima della scadenza.",
          // l10n: needs native review
          "ur": "ہر کام کو اس کی اپنی آخری تاریخ سے پہلے مکمل اور کلیم کریں۔",
          // l10n: needs native review
          "uk": "Завершіть і отримайте кожне завдання до його власного кінцевого строку."
        },
        {
          "en": "Confirm the reward type and permitted use; do not treat bonus face value as cash.",
          "zh-Hans": "核对奖励类型和适用范围，不把赠金面值当作现金。",
          "zh-Hant": "核對獎勵類型和適用範圍，不把贈金面值當作現金。",
          "ja": "特典の種類と許可された使用を確認します。ボーナス額面を現金として扱わないでください。",
          "ko": "보상 유형과 허용되는 사용을 확인하세요. 보너스 액면가를 현금으로 취급하지 마십시오.",
          "tr": "Ödül türünü ve izin verilen kullanımı onaylayın; Bonus nominal değerini nakit olarak değerlendirmeyin.",
          "ar": "تأكيد نوع المكافأة والاستخدام المسموح به؛ لا تعامل القيمة الاسمية للمكافأة على أنها نقدية.",
          "es": "Confirmar el tipo de recompensa y el uso permitido; No trate el valor nominal del bono como efectivo.",
          "pt-BR": "Confirme o tipo de recompensa e uso permitido; não trate o valor nominal do bônus como dinheiro.",
          "fr": "Confirmez le type de récompense et l'utilisation autorisée ; ne considérez pas la valeur nominale du bonus comme de l’argent liquide.",
          "de": "Bestätigen Sie die Art der Belohnung und die zulässige Nutzung; Behandeln Sie den Nennwert des Bonus nicht als Bargeld.",
          "ru": "Подтвердите тип вознаграждения и разрешенное использование; не рассматривайте номинальную стоимость бонуса как денежные средства.",
          "id": "Konfirmasikan jenis hadiah dan penggunaan yang diizinkan; jangan memperlakukan nilai nominal bonus sebagai uang tunai.",
          "vi": "Xác nhận loại phần thưởng và mục đích sử dụng được phép; không coi mệnh giá tiền thưởng là tiền mặt.",
          "it": "Confermare la tipologia del premio e l'uso consentito; non trattare il valore nominale del bonus come denaro contante.",
          // l10n: needs native review
          "ur": "انعام کی قسم اور اجازت شدہ استعمال تصدیق کریں؛ بونس کی ظاہری مالیت کو نقد نہ سمجھیں۔",
          // l10n: needs native review
          "uk": "Підтвердьте тип винагороди і дозволене використання; не трактуйте номінал бонусу як гроші."
        }
      ]
    },
    "sources": {
      "bybit-rewards-faq": {
        "summary": {
          "en": "Help-page update shown: 25 November 2025; the page does not establish a current account-specific amount.",
          "zh-Hans": "帮助页显示更新于 2025 年 11 月 25 日；该页面未确认当前适用于该账户的具体金额。",
          "zh-Hant": "說明頁顯示更新於 2025 年 11 月 25 日；該頁面未確認目前適用於該帳戶的具體金額。",
          "ja": "ヘルプページの更新日は 2025 年 11 月 25 日と表示されています。このページは、現在のアカウントに適用される具体的な金額を確定していません。",
          "ko": "도움말 페이지 업데이트 날짜는 2025년 11월 25일로 표시됩니다. 이 페이지는 현재 해당 계정에 적용되는 구체적인 금액을 확정하지 않습니다.",
          "tr": "Yardım sayfasında güncelleme tarihi 25 Kasım 2025 olarak görünüyor; sayfa, mevcut hesaba uygulanacak belirli bir tutarı kanıtlamaz.",
          "ar": "تظهر صفحة المساعدة تحديثًا بتاريخ 25 نوفمبر 2025؛ ولا تثبت الصفحة مبلغًا محددًا ينطبق على الحساب الحالي.",
          "es": "La página de ayuda muestra una actualización del 25 de noviembre de 2025; la página no establece un importe específico aplicable a la cuenta actual.",
          "pt-BR": "A página de ajuda mostra atualização em 25 de novembro de 2025; a página não estabelece um valor específico aplicável à conta atual.",
          "fr": "La page d'aide affiche une mise à jour du 25 novembre 2025 ; elle n'établit pas de montant spécifique applicable au compte actuel.",
          "de": "Die Hilfeseite zeigt eine Aktualisierung vom 25. November 2025; sie belegt keinen aktuell für dieses Konto geltenden Betrag.",
          "ru": "На странице справки указано обновление от 25 ноября 2025 года; страница не устанавливает конкретную сумму, применимую к текущему аккаунту.",
          "id": "Halaman bantuan menunjukkan pembaruan 25 November 2025; halaman tersebut tidak menetapkan jumlah khusus yang berlaku untuk akun saat ini.",
          "vi": "Trang trợ giúp hiển thị bản cập nhật ngày 25 tháng 11 năm 2025; trang này không xác lập số tiền cụ thể áp dụng cho tài khoản hiện tại.",
          "it": "La pagina di assistenza mostra l'aggiornamento del 25 novembre 2025; la pagina non stabilisce un importo specifico applicabile all'account attuale.",
          // l10n: needs native review
          "ur": "مدد صفحہ اپ ڈیٹ دکھائی گئی: 25 نومبر 2025؛ صفحہ موجودہ اکاؤنٹ مخصوص رقم قائم نہیں کرتا۔",
          // l10n: needs native review
          "uk": "Показано оновлення довідкової сторінки: 25 листопада 2025 року; сторінка не встановлює поточну суму, специфічну для акаунта."
        }
      },
      "bybit-cpusdt-september": {
        "summary": {
          "en": "The 4 September notice describes CPUSDT perpetuals in the Innovation Zone, settled in USDT with four-hour funding. Innovation Zone fees are higher; listing parameters can change. It does not establish spot availability or personal eligibility.",
          "zh-Hans": "9 月 4 日公告描述创新区 CPUSDT 永续合约，以 USDT 结算、每四小时结算资金费。创新区交易费更高，上市参数可能调整；不证明现货交易可用或个人参与资格。",
          "zh-Hant": "9 月 4 日公告描述創新區 CPUSDT 永續合約，以 USDT 結算、每四小時結算資金費。創新區交易費更高，上市參數可能調整；不證明現貨交易可用或個人參與資格。",
          "ja": "9 月 4 日の告知は、イノベーションゾーンの CPUSDT 無期限契約を説明し、USDT 決済で 4 時間ごとに資金調達料が発生することを示しています。イノベーションゾーンの手数料は高く、上場パラメータは変更される場合があります。現物取引の提供状況や個人の利用資格を証明するものではありません。",
          "ko": "9월 4일 공지는 혁신 구역의 CPUSDT 무기한 계약을 설명하며, USDT로 결제되고 4시간마다 펀딩비가 정산된다고 밝힙니다. 혁신 구역 수수료는 더 높고 상장 매개변수는 변경될 수 있습니다. 이는 현물 거래 지원 여부나 개인 자격을 입증하지 않습니다.",
          "tr": "4 Eylül duyurusu, İnovasyon Bölgesi'ndeki CPUSDT sürekli vadeli sözleşmelerini açıklar; USDT ile uzlaşır ve dört saatte bir fonlama ücreti işler. İnovasyon Bölgesi ücretleri daha yüksektir; listeleme parametreleri değişebilir. Spot işlem erişimini veya kişisel uygunluğu kanıtlamaz.",
          "ar": "يصف إشعار 4 سبتمبر عقود CPUSDT الدائمة في منطقة الابتكار، مع التسوية بعملة USDT واحتساب رسوم التمويل كل أربع ساعات. رسوم منطقة الابتكار أعلى وقد تتغير معلمات الإدراج. لا يثبت ذلك توفر التداول الفوري أو الأهلية الشخصية.",
          "es": "El aviso del 4 de septiembre describe los contratos perpetuos CPUSDT en la Zona de Innovación, liquidados en USDT y con comisión de financiación cada cuatro horas. Las tarifas de la Zona de Innovación son más altas; los parámetros de listado pueden cambiar. No establece disponibilidad de spot ni elegibilidad personal.",
          "pt-BR": "O aviso de 4 de setembro descreve os contratos perpétuos CPUSDT na Zona de Inovação, liquidados em USDT e com taxa de funding a cada quatro horas. As taxas da Zona de Inovação são mais altas; os parâmetros de listagem podem mudar. Não comprova disponibilidade no mercado à vista nem elegibilidade pessoal.",
          "fr": "L'avis du 4 septembre décrit les contrats perpétuels CPUSDT dans la zone d'innovation, réglés en USDT avec frais de financement toutes les quatre heures. Les frais de la zone d'innovation sont plus élevés ; les paramètres de cotation peuvent changer. Il n'établit pas la disponibilité au comptant ni l'éligibilité personnelle.",
          "de": "Die Mitteilung vom 4. September beschreibt CPUSDT-Perpetual-Kontrakte in der Innovation Zone, abgerechnet in USDT mit Funding-Gebühren alle vier Stunden. Die Gebühren der Innovation Zone sind höher; Listing-Parameter können sich ändern. Sie belegt weder Spot-Verfügbarkeit noch persönliche Berechtigung.",
          "ru": "Уведомление от 4 сентября описывает бессрочные контракты CPUSDT в Innovation Zone с расчетами в USDT и ставкой фондирования каждые четыре часа. Комиссии Innovation Zone выше; параметры листинга могут измениться. Это не подтверждает доступность спотовой торговли или личное право участия.",
          "id": "Pemberitahuan 4 September menjelaskan kontrak perpetual CPUSDT di Zona Inovasi, diselesaikan dalam USDT dengan biaya funding setiap empat jam. Biaya Zona Inovasi lebih tinggi; parameter listing dapat berubah. Ini tidak membuktikan ketersediaan perdagangan spot atau kelayakan pribadi.",
          "vi": "Thông báo ngày 4 tháng 9 mô tả hợp đồng vĩnh viễn CPUSDT trong Khu Đổi mới, thanh toán bằng USDT và có phí funding mỗi bốn giờ. Phí Khu Đổi mới cao hơn; thông số niêm yết có thể thay đổi. Điều này không chứng minh khả năng giao dịch spot hay điều kiện cá nhân.",
          "it": "L'avviso del 4 settembre descrive i contratti perpetui CPUSDT nella Innovation Zone, regolati in USDT con commissione di funding ogni quattro ore. Le commissioni della Innovation Zone sono più alte; i parametri di quotazione possono cambiare. Non stabilisce la disponibilità spot né l'idoneità personale.",
          // l10n: needs native review
          "ur": "4 ستمبر کا نوٹس Innovation Zone میں CPUSDT پرپیچوئلز بیان کرتا ہے، جو USDT میں سیٹل ہوتے ہیں اور چار گھنٹے کی فنڈنگ رکھتے ہیں۔ Innovation Zone فیسیں زیادہ ہیں؛ لسٹنگ پیرامیٹرز بدل سکتے ہیں۔ یہ اسپاٹ دستیابی یا ذاتی اہلیت ثابت نہیں کرتا۔",
          // l10n: needs native review
          "uk": "Повідомлення від 4 вересня описує безстрокові CPUSDT в Innovation Zone, з розрахунком в USDT і чотиригодинним фінансуванням. Комісії Innovation Zone вищі; параметри лістингу можуть змінюватися. Це не встановлює спотову доступність або особисту придатність."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "Complete and claim each task before its own deadline.",
        "zh-Hans": "按各任务的独立期限完成并领取。",
        "zh-Hant": "按各任務的獨立期限完成並領取。",
        "ja": "各タスクをそれぞれの期限までに完了して申請してください。",
        "ko": "마감일 이전에 각 작업을 완료하고 청구하세요.",
        "tr": "Her görevi kendi son teslim tarihinden önce tamamlayın ve talep edin.",
        "ar": "أكمل كل مهمة وطالب بها قبل الموعد النهائي الخاص بها.",
        "es": "Complete y reclame cada tarea antes de su fecha límite.",
        "pt-BR": "Conclua e reivindique cada tarefa antes do prazo.",
        "fr": "Terminez et réclamez chaque tâche avant sa propre date limite.",
        "de": "Erledigen und beanspruchen Sie jede Aufgabe vor Ablauf ihrer Frist.",
        "ru": "Выполняйте каждое задание и забирайте награду до истечения установленного срока.",
        "id": "Selesaikan dan klaim setiap tugas sebelum tenggat waktunya.",
        "vi": "Hoàn thành và yêu cầu mỗi nhiệm vụ trước thời hạn riêng của nó.",
        "it": "Completa e richiedi ogni attività prima della scadenza.",
        // l10n: needs native review
        "ur": "ہر کام کو اس کی اپنی آخری تاریخ سے پہلے مکمل اور دعویٰ کریں۔",
        // l10n: needs native review
        "uk": "Виконайте й заявка кожне завдання до його власного дедлайну."
      },
      "kyc": {
        "en": "Complete the required identity verification before claiming.",
        "zh-Hans": "领取前完成所需身份验证。",
        "zh-Hant": "領取前完成所需身分驗證。",
        "ja": "請求する前に、必要な本人確認を完了してください。",
        "ko": "청구하기 전에 필수 신원 확인을 완료하세요.",
        "tr": "Hak talebinde bulunmadan önce gerekli kimlik doğrulamasını tamamlayın.",
        "ar": "أكمل التحقق المطلوب من الهوية قبل المطالبة.",
        "es": "Complete la verificación de identidad requerida antes de realizar el reclamo.",
        "pt-BR": "Conclua a verificação de identidade necessária antes de reivindicar.",
        "fr": "Effectuez la vérification d’identité requise avant de réclamer.",
        "de": "Führen Sie die erforderliche Identitätsüberprüfung durch, bevor Sie einen Anspruch geltend machen.",
        "ru": "Прежде чем подавать заявку, пройдите необходимую проверку личности.",
        "id": "Selesaikan verifikasi identitas yang diperlukan sebelum mengklaim.",
        "vi": "Hoàn thành xác minh danh tính cần thiết trước khi yêu cầu.",
        "it": "Completa la verifica dell'identità richiesta prima di effettuare la richiesta.",
        // l10n: needs native review
        "ur": "دعویٰ کرنے سے پہلے درکار شناخت تصدیق مکمل کریں۔",
        // l10n: needs native review
        "uk": "Пройдіть необхідну перевірку особи перед поданням заявки."
      },
      "rewardType": {
        "en": "Trading bonus and vouchers; not uniformly withdrawable",
        "zh-Hans": "交易赠金与卡券，不是统一可提现现金",
        "zh-Hant": "交易贈金與卡券，不是統一可提領現金",
        "ja": "取引ボーナスとバウチャー;一律に引き出し可能ではない",
        "ko": "거래 보너스 및 바우처 균일하게 인출되지 않음",
        "tr": "Ticaret bonusu ve kuponlar; eşit olarak geri çekilemez",
        "ar": "مكافآت وقسائم التداول؛ غير قابلة للسحب بشكل موحد",
        "es": "Bonos y bonos comerciales; no uniformemente retirable",
        "pt-BR": "Bônus e vouchers de negociação; não uniformemente retirável",
        "fr": "Bonus et bons de trading ; pas uniformément retirable",
        "de": "Handelsbonus und Gutscheine; nicht einheitlich abziehbar",
        "ru": "Торговые бонусы и ваучеры; вывод средств доступен не на единых условиях",
        "id": "Bonus perdagangan dan voucher; tidak dapat ditarik secara seragam",
        "vi": "Tiền thưởng giao dịch và voucher; không thể rút theo cùng một điều kiện",
        "it": "Bonus di trading e voucher; non uniformemente ritirabile",
        // l10n: needs native review
        "ur": "ٹریڈنگ بونس اور واؤچرز؛ یکساں طور پر نکلوائی کے قابل نہیں۔",
        // l10n: needs native review
        "uk": "Торгові бонуси та ваучери; для них діють різні умови виведення."
      },
      "limitations": {
        "en": "Confirm the reward type and permitted use; do not treat bonus face value as cash.",
        "zh-Hans": "核对奖励类型和适用范围，不把赠金面值当作现金。",
        "zh-Hant": "核對獎勵類型和適用範圍，不把贈金面值當作現金。",
        "ja": "特典の種類と許可された使用を確認します。ボーナス額面を現金として扱わないでください。",
        "ko": "보상 유형과 허용되는 사용을 확인하세요. 보너스 액면가를 현금으로 취급하지 마십시오.",
        "tr": "Ödül türünü ve izin verilen kullanımı onaylayın; Bonus nominal değerini nakit olarak değerlendirmeyin.",
        "ar": "تأكيد نوع المكافأة والاستخدام المسموح به؛ لا تعامل القيمة الاسمية للمكافأة على أنها نقدية.",
        "es": "Confirmar el tipo de recompensa y el uso permitido; No trate el valor nominal del bono como efectivo.",
        "pt-BR": "Confirme o tipo de recompensa e uso permitido; não trate o valor nominal do bônus como dinheiro.",
        "fr": "Confirmez le type de récompense et l'utilisation autorisée ; ne considérez pas la valeur nominale du bonus comme de l’argent liquide.",
        "de": "Bestätigen Sie die Art der Belohnung und die zulässige Nutzung; Behandeln Sie den Nennwert des Bonus nicht als Bargeld.",
        "ru": "Подтвердите тип вознаграждения и разрешенное использование; не рассматривайте номинальную стоимость бонуса как денежные средства.",
        "id": "Konfirmasikan jenis hadiah dan penggunaan yang diizinkan; jangan memperlakukan nilai nominal bonus sebagai uang tunai.",
        "vi": "Xác nhận loại phần thưởng và mục đích sử dụng được phép; không coi mệnh giá tiền thưởng là tiền mặt.",
        "it": "Confermare la tipologia del premio e l'uso consentito; non trattare il valore nominale del bonus come denaro contante.",
        // l10n: needs native review
        "ur": "انعام قسم اور مجاز استعمال تصدیق کریں؛ بونس ظاہری مالیت کو نقد نہ سمجھیں۔",
        // l10n: needs native review
        "uk": "Підтвердьте тип винагороди і дозволене використання; не трактуйте номінал бонусу як готівку."
      },
      "publishedDate": {
        "en": "2025-11-25",
        "zh-Hans": "2025-11-25",
        "zh-Hant": "2025-11-25",
        "ja": "2025-11-25",
        "ko": "2025-11-25",
        "tr": "2025-11-25",
        "ar": "2025-11-25",
        "es": "2025-11-25",
        "pt-BR": "2025-11-25",
        "fr": "2025-11-25",
        "de": "25.11.2025",
        "ru": "2025-11-25",
        "id": "25-11-2025",
        "vi": "25-11-2025",
        "it": "25-11-2025",
        // l10n: needs native review
        "ur": "2025-11-25",
        // l10n: needs native review
        "uk": "2025-11-25"
      },
      "datePrecision": {
        "en": "Source date retained as displayed; no missing timezone is inferred.",
        "zh-Hans": "保留来源显示日期，不推断缺失时区。",
        "zh-Hant": "保留來源顯示日期，不推斷缺失時區。",
        "ja": "ソースの日付は表示どおりに保持されます。欠落しているタイムゾーンは推論されません。",
        "ko": "소스 날짜는 표시된 대로 유지됩니다. 누락된 시간대는 유추되지 않습니다.",
        "tr": "Kaynak tarihi görüntülendiği şekilde tutuldu; eksik bir saat diliminin olmadığı anlaşılmaktadır.",
        "ar": "تم الاحتفاظ بتاريخ المصدر كما هو معروض؛ لا يتم استنتاج أي منطقة زمنية مفقودة.",
        "es": "La fecha de origen se conserva tal como se muestra; no se infiere ninguna zona horaria faltante.",
        "pt-BR": "Data de origem mantida conforme exibida; nenhum fuso horário ausente é inferido.",
        "fr": "Date source conservée telle qu'affichée ; aucun fuseau horaire manquant n’est déduit.",
        "de": "Quelldatum wie angezeigt beibehalten; Es wird keine fehlende Zeitzone abgeleitet.",
        "ru": "Исходная дата сохраняется в том виде, в каком она отображается; отсутствие отсутствующего часового пояса не предполагается.",
        "id": "Tanggal sumber dipertahankan seperti yang ditampilkan; tidak ada zona waktu yang hilang yang disimpulkan.",
        "vi": "Ngày nguồn được giữ lại như được hiển thị; không có múi giờ bị thiếu được suy ra.",
        "it": "Data di origine mantenuta come visualizzata; non si deduce alcun fuso orario mancante.",
        // l10n: needs native review
        "ur": "ماخذ تاریخ جیسے دکھائی گئی ویسے رکھی گئی؛ غائب وقت زون اخذ نہیں کیا گیا۔",
        // l10n: needs native review
        "uk": "Дату джерела збережено так, як показано; відсутній часовий пояс не виводиться."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/ریجن اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Для цієї конкретної пропозиції не встановлено повний список придатності країн/регіонів."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The Rewards Hub FAQ confirms that bonuses and Fee Savers are not withdrawable and unused rewards can expire.",
          "zh-Hans": "福利中心 FAQ 明确：赠金和手续费抵扣不能直接提现，未使用奖励可能到期失效。",
          "zh-Hant": "福利中心 FAQ 明確：贈金和手續費抵扣不能直接提領，未使用獎勵可能到期失效。",
          "ja": "Rewards Hub FAQ では、ボーナスと手数料セーバーは出金できず、未使用の特典は期限切れになる可能性があることを確認しています。",
          "ko": "보상 허브 FAQ에서는 보너스와 수수료 절약 혜택은 철회할 수 없으며 사용하지 않은 보상은 만료될 수 있음을 확인합니다.",
          "tr": "Ödül Merkezi SSS, bonusların ve Ücret Tasarruflarının çekilemeyeceğini ve kullanılmayan ödüllerin süresinin dolabileceğini doğrulamaktadır.",
          "ar": "تؤكد الأسئلة الشائعة لـ Rewards Hub أن المكافآت وقسائم خفض الرسوم (Fee Savers) غير قابلة للسحب وأن المكافآت غير المستخدمة يمكن أن تنتهي صلاحيتها.",
          "es": "Las preguntas frecuentes de Rewards Hub confirman que los bonos y los ahorros de tarifas no se pueden retirar y que las recompensas no utilizadas pueden caducar.",
          "pt-BR": "As perguntas frequentes do Rewards Hub confirmam que os bônus e os poupadores de taxas não podem ser retirados e as recompensas não utilizadas podem expirar.",
          "fr": "La FAQ du Rewards Hub confirme que les bonus et les réductions de frais ne sont pas retirables et que les récompenses inutilisées peuvent expirer.",
          "de": "In den häufig gestellten Fragen zum Rewards Hub wird bestätigt, dass Boni und Gebührenersparnisse nicht auszahlbar sind und ungenutzte Prämien verfallen können.",
          "ru": "Часто задаваемые вопросы о Rewards Hub подтверждают, что бонусы и бонусы Fee Saver нельзя вывести, а срок действия неиспользованных вознаграждений может истечь.",
          "id": "FAQ Rewards Hub mengonfirmasi bahwa bonus dan Penghemat Biaya tidak dapat ditarik dan hadiah yang tidak digunakan dapat kedaluwarsa.",
          "vi": "Câu hỏi thường gặp về Trung tâm Phần thưởng xác nhận rằng tiền thưởng và Tiết kiệm phí không thể rút được và phần thưởng chưa sử dụng có thể hết hạn.",
          "it": "Le domande frequenti sul Rewards Hub confermano che i bonus e i Fee Saver non sono ritirabili e che i premi non utilizzati possono scadere.",
          // l10n: needs native review
          "ur": "Rewards مرکز FAQ تصدیق کرتا ہے کہ بونسز اور فیس سیورز قابل نکاسی نہیں ہیں اور غیر استعمال شدہ انعامات ختم ہو سکتے ہیں۔",
          // l10n: needs native review
          "uk": "FAQ Центру винагород підтверджує, що бонуси і Fee Savers не є доступними для виведення, а невикористані винагороди можуть закінчуватися."
        }
      ]
    }
  },
  "bitget": {
    "summary": {
      "en": "The stated welcome bundle combines different tasks, including inviting another person; it is not a simple deposit cash gift.",
      "zh-Hans": "欢迎礼包汇总了不同任务，还包含邀请他人的任务，并非单纯充值即得现金。",
      "zh-Hant": "歡迎禮包彙總了不同任務，還包含邀請他人的任務，並非單純儲值即得現金。",
      "ja": "記載されているウェルカム バンドルは、別の人を招待するなど、さまざまなタスクを組み合わせたものです。単純な入金による現金ギフトではありません。",
      "ko": "명시된 환영 번들은 다른 사람 초대를 포함하여 다양한 작업을 결합합니다. 단순 입금 현금선물이 아닙니다.",
      "tr": "Belirtilen karşılama paketi, başka bir kişiyi davet etmek de dahil olmak üzere farklı görevleri birleştirir; basit bir para yatırma hediyesi değildir.",
      "ar": "تجمع حزمة الترحيب المذكورة بين مهام مختلفة، بما في ذلك دعوة شخص آخر؛ إنها ليست هدية نقدية بسيطة للإيداع.",
      "es": "El paquete de bienvenida indicado combina diferentes tareas, incluida invitar a otra persona; No es un simple regalo en efectivo con depósito.",
      "pt-BR": "O pacote de boas-vindas indicado combina diferentes tarefas, incluindo convidar outra pessoa; não é um simples depósito em dinheiro.",
      "fr": "Le pack de bienvenue indiqué combine différentes tâches, notamment inviter une autre personne ; il ne s’agit pas d’un simple don en espèces.",
      "de": "Das angegebene Willkommenspaket vereint verschiedene Aufgaben, darunter das Einladen einer anderen Person; Es handelt sich nicht um ein einfaches Bargeldgeschenk.",
      "ru": "Заявленный приветственный пакет объединяет в себе разные задачи, в том числе приглашение другого человека; это не простой подарок в виде депозита наличными.",
      "id": "Paket selamat datang yang disebutkan menggabungkan berbagai tugas, termasuk mengundang orang lain; ini bukan hadiah uang tunai setoran sederhana.",
      "vi": "Gói chào mừng đã nêu kết hợp các nhiệm vụ khác nhau, bao gồm mời người khác; nó không phải là một món quà tiền mặt gửi tiền đơn giản.",
      "it": "Il pacchetto di benvenuto dichiarato combina diversi compiti, incluso invitare un'altra persona; non è un semplice regalo in contanti.",
      // l10n: needs native review
      "ur": "بیان کردہ استقبالی بنڈل مختلف کاموں کو ملاتا ہے، جن میں کسی اور شخص کو دعوت دینا بھی شامل ہے؛ یہ سادہ ڈپازٹ نقد تحفہ نہیں۔",
      // l10n: needs native review
      "uk": "Зазначений вітальний пакет поєднує різні завдання, зокрема запрошення іншої особи; це не простий грошовий подарунок за депозит."
    },
    "signupReward": {
      "summary": {
        "en": "The 2025 guide describes a 6,200 USDT face-value bundle. Its current availability and the account's exact voucher terms require confirmation.",
        "zh-Hans": "2025 年指南描述了面值合计 6,200 USDT 的礼包，当前可用性与账户实际卡券条款仍需确认。",
        "zh-Hant": "2025 年指南描述了面值合計 6,200 USDT 的禮包，目前可用性與帳戶實際卡券條款仍需確認。",
        "ja": "2025 年のガイドでは、額面 6,200 USDT のバンドルについて説明されています。現在の利用可能性とアカウントの正確なバウチャー条件については確認が必要です。",
        "ko": "2025 가이드는 6,200 USDT 액면가 번들을 설명합니다. 현재 이용 가능 여부와 계정의 정확한 바우처 조건을 확인해야 합니다.",
        "tr": "2025 kılavuzunda 6.200 USDT değerinde bir paket açıklanıyor. Mevcut kullanılabilirliği ve hesabın tam kupon koşulları onay gerektirir.",
        "ar": "يصف دليل 2025 حزمة بقيمة اسمية قدرها 6,200 USDT. ويتطلب توفرها الحالي وشروط قسائم الحساب الدقيقة تأكيداً.",
        "es": "La guía 2025 describe un paquete de valor nominal de 6200 USDT. Su disponibilidad actual y los términos exactos del bono de la cuenta requieren confirmación.",
        "pt-BR": "O guia de 2025 descreve um pacote de valor nominal de 6.200 USDT. A sua disponibilidade atual e os termos exatos do voucher da conta requerem confirmação.",
        "fr": "Le guide 2025 décrit un forfait d'une valeur nominale de 6 200 USDT. Sa disponibilité actuelle et les conditions exactes du bon du compte nécessitent une confirmation.",
        "de": "Der Leitfaden für 2025 beschreibt ein Nennwertpaket von 6.200 USDT. Die aktuelle Verfügbarkeit und die genauen Gutscheinbedingungen des Kontos müssen bestätigt werden.",
        "ru": "В справочнике на 2025 год описан пакет номинальной стоимостью 6 200 USDT. Его текущая доступность и точные условия ваучеров требуют подтверждения.",
        "id": "Panduan tahun 2025 menjelaskan paket nilai nominal 6.200 USDT. Ketersediaannya saat ini dan ketentuan voucher akun yang sebenarnya memerlukan konfirmasi.",
        "vi": "Hướng dẫn năm 2025 mô tả gói voucher mệnh giá 6.200 USDT. Tình trạng sẵn có hiện tại và các điều khoản voucher cụ thể của tài khoản cần được xác nhận.",
        "it": "La guida 2025 descrive un pacchetto con valore nominale di 6.200 USDT. La sua disponibilità attuale e i termini esatti del voucher dell'account richiedono conferma.",
        // l10n: needs native review
        "ur": "2025 گائیڈ 6,200 USDT ظاہری مالیت کے بنڈل کو بیان کرتا ہے۔ اس کی موجودہ دستیابی اور اکاؤنٹ کی عین واؤچر شرائط تصدیق چاہتی ہیں۔",
        // l10n: needs native review
        "uk": "Гід 2025 року описує пакет номіналом 6,200 USDT. Його поточна доступність і точні умови ваучерів для акаунта потребують підтвердження."
      },
      "conditions": [
        {
          "en": "The guide gives new users seven days for the deposit/trading challenge.",
          "zh-Hans": "该指南给新用户的充值与交易挑战期限为注册后七天。",
          "zh-Hant": "該指南給新用戶的儲值與交易挑戰期限為註冊後七天。",
          "ja": "このガイドでは、新規ユーザーに入金/取引チャレンジに 7 日間の猶予が与えられています。",
          "ko": "가이드는 신규 사용자에게 예금/거래 도전을 위한 7일의 시간을 제공합니다.",
          "tr": "Kılavuz, yeni kullanıcılara para yatırma/ticaret mücadelesi için yedi gün veriyor.",
          "ar": "يمنح الدليل المستخدمين الجدد سبعة أيام لتحدي الإيداع/التداول.",
          "es": "La guía ofrece a los nuevos usuarios siete días para el desafío de depósito/comercio.",
          "pt-BR": "O guia dá aos novos usuários sete dias para o desafio de depósito/negociação.",
          "fr": "Le guide donne aux nouveaux utilisateurs sept jours pour le défi de dépôt/trading.",
          "de": "Der Leitfaden gibt neuen Benutzern sieben Tage Zeit für die Einzahlungs-/Handelsherausforderung.",
          "ru": "Руководство дает новым пользователям семь дней на депозит/торговлю.",
          "id": "Panduan ini memberi pengguna baru waktu tujuh hari untuk tantangan deposit/perdagangan.",
          "vi": "Hướng dẫn cung cấp cho người dùng mới bảy ngày để thử thách gửi tiền/giao dịch.",
          "it": "La guida offre ai nuovi utenti sette giorni per la sfida di deposito/negoziazione.",
          // l10n: needs native review
          "ur": "گائیڈ نئے صارفین کو ڈپازٹ/ٹریڈنگ چیلنج کے لیے سات دن دیتی ہے۔",
          // l10n: needs native review
          "uk": "Гайд дає новим користувачам сім днів для депозитно-торгового челенджу."
        },
        {
          "en": "It describes a three-day observation period, then a two-day manual claim window.",
          "zh-Hans": "指南写明三天观察期后，还需在两天内手动领取。",
          "zh-Hant": "指南寫明三天觀察期後，還需在兩天內手動領取。",
          "ja": "これは、3 日間の観察期間と、その後 2 日間の手動請求期間について説明しています。",
          "ko": "3일간의 관찰 기간과 2일간의 직접 청구 기간을 설명합니다.",
          "tr": "Üç günlük bir gözlem periyodunu, ardından iki günlük bir manuel talep penceresini tanımlar.",
          "ar": "ويصف فترة مراقبة مدتها ثلاثة أيام، ثم نافذة مطالبة يدوية مدتها يومان.",
          "es": "Describe un período de observación de tres días y luego un período de reclamo manual de dos días.",
          "pt-BR": "Descreve um período de observação de três dias e, em seguida, uma janela de reclamação manual de dois dias.",
          "fr": "Il décrit une période d'observation de trois jours, puis une fenêtre de réclamation manuelle de deux jours.",
          "de": "Es beschreibt einen dreitägigen Beobachtungszeitraum und dann ein zweitägiges manuelles Anspruchsfenster.",
          "ru": "Он описывает трехдневный период наблюдения, а затем двухдневный период подачи заявок вручную.",
          "id": "Ini menggambarkan periode observasi tiga hari, kemudian jendela klaim manual dua hari.",
          "vi": "Nó mô tả khoảng thời gian quan sát ba ngày, sau đó là khoảng thời gian yêu cầu thủ công kéo dài hai ngày.",
          "it": "Descrive un periodo di osservazione di tre giorni, quindi una finestra di richiesta manuale di due giorni.",
          // l10n: needs native review
          "ur": "یہ تین دن کی مشاہداتی مدت، پھر دو دن کی دستی کلیم مدت بیان کرتی ہے۔",
          // l10n: needs native review
          "uk": "Він описує триденний період спостереження, а потім дводенне вікно для отримання вручну."
        },
        {
          "en": "Rewards go to the coupon center; check each instrument's use, expiry and current eligibility.",
          "zh-Hans": "奖励进入卡券中心，需核对各类卡券用途、期限与当前参与资格。",
          "zh-Hant": "獎勵進入卡券中心，需核對各類卡券用途、期限與目前參與資格。",
          "ja": "特典はクーポン センターに送られます。各手段の使用、有効期限、および現在の資格を確認してください。",
          "ko": "보상은 쿠폰 센터로 이동합니다. 각 기기의 사용, 만료 및 현재 적격성을 확인하세요.",
          "tr": "Ödüller kupon merkezine gider; her enstrümanın kullanımını, son kullanma tarihini ve mevcut uygunluğunu kontrol edin.",
          "ar": "تذهب المكافآت إلى مركز القسيمة؛ تحقق من استخدام كل أداة وانتهاء الصلاحية والأهلية الحالية.",
          "es": "Las recompensas van al centro de cupones; Verifique el uso, vencimiento y elegibilidad actual de cada instrumento.",
          "pt-BR": "As recompensas vão para a central de cupons; verifique o uso, validade e elegibilidade atual de cada instrumento.",
          "fr": "Les récompenses vont au centre de coupons ; vérifiez l'utilisation, l'expiration et l'éligibilité actuelle de chaque instrument.",
          "de": "Prämien gehen an das Coupon-Center; Überprüfen Sie die Verwendung, den Ablauf und die aktuelle Berechtigung jedes Instruments.",
          "ru": "Награды поступают в купонный центр; проверьте использование каждого инструмента, срок его действия и текущую приемлемость.",
          "id": "Hadiah masuk ke pusat kupon; periksa penggunaan setiap instrumen, masa berlakunya, dan kelayakannya saat ini.",
          "vi": "Phần thưởng được chuyển đến trung tâm phiếu giảm giá; kiểm tra việc sử dụng, hết hạn và tính đủ điều kiện hiện tại của từng công cụ.",
          "it": "I premi vanno al centro coupon; verificare l'utilizzo, la scadenza e l'idoneità attuale di ciascuno strumento.",
          // l10n: needs native review
          "ur": "Rewards کوپن مرکز میں جاتے ہیں؛ ہر آلہ کا استعمال، اختتام اور موجودہ اہلیت چیک کریں۔",
          // l10n: needs native review
          "uk": "Rewards надходять до Центру купонів; перевірте використання, закінчення і поточну придатність кожного інструмента."
        }
      ]
    },
    "sources": {
      "bitget-rewards-guide": {
        "summary": {
          "en": "Dated 23 January 2025. A historical program guide, not proof that a new account receives the advertised maximum today.",
          "zh-Hans": "页面日期为 2025 年 1 月 23 日；这是历史计划指南，不证明今天的新账户可获得宣传最高额。",
          "zh-Hant": "頁面日期為 2025 年 1 月 23 日；這是歷史計畫指南，不證明今天的新帳戶可獲得宣傳最高額。",
          "ja": "日付は 2025 年 1 月 23 日です。過去の番組ガイドであり、新しいアカウントが今日宣伝されている最大額を受け取ることを証明するものではありません。",
          "ko": "2025년 1월 23일자. 과거 프로그램 가이드이며 새 계정이 오늘 광고된 최대 금액을 받았다는 증거는 아닙니다.",
          "tr": "23 Ocak 2025 tarihli. Tarihsel bir program kılavuzu; yeni bir hesabın reklamı yapılan maksimum tutarı bugün aldığının kanıtı değil.",
          "ar": "بتاريخ 23 يناير 2025. دليل البرنامج التاريخي، وليس دليلاً على أن الحساب الجديد يتلقى الحد الأقصى المعلن عنه اليوم.",
          "es": "Con fecha del 23 de enero de 2025. Una guía histórica del programa, no prueba de que una cuenta nueva reciba el máximo anunciado hoy.",
          "pt-BR": "Datado de 23 de janeiro de 2025. Um guia histórico do programa, não uma prova de que uma nova conta receba o máximo anunciado hoje.",
          "fr": "Daté du 23 janvier 2025. Un guide de programme historique, et non une preuve qu'un nouveau compte reçoit aujourd'hui le maximum annoncé.",
          "de": "Datiert vom 23. Januar 2025. Ein historischer Programmführer, kein Beweis dafür, dass ein neues Konto heute den angekündigten Höchstbetrag erhält.",
          "ru": "Датировано 23 января 2025 г. Историческое руководство по программе, а не доказательство того, что новая учетная запись сегодня получает заявленный максимум.",
          "id": "Tanggal 23 Januari 2025. Panduan program historis, bukan bukti bahwa akun baru menerima jumlah maksimum yang diiklankan hari ini.",
          "vi": "Ngày 23 tháng 1 năm 2025. Hướng dẫn chương trình lịch sử, không phải bằng chứng cho thấy tài khoản mới nhận được số tiền tối đa được quảng cáo ngay hôm nay.",
          "it": "Datato 23 gennaio 2025. Una guida storica al programma, non una prova che un nuovo account riceva il massimo pubblicizzato oggi.",
          // l10n: needs native review
          "ur": "تاریخ 23 جنوری 2025 ہے۔ یہ تاریخی پروگرام گائیڈ ہے، اس بات کا ثبوت نہیں کہ نیا اکاؤنٹ آج مشتہر زیادہ سے زیادہ رقم لیتا ہے۔",
          // l10n: needs native review
          "uk": "Датовано 23 січня 2025 року. Це історичний гайд програми, а не доказ того, що новий акаунт сьогодні отримує рекламований максимум."
        }
      },
      "bitget-hajimi-september": {
        "summary": {
          "en": "The notice names 哈基米USDT futures and bots on 6 September 2026 (UTC+8), with 3x maximum leverage and four-hour funding. It gives no precise launch clock time; parameters may change. This is a derivative announcement, not a spot-token reward.",
          "zh-Hans": "公告说明 2026 年 9 月 6 日（UTC+8）上线哈基米USDT 合约与机器人，最高杠杆 3 倍、每四小时结算资金费。未列精确上线时刻，参数可调整；这是衍生品公告，不是现货代币奖励。",
          "zh-Hant": "公告說明 2026 年 9 月 6 日（UTC+8）上線哈基米USDT 合約與機器人，最高槓桿 3 倍、每四小時結算資金費。未列精確上線時刻，參數可調整；這是衍生品公告，不是現貨代幣獎勵。",
          "ja": "この告知は、2026 年 9 月 6 日（UTC+8）に 哈基米USDT 先物とボットを掲載し、最大 3 倍レバレッジ、4 時間ごとの資金調達料を示しています。正確な開始時刻は示しておらず、パラメータは変更される場合があります。これはデリバティブの告知であり、現物トークン報酬ではありません。",
          "ko": "공지에는 2026년 9월 6일(UTC+8)에 哈基米USDT 선물과 봇이 명시되어 있으며, 최대 3배 레버리지와 4시간마다 정산되는 펀딩비가 포함됩니다. 정확한 출시 시각은 제공하지 않으며 매개변수는 변경될 수 있습니다. 이는 파생상품 공지이며 현물 토큰 보상이 아닙니다.",
          "tr": "Bildirim, 6 Eylül 2026 (UTC+8) tarihinde 哈基米USDT vadeli sözleşmeleri ve botlarını, 3x azami kaldıraç ve dört saatte bir fonlama ücretiyle adlandırır. Kesin başlatma saati vermez; parametreler değişebilir. Bu bir türev ürün duyurusudur, spot token ödülü değildir.",
          "ar": "يذكر الإشعار عقود 哈基米USDT الآجلة والروبوتات في 6 سبتمبر 2026 (UTC+8)، مع رافعة مالية بحد أقصى 3x ورسوم تمويل كل أربع ساعات. لا يحدد ساعة إطلاق دقيقة؛ وقد تتغير المعلمات. هذا إعلان لمشتقات، وليس مكافأة رمز للتداول الفوري.",
          "es": "El aviso menciona futuros y bots 哈基米USDT el 6 de septiembre de 2026 (UTC+8), con apalancamiento máximo de 3x y comisión de financiación cada cuatro horas. No da una hora exacta de lanzamiento; los parámetros pueden cambiar. Es un anuncio de derivados, no una recompensa de token spot.",
          "pt-BR": "O aviso menciona futuros e bots 哈基米USDT em 6 de setembro de 2026 (UTC+8), com alavancagem máxima de 3x e taxa de funding a cada quatro horas. Não informa horário exato de lançamento; os parâmetros podem mudar. É um anúncio de derivativos, não uma recompensa de token à vista.",
          "fr": "L'avis mentionne les contrats à terme et les bots 哈基米USDT le 6 septembre 2026 (UTC+8), avec un effet de levier maximal de 3x et des frais de financement toutes les quatre heures. Il ne donne pas d'heure précise de lancement ; les paramètres peuvent changer. C'est une annonce de dérivés, pas une récompense de jeton au comptant.",
          "de": "Die Mitteilung nennt 哈基米USDT-Futures und Bots am 6. September 2026 (UTC+8) mit maximal 3x Hebel und Funding-Gebühren alle vier Stunden. Sie nennt keine genaue Startuhrzeit; Parameter können sich ändern. Dies ist eine Derivate-Ankündigung, keine Spot-Token-Belohnung.",
          "ru": "Уведомление называет фьючерсы и ботов 哈基米USDT на 6 сентября 2026 года (UTC+8), с максимальным плечом 3x и комиссией фондирования каждые четыре часа. Точное время запуска не указано; параметры могут измениться. Это объявление о деривативах, а не вознаграждение спотовым токеном.",
          "id": "Pemberitahuan tersebut menyebutkan futures dan bot 哈基米USDT pada 6 September 2026 (UTC+8), dengan leverage maksimum 3x dan biaya funding setiap empat jam. Pemberitahuan tidak memberikan jam peluncuran yang tepat; parameter dapat berubah. Ini adalah pengumuman derivatif, bukan hadiah token spot.",
          "vi": "Thông báo nêu tên hợp đồng tương lai và bot 哈基米USDT vào ngày 6 tháng 9 năm 2026 (UTC+8), với đòn bẩy tối đa 3x và phí funding mỗi bốn giờ. Thông báo không đưa ra giờ ra mắt chính xác; các thông số có thể thay đổi. Đây là thông báo phái sinh, không phải phần thưởng token spot.",
          "it": "L'avviso nomina futures e bot 哈基米USDT il 6 settembre 2026 (UTC+8), con leva massima 3x e commissione di funding ogni quattro ore. Non fornisce un orario preciso di lancio; i parametri possono cambiare. È un annuncio su derivati, non una ricompensa in token spot.",
          // l10n: needs native review
          "ur": "نوٹس 6 ستمبر 2026 (UTC+8) کو 哈基米USDT فیوچرز اور بوٹس کا نام لیتا ہے، زیادہ سے زیادہ 3x لیوریج اور چار گھنٹے کی فنڈنگ کے ساتھ۔ یہ درست لانچ وقت نہیں دیتا؛ پیرامیٹرز بدل سکتے ہیں۔ یہ مشتقات کا اعلان ہے، اسپاٹ ٹوکن انعام نہیں۔",
          // l10n: needs native review
          "uk": "Повідомлення називає ф’ючерси й ботів 哈基米USDT на 6 вересня 2026 року (UTC+8), з максимальною плечовою позицією 3x і фінансуванням кожні чотири години. Точного часу запуску воно не дає; параметри можуть змінюватися. Це оголошення про дериватив, а не винагорода спотовим токеном."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "The guide gives new users seven days for the deposit/trading challenge.",
        "zh-Hans": "该指南给新用户的充值与交易挑战期限为注册后七天。",
        "zh-Hant": "該指南給新用戶的儲值與交易挑戰期限為註冊後七天。",
        "ja": "このガイドでは、新規ユーザーに入金/取引チャレンジに 7 日間の猶予が与えられています。",
        "ko": "가이드는 신규 사용자에게 예금/거래 도전을 위한 7일의 시간을 제공합니다.",
        "tr": "Kılavuz, yeni kullanıcılara para yatırma/ticaret mücadelesi için yedi gün veriyor.",
        "ar": "يمنح الدليل المستخدمين الجدد سبعة أيام لتحدي الإيداع/التداول.",
        "es": "La guía ofrece a los nuevos usuarios siete días para el desafío de depósito/comercio.",
        "pt-BR": "O guia dá aos novos usuários sete dias para o desafio de depósito/negociação.",
        "fr": "Le guide donne aux nouveaux utilisateurs sept jours pour le défi de dépôt/trading.",
        "de": "Der Leitfaden gibt neuen Benutzern sieben Tage Zeit für die Einzahlungs-/Handelsherausforderung.",
        "ru": "Руководство дает новым пользователям семь дней на депозит/торговлю.",
        "id": "Panduan ini memberi pengguna baru waktu tujuh hari untuk tantangan deposit/perdagangan.",
        "vi": "Hướng dẫn cung cấp cho người dùng mới bảy ngày để thử thách gửi tiền/giao dịch.",
        "it": "La guida offre ai nuovi utenti sette giorni per la sfida di deposito/negoziazione.",
        // l10n: needs native review
        "ur": "گائیڈ نئے صارفین کو ڈپازٹ/ٹریڈنگ چیلنج کے لیے سات دن دیتا ہے۔",
        // l10n: needs native review
        "uk": "Гайд дає новим користувачам сім днів для депозитно-торгового челенджу."
      },
      "deposit": {
        "en": "The guide gives new users seven days for the deposit/trading challenge.",
        "zh-Hans": "该指南给新用户的充值与交易挑战期限为注册后七天。",
        "zh-Hant": "該指南給新用戶的儲值與交易挑戰期限為註冊後七天。",
        "ja": "このガイドでは、新規ユーザーに入金/取引チャレンジに 7 日間の猶予が与えられています。",
        "ko": "가이드는 신규 사용자에게 예금/거래 도전을 위한 7일의 시간을 제공합니다.",
        "tr": "Kılavuz, yeni kullanıcılara para yatırma/ticaret mücadelesi için yedi gün veriyor.",
        "ar": "يمنح الدليل المستخدمين الجدد سبعة أيام لتحدي الإيداع/التداول.",
        "es": "La guía ofrece a los nuevos usuarios siete días para el desafío de depósito/comercio.",
        "pt-BR": "O guia dá aos novos usuários sete dias para o desafio de depósito/negociação.",
        "fr": "Le guide donne aux nouveaux utilisateurs sept jours pour le défi de dépôt/trading.",
        "de": "Der Leitfaden gibt neuen Benutzern sieben Tage Zeit für die Einzahlungs-/Handelsherausforderung.",
        "ru": "Руководство дает новым пользователям семь дней на депозит/торговлю.",
        "id": "Panduan ini memberi pengguna baru waktu tujuh hari untuk tantangan deposit/perdagangan.",
        "vi": "Hướng dẫn cung cấp cho người dùng mới bảy ngày để thử thách gửi tiền/giao dịch.",
        "it": "La guida offre ai nuovi utenti sette giorni per la sfida di deposito/negoziazione.",
        // l10n: needs native review
        "ur": "گائیڈ نئے صارفین کو ڈپازٹ/ٹریڈنگ چیلنج کے لیے سات دن دیتی ہے۔",
        // l10n: needs native review
        "uk": "Гайд дає новим користувачам сім днів для депозитно-торгового челенджу."
      },
      "trading": {
        "en": "The guide gives new users seven days for the deposit/trading challenge.",
        "zh-Hans": "该指南给新用户的充值与交易挑战期限为注册后七天。",
        "zh-Hant": "該指南給新用戶的儲值與交易挑戰期限為註冊後七天。",
        "ja": "このガイドでは、新規ユーザーに入金/取引チャレンジに 7 日間の猶予が与えられています。",
        "ko": "가이드는 신규 사용자에게 예금/거래 도전을 위한 7일의 시간을 제공합니다.",
        "tr": "Kılavuz, yeni kullanıcılara para yatırma/ticaret mücadelesi için yedi gün veriyor.",
        "ar": "يمنح الدليل المستخدمين الجدد سبعة أيام لتحدي الإيداع/التداول.",
        "es": "La guía ofrece a los nuevos usuarios siete días para el desafío de depósito/comercio.",
        "pt-BR": "O guia dá aos novos usuários sete dias para o desafio de depósito/negociação.",
        "fr": "Le guide donne aux nouveaux utilisateurs sept jours pour le défi de dépôt/trading.",
        "de": "Der Leitfaden gibt neuen Benutzern sieben Tage Zeit für die Einzahlungs-/Handelsherausforderung.",
        "ru": "Руководство дает новым пользователям семь дней на депозит/торговлю.",
        "id": "Panduan ini memberi pengguna baru waktu tujuh hari untuk tantangan deposit/perdagangan.",
        "vi": "Hướng dẫn cung cấp cho người dùng mới bảy ngày để thử thách gửi tiền/giao dịch.",
        "it": "La guida offre ai nuovi utenti sette giorni per la sfida di deposito/negoziazione.",
        // l10n: needs native review
        "ur": "گائیڈ نئے صارفین کو ڈپازٹ/ٹریڈنگ چیلنج کے لیے سات دن دیتا ہے۔",
        // l10n: needs native review
        "uk": "Гайд дає новим користувачам сім днів для депозитно-торгового челенджу."
      },
      "rewardType": {
        "en": "Trading bonus and vouchers; not uniformly withdrawable",
        "zh-Hans": "交易赠金与卡券，不是统一可提现现金",
        "zh-Hant": "交易贈金與卡券，不是統一可提領現金",
        "ja": "取引ボーナスとバウチャー;一律に引き出し可能ではない",
        "ko": "거래 보너스 및 바우처 균일하게 인출되지 않음",
        "tr": "Ticaret bonusu ve kuponlar; eşit olarak geri çekilemez",
        "ar": "مكافآت وقسائم التداول؛ غير قابلة للسحب بشكل موحد",
        "es": "Bonos y bonos comerciales; no uniformemente retirable",
        "pt-BR": "Bônus e vouchers de negociação; não uniformemente retirável",
        "fr": "Bonus et bons de trading ; pas uniformément retirable",
        "de": "Handelsbonus und Gutscheine; nicht einheitlich abziehbar",
        "ru": "Торговые бонусы и ваучеры; вывод средств доступен не на единых условиях",
        "id": "Bonus perdagangan dan voucher; tidak dapat ditarik secara seragam",
        "vi": "Tiền thưởng giao dịch và voucher; không thể rút theo cùng một điều kiện",
        "it": "Bonus di trading e voucher; non uniformemente ritirabile",
        // l10n: needs native review
        "ur": "ٹریڈنگ بونس اور واؤچرز؛ یکساں طور پر قابل نکاسی نہیں",
        // l10n: needs native review
        "uk": "Торгові бонуси та ваучери; для них діють різні умови виведення"
      },
      "maximumConditions": {
        "en": "The 2025 guide describes a 6,200 USDT face-value bundle. Its current availability and the account's exact voucher terms require confirmation.",
        "zh-Hans": "2025 年指南描述了面值合计 6,200 USDT 的礼包，当前可用性与账户实际卡券条款仍需确认。",
        "zh-Hant": "2025 年指南描述了面值合計 6,200 USDT 的禮包，目前可用性與帳戶實際卡券條款仍需確認。",
        "ja": "2025 年のガイドでは、額面 6,200 USDT のバンドルについて説明されています。現在の利用可能性とアカウントの正確なバウチャー条件については確認が必要です。",
        "ko": "2025 가이드는 6,200 USDT 액면가 번들을 설명합니다. 현재 이용 가능 여부와 계정의 정확한 바우처 조건을 확인해야 합니다.",
        "tr": "2025 kılavuzunda 6.200 USDT değerinde bir paket açıklanıyor. Mevcut kullanılabilirliği ve hesabın tam kupon koşulları onay gerektirir.",
        "ar": "يصف دليل 2025 حزمة بقيمة اسمية قدرها 6,200 USDT. ويتطلب توفرها الحالي وشروط قسائم الحساب الدقيقة تأكيداً.",
        "es": "La guía 2025 describe un paquete de valor nominal de 6200 USDT. Su disponibilidad actual y los términos exactos del bono de la cuenta requieren confirmación.",
        "pt-BR": "O guia de 2025 descreve um pacote de valor nominal de 6.200 USDT. A sua disponibilidade atual e os termos exatos do voucher da conta requerem confirmação.",
        "fr": "Le guide 2025 décrit un forfait d'une valeur nominale de 6 200 USDT. Sa disponibilité actuelle et les conditions exactes du bon du compte nécessitent une confirmation.",
        "de": "Der Leitfaden für 2025 beschreibt ein Nennwertpaket von 6.200 USDT. Die aktuelle Verfügbarkeit und die genauen Gutscheinbedingungen des Kontos müssen bestätigt werden.",
        "ru": "В справочнике на 2025 год описан пакет номинальной стоимостью 6 200 USDT. Его текущая доступность и точные условия ваучеров требуют подтверждения.",
        "id": "Panduan tahun 2025 menjelaskan paket nilai nominal 6.200 USDT. Ketersediaannya saat ini dan ketentuan voucher akun yang sebenarnya memerlukan konfirmasi.",
        "vi": "Hướng dẫn năm 2025 mô tả gói voucher mệnh giá 6.200 USDT. Tình trạng sẵn có hiện tại và các điều khoản voucher cụ thể của tài khoản cần được xác nhận.",
        "it": "La guida 2025 descrive un pacchetto con valore nominale di 6.200 USDT. La sua disponibilità attuale e i termini esatti del voucher dell'account richiedono conferma.",
        // l10n: needs native review
        "ur": "2025 گائیڈ 6,200 USDT ظاہری مالیت بنڈل بیان کرتی ہے۔ اس کی موجودہ دستیابی اور اکاؤنٹ کی عین واؤچر شرائط کی تصدیق چاہیے۔",
        // l10n: needs native review
        "uk": "Гайд 2025 року описує пакет номінальною вартістю 6,200 USDT. Його поточна доступність і точні ваучер-умови акаунта потребують підтвердження."
      },
      "limitations": {
        "en": "It describes a three-day observation period, then a two-day manual claim window.",
        "zh-Hans": "指南写明三天观察期后，还需在两天内手动领取。",
        "zh-Hant": "指南寫明三天觀察期後，還需在兩天內手動領取。",
        "ja": "これは、3 日間の観察期間と、その後 2 日間の手動請求期間について説明しています。",
        "ko": "3일간의 관찰 기간과 2일간의 직접 청구 기간을 설명합니다.",
        "tr": "Üç günlük bir gözlem periyodunu, ardından iki günlük bir manuel talep penceresini tanımlar.",
        "ar": "ويصف فترة مراقبة مدتها ثلاثة أيام، ثم نافذة مطالبة يدوية مدتها يومين.",
        "es": "Describe un período de observación de tres días y luego un período de reclamo manual de dos días.",
        "pt-BR": "Descreve um período de observação de três dias e, em seguida, uma janela de reclamação manual de dois dias.",
        "fr": "Il décrit une période d'observation de trois jours, puis une fenêtre de réclamation manuelle de deux jours.",
        "de": "Es beschreibt einen dreitägigen Beobachtungszeitraum und dann ein zweitägiges manuelles Anspruchsfenster.",
        "ru": "Он описывает трехдневный период наблюдения, а затем двухдневный период подачи заявок вручную.",
        "id": "Ini menggambarkan periode observasi tiga hari, kemudian jendela klaim manual dua hari.",
        "vi": "Nó mô tả khoảng thời gian quan sát ba ngày, sau đó là khoảng thời gian yêu cầu thủ công kéo dài hai ngày.",
        "it": "Descrive un periodo di osservazione di tre giorni, quindi una finestra di richiesta manuale di due giorni.",
        // l10n: needs native review
        "ur": "یہ تین دن کی مشاہدہ مدت، پھر دو دن کی دستی دعویٰ مدت بیان کرتا ہے۔",
        // l10n: needs native review
        "uk": "Воно описує триденний період спостереження, потім дводенне вікно для подання заявки вручну."
      },
      "publishedDate": {
        "en": "2025-01-23",
        "zh-Hans": "2025-01-23",
        "zh-Hant": "2025-01-23",
        "ja": "2025-01-23",
        "ko": "2025-01-23",
        "tr": "2025-01-23",
        "ar": "2025-01-23",
        "es": "2025-01-23",
        "pt-BR": "23/01/2025",
        "fr": "2025-01-23",
        "de": "23.01.2025",
        "ru": "2025-01-23",
        "id": "23-01-2025",
        "vi": "23-01-2025",
        "it": "23-01-2025",
        // l10n: needs native review
        "ur": "2025-01-23",
        // l10n: needs native review
        "uk": "2025-01-23"
      },
      "datePrecision": {
        "en": "Source date retained as displayed; no missing timezone is inferred.",
        "zh-Hans": "保留来源显示日期，不推断缺失时区。",
        "zh-Hant": "保留來源顯示日期，不推斷缺失時區。",
        "ja": "ソースの日付は表示どおりに保持されます。欠落しているタイムゾーンは推論されません。",
        "ko": "소스 날짜는 표시된 대로 유지됩니다. 누락된 시간대는 유추되지 않습니다.",
        "tr": "Kaynak tarihi görüntülendiği şekilde tutuldu; eksik bir saat diliminin olmadığı anlaşılmaktadır.",
        "ar": "تم الاحتفاظ بتاريخ المصدر كما هو معروض؛ لا يتم استنتاج أي منطقة زمنية مفقودة.",
        "es": "La fecha de origen se conserva tal como se muestra; no se infiere ninguna zona horaria faltante.",
        "pt-BR": "Data de origem mantida conforme exibida; nenhum fuso horário ausente é inferido.",
        "fr": "Date source conservée telle qu'affichée ; aucun fuseau horaire manquant n’est déduit.",
        "de": "Quelldatum wie angezeigt beibehalten; Es wird keine fehlende Zeitzone abgeleitet.",
        "ru": "Исходная дата сохраняется в том виде, в каком она отображается; отсутствие отсутствующего часового пояса не предполагается.",
        "id": "Tanggal sumber dipertahankan seperti yang ditampilkan; tidak ada zona waktu yang hilang yang disimpulkan.",
        "vi": "Ngày nguồn được giữ lại như được hiển thị; không có múi giờ bị thiếu được suy ra.",
        "it": "Data di origine mantenuta come visualizzata; non si deduce alcun fuso orario mancante.",
        // l10n: needs native review
        "ur": "ذریعہ تاریخ جوں کی توں دکھائی گئی برقرار ہے؛ غائب ٹائم زون اخذ نہیں کیا گیا۔",
        // l10n: needs native review
        "uk": "Дату джерела збережено як показано; відсутній часовий пояс не виводиться."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ماخذ قابل اطلاق شناختی تصدیق کا تقاضا قائم نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; порожнє значення не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مہم کی کوئی قطعی مدت تصدیق شدہ نہیں ہے؛ صرف پڑھنے کے قابل صفحہ پیشکش فعال ہونے کو ثابت نہیں کر سکتا۔",
          // l10n: needs native review
          "uk": "Повне абсолютне вікно кампанії не підтверджено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The 2025 guide describes a 6,200 USDT face-value bundle. Its current availability and the account's exact voucher terms require confirmation.",
          "zh-Hans": "2025 年指南描述了面值合计 6,200 USDT 的礼包，当前可用性与账户实际卡券条款仍需确认。",
          "zh-Hant": "2025 年指南描述了面值合計 6,200 USDT 的禮包，目前可用性與帳戶實際卡券條款仍需確認。",
          "ja": "2025 年のガイドでは、額面 6,200 USDT のバンドルについて説明されています。現在の利用可能性とアカウントの正確なバウチャー条件については確認が必要です。",
          "ko": "2025 가이드는 6,200 USDT 액면가 번들을 설명합니다. 현재 이용 가능 여부와 계정의 정확한 바우처 조건을 확인해야 합니다.",
          "tr": "2025 kılavuzunda 6.200 USDT değerinde bir paket açıklanıyor. Mevcut kullanılabilirliği ve hesabın tam kupon koşulları onay gerektirir.",
          "ar": "يصف دليل 2025 حزمة بقيمة اسمية قدرها 6,200 USDT. ويتطلب توفرها الحالي وشروط قسائم الحساب الدقيقة تأكيداً.",
          "es": "La guía 2025 describe un paquete de valor nominal de 6200 USDT. Su disponibilidad actual y los términos exactos del bono de la cuenta requieren confirmación.",
          "pt-BR": "O guia de 2025 descreve um pacote de valor nominal de 6.200 USDT. A sua disponibilidade atual e os termos exatos do voucher da conta requerem confirmação.",
          "fr": "Le guide 2025 décrit un forfait d'une valeur nominale de 6 200 USDT. Sa disponibilité actuelle et les conditions exactes du bon du compte nécessitent une confirmation.",
          "de": "Der Leitfaden für 2025 beschreibt ein Nennwertpaket von 6.200 USDT. Die aktuelle Verfügbarkeit und die genauen Gutscheinbedingungen des Kontos müssen bestätigt werden.",
          "ru": "В справочнике на 2025 год описан пакет номинальной стоимостью 6 200 USDT. Его текущая доступность и точные условия ваучеров требуют подтверждения.",
          "id": "Panduan tahun 2025 menjelaskan paket nilai nominal 6.200 USDT. Ketersediaannya saat ini dan ketentuan voucher akun yang sebenarnya memerlukan konfirmasi.",
          "vi": "Hướng dẫn năm 2025 mô tả gói voucher mệnh giá 6.200 USDT. Tình trạng sẵn có hiện tại và các điều khoản voucher cụ thể của tài khoản cần được xác nhận.",
          "it": "La guida 2025 descrive un pacchetto con valore nominale di 6.200 USDT. La sua disponibilità attuale e i termini esatti del voucher dell'account richiedono conferma.",
          // l10n: needs native review
          "ur": "2025 گائیڈ 6,200 USDT ظاہری مالیت کے بنڈل کو بیان کرتا ہے۔ اس کی موجودہ دستیابی اور اکاؤنٹ کی عین واؤچر شرائط تصدیق چاہتی ہیں۔",
          // l10n: needs native review
          "uk": "Гід 2025 року описує пакет номіналом 6,200 USDT. Його поточна доступність і точні умови ваучерів для акаунта потребують підтвердження."
        }
      ]
    }
  },
  "okx": {
    "summary": {
      "en": "The EEA program assigns offers by account and acquisition channel; depositing alone does not create an entitlement.",
      "zh-Hans": "EEA 计划按账户与来源渠道分配优惠，仅充值不会自动产生奖励资格。",
      "zh-Hant": "EEA 計畫按帳戶與來源管道分配優惠，僅儲值不會自動產生獎勵資格。",
      "ja": "EEA プログラムは、アカウントおよび獲得チャネルごとにオファーを割り当てます。入金するだけでは権利は発生しません。",
      "ko": "EEA 프로그램은 계정 및 획득 채널별로 제안을 할당합니다. 입금만으로는 자격이 부여되지 않습니다.",
      "tr": "AEA programı, teklifleri hesap ve satın alma kanalına göre atar; Tek başına para yatırmak bir hak yaratmaz.",
      "ar": "يقوم برنامج المنطقة الاقتصادية الأوروبية بتعيين العروض حسب الحساب وقناة الاستحواذ؛ الإيداع وحده لا يخلق استحقاقا.",
      "es": "El programa EEE asigna ofertas por cuenta y canal de adquisición; El depósito por sí solo no crea un derecho.",
      "pt-BR": "O programa EEE atribui ofertas por conta e canal de aquisição; o depósito por si só não cria um direito.",
      "fr": "Le programme EEA attribue les offres par compte et canal d'acquisition ; le dépôt à lui seul ne crée pas de droit.",
      "de": "Das EEA-Programm ordnet Angebote nach Konto und Erwerbskanal zu; Allein durch die Hinterlegung entsteht kein Anspruch.",
      "ru": "Программа ЕЭЗ распределяет предложения по аккаунтам и каналам привлечения; внесение депозита само по себе не создает права.",
      "id": "Program EEA memberikan penawaran berdasarkan akun dan saluran akuisisi; menyetor saja tidak menciptakan suatu hak.",
      "vi": "Chương trình EEA chỉ định các ưu đãi theo tài khoản và kênh chuyển đổi; gửi tiền một mình không tạo ra một quyền lợi.",
      "it": "Il programma SEE assegna le offerte per account e canale di acquisizione; il solo deposito non crea un diritto.",
      // l10n: needs native review
      "ur": "EEA پروگرام پیشکشیں کو اکاؤنٹ اور حصول چینل کے لحاظ سے تفویض کرتا ہے کرتا ہے؛ صرف ڈپازٹ کرنے سے حق نہیں بنتی۔",
      // l10n: needs native review
      "uk": "програма EEA призначає пропозиції за акаунтом і канал залучення; сам депозит не створює право."
    },
    "signupReward": {
      "summary": {
        "en": "The EEA FAQ covers crypto, X-Perps vouchers and VIP passes. This is region-specific, not a worldwide welcome offer.",
        "zh-Hans": "EEA FAQ 涵盖加密资产、X-Perps 体验金券与 VIP 体验资格，这是地区性规则，不是全球统一优惠。",
        "zh-Hant": "EEA FAQ 涵蓋加密資產、X-Perps 體驗金券與 VIP 體驗資格，這是地區性規則，不是全球統一優惠。",
        "ja": "EEA FAQ では、暗号通貨、X-Perps バウチャー、VIP パスについて説明しています。これは地域固有のものであり、世界的に歓迎されるオファーではありません。",
        "ko": "EEA FAQ에는 암호화폐, X-Perps 바우처 및 VIP 패스가 포함되어 있습니다. 이는 전 세계적으로 환영받는 제안이 아닌 지역별 제안입니다.",
        "tr": "AEA SSS sayfası; kripto ödüllerini, X-Perps kuponlarını ve VIP statü geçişlerini kapsar. Bu kampanya bölgeye özeldir, küresel bir hoş geldin teklifi değildir.",
        "ar": "تغطي الأسئلة الشائعة في المنطقة الاقتصادية الأوروبية العملات المشفرة وقسائم X-Perps وتذاكر VIP. هذا خاص بمنطقة معينة، وليس عرضًا ترحيبيًا عالميًا.",
        "es": "Las preguntas frecuentes del EEE cubren criptomonedas, vales X-Perps y pases VIP. Esta es una oferta de bienvenida específica de una región, no mundial.",
        "pt-BR": "As perguntas frequentes da EEA abrangem criptomoedas, vouchers X-Perps e passes VIP. Esta é uma oferta específica da região e não uma oferta de boas-vindas mundial.",
        "fr": "La FAQ de l'EEE couvre la cryptographie, les bons X-Perps et les pass VIP. Il s’agit d’une offre de bienvenue spécifique à une région et non à l’échelle mondiale.",
        "de": "Die EEA-FAQ behandelt Krypto, X-Perps-Gutscheine und VIP-Pässe. Dies ist regionalspezifisch und kein weltweites Willkommensangebot.",
        "ru": "Часто задаваемые вопросы ЕЭЗ охватывают криптовалюту, ваучеры X-Perps и VIP-пропуска. Это предложение зависит от региона, а не является глобальным.",
        "id": "FAQ EEA mencakup kripto, voucher X-Perps, dan tiket VIP. Penawaran ini khusus untuk wilayah tertentu, bukan tawaran sambutan di seluruh dunia.",
        "vi": "Câu hỏi thường gặp của EEA bao gồm tiền điện tử, phiếu thưởng X-Perps và thẻ VIP. Đây là ưu đãi dành riêng cho từng khu vực, không phải là ưu đãi chào mừng trên toàn thế giới.",
        "it": "Le domande frequenti dell'EEA riguardano criptovalute, voucher X-Perps e pass VIP. Questa è un'offerta specifica per regione, non un'offerta di benvenuto mondiale.",
        // l10n: needs native review
        "ur": "EEA FAQ کرپٹو، X-Perps واؤچرز اور VIP پاسز کا احاطہ کرتا ہے۔ یہ علاقے سے مخصوص ہے، عالمی استقبالی پیشکش نہیں۔",
        // l10n: needs native review
        "uk": "FAQ для EEA охоплює крипто, ваучери X-Perps і VIP-перепустки. Це регіональна, а не світова вітальна пропозиція."
      },
      "conditions": [
        {
          "en": "Confirm EEA residence support, a new main account, identity checks and the eligible entry channel.",
          "zh-Hans": "确认 EEA 地区支持、新主账户、身份验证及合资格入口渠道。",
          "zh-Hant": "確認 EEA 地區支援、新主帳戶、身分驗證及合資格入口管道。",
          "ja": "EEA 居住サポート、新しいメインアカウント、身元確認、対象となるエントリーチャネルを確認します。",
          "ko": "EEA 거주 지원, 새로운 기본 계정, 신원 확인 및 적격 진입 채널을 확인하세요.",
          "tr": "AEA ikamet desteğini, yeni bir ana hesabı, kimlik kontrollerini ve uygun giriş kanalını onaylayın.",
          "ar": "قم بتأكيد دعم الإقامة في المنطقة الاقتصادية الأوروبية، والحساب الرئيسي الجديد، وعمليات التحقق من الهوية، وقناة الدخول المؤهلة.",
          "es": "Confirme el soporte de residencia del EEE, una nueva cuenta principal, controles de identidad y el canal de entrada elegible.",
          "pt-BR": "Confirme o apoio à residência no EEE, uma nova conta principal, verificações de identidade e o canal de entrada elegível.",
          "fr": "Confirmez l'aide à la résidence dans l'EEE, un nouveau compte principal, les contrôles d'identité et le canal d'entrée éligible.",
          "de": "Bestätigen Sie die EWR-Aufenthaltsunterstützung, ein neues Hauptkonto, Identitätsprüfungen und den berechtigten Einreisekanal.",
          "ru": "Подтвердите поддержку проживания в ЕЭЗ, новый основной счет, проверку личности и соответствующий канал въезда.",
          "id": "Konfirmasikan dukungan tempat tinggal EEA, akun utama baru, pemeriksaan identitas, dan saluran masuk yang memenuhi syarat.",
          "vi": "Xác nhận hỗ trợ cư trú tại EEA, tài khoản chính mới, kiểm tra danh tính và kênh nhập cảnh đủ điều kiện.",
          "it": "Conferma il supporto per la residenza nel SEE, un nuovo account principale, i controlli di identità e il canale di ingresso idoneo.",
          // l10n: needs native review
          "ur": "EEA رہائش کی سپورٹ، نیا مرکزی اکاؤنٹ، شناختی چیکس اور اہل داخلہ چینل کی تصدیق کریں۔",
          // l10n: needs native review
          "uk": "Підтвердьте EEA підтримку резидентства, новий основний акаунт, перевірки особи і придатний канал входу."
        },
        {
          "en": "Use the assigned task thresholds and deadlines; internal transfers do not qualify as eligible deposits.",
          "zh-Hans": "以账户分配的任务门槛和期限为准，内部转账不属于合资格入金。",
          "zh-Hant": "以帳戶分配的任務門檻和期限為準，內部轉帳不屬於合資格入金。",
          "ja": "割り当てられたタスクのしきい値と期限を使用します。内部送金は適格な預金としては認められません。",
          "ko": "할당된 작업 임계값과 마감일을 사용하십시오. 내부 이체는 적격 예금으로 인정되지 않습니다.",
          "tr": "Size atanan görev eşiklerini ve son tarihleri esas alın; dahili transferler geçerli para yatırma işlemi sayılmaz.",
          "ar": "استخدم عتبات المهام المعينة والمواعيد النهائية؛ التحويلات الداخلية لا تعتبر ودائع مؤهلة.",
          "es": "Utilice los umbrales y plazos de tareas asignados; Las transferencias internas no califican como depósitos elegibles.",
          "pt-BR": "Use os limites e prazos de tarefas atribuídos; as transferências internas não se qualificam como depósitos elegíveis.",
          "fr": "Utiliser les seuils et délais de tâches assignés ; les virements internes ne sont pas considérés comme des dépôts éligibles.",
          "de": "Verwenden Sie die zugewiesenen Aufgabenschwellenwerte und Fristen; Interne Überweisungen gelten nicht als zulässige Einlagen.",
          "ru": "Используйте назначенные пороговые значения и сроки выполнения задач; внутренние переводы не квалифицируются как приемлемые депозиты.",
          "id": "Gunakan ambang batas dan tenggat waktu tugas yang ditetapkan; transfer internal tidak memenuhi syarat sebagai simpanan yang memenuhi syarat.",
          "vi": "Sử dụng ngưỡng và thời hạn nhiệm vụ được giao; chuyển khoản nội bộ không đủ điều kiện là tiền gửi đủ điều kiện.",
          "it": "Utilizzare le soglie e le scadenze delle attività assegnate; i trasferimenti interni non si qualificano come depositi ammissibili.",
          // l10n: needs native review
          "ur": "تفویض شدہ کام کی حدیں اور آخری تاریخیں استعمال کریں؛ اندرونی منتقلیاں اہل ڈپازٹس نہیں بنتیں۔",
          // l10n: needs native review
          "uk": "Використовуйте пороги й кінцеві строки призначених завдань; внутрішні перекази не є придатними депозитами."
        },
        {
          "en": "Check channel binding and stacking restrictions before using a different referral or promotion.",
          "zh-Hans": "使用其他邀请或促销前，先核对渠道绑定和优惠叠加限制。",
          "zh-Hant": "使用其他邀請或促銷前，先核對管道綁定和優惠疊加限制。",
          "ja": "別の紹介やプロモーションを使用する前に、チャネル バインディングとスタッキングの制限を確認してください。",
          "ko": "다른 추천이나 프로모션을 사용하기 전에 채널 바인딩 및 스택 제한을 확인하세요.",
          "tr": "Farklı bir yönlendirme veya promosyon kullanmadan önce kanal bağlama ve yığınlama kısıtlamalarını kontrol edin.",
          "ar": "تحقق من قيود ربط القناة وتكديسها قبل استخدام إحالة أو عرض ترويجي مختلف.",
          "es": "Verifique las restricciones de vinculación y acumulación de canales antes de usar una referencia o promoción diferente.",
          "pt-BR": "Verifique as restrições de vinculação e empilhamento do canal antes de usar uma indicação ou promoção diferente.",
          "fr": "Vérifiez les restrictions de liaison de chaîne et de cumul avant d'utiliser une référence ou une promotion différente.",
          "de": "Überprüfen Sie die Kanalbindungs- und Stacking-Einschränkungen, bevor Sie eine andere Empfehlung oder Aktion verwenden.",
          "ru": "Прежде чем использовать другой реферал или рекламную акцию, проверьте привязку канала и ограничения на суммирование.",
          "id": "Periksa batasan pengikatan dan penumpukan saluran sebelum menggunakan rujukan atau promosi lain.",
          "vi": "Kiểm tra các hạn chế ràng buộc và xếp chồng kênh trước khi sử dụng giới thiệu hoặc khuyến mãi khác.",
          "it": "Controlla le limitazioni di associazione e accumulo del canale prima di utilizzare un referral o una promozione diversi.",
          // l10n: needs native review
          "ur": "مختلف ریفرل یا پروموشن استعمال کرنے سے پہلے چینل بندش اور اکٹھا لگانے کی پابندیاں چیک کریں۔",
          // l10n: needs native review
          "uk": "Перед використанням іншого реферал або акцію перевірте прив’язку каналу і обмеження суміщення."
        }
      ]
    },
    "sources": {
      "okx-eea-new-user": {
        "summary": {
          "en": "The page shows 27 August 2026; reward amount and task timing are assigned in the eligible account.",
          "zh-Hans": "页面显示日期为 2026 年 8 月 27 日，奖励金额和任务时间由合资格账户内的优惠决定。",
          "zh-Hant": "頁面顯示日期為 2026 年 8 月 27 日，獎勵金額和任務時間由合資格帳戶內的優惠決定。",
          "ja": "このページには 2026 年 8 月 27 日が表示されています。報酬額とタスクのタイミングは対象アカウントに割り当てられます。",
          "ko": "페이지에는 2026년 8월 27일이 표시되어 있습니다. 보상 금액과 작업 시기는 적격 계정에 할당됩니다.",
          "tr": "Sayfada 27 Ağustos 2026 tarihi gösteriliyor; ödül miktarı ve görev zamanlaması uygun hesaba atanır.",
          "ar": "تظهر الصفحة 27 أغسطس 2026؛ يتم تعيين مبلغ المكافأة وتوقيت المهمة في الحساب المؤهل.",
          "es": "La página muestra el 27 de agosto de 2026; El monto de la recompensa y el tiempo de la tarea se asignan en la cuenta elegible.",
          "pt-BR": "A página mostra 27 de agosto de 2026; o valor da recompensa e o tempo da tarefa são atribuídos na conta elegível.",
          "fr": "La page indique le 27 août 2026 ; le montant de la récompense et le calendrier des tâches sont attribués dans le compte éligible.",
          "de": "Die Seite zeigt den 27. August 2026; Belohnungsbetrag und Aufgabenzeitpunkt werden dem berechtigten Konto zugewiesen.",
          "ru": "На странице указано 27 августа 2026 г.; Сумма вознаграждения и время выполнения задания назначаются в соответствующей учетной записи.",
          "id": "Halaman tersebut menunjukkan 27 Agustus 2026; jumlah hadiah dan waktu tugas ditetapkan di akun yang memenuhi syarat.",
          "vi": "Trang hiển thị ngày 27 tháng 8 năm 2026; số tiền thưởng và thời gian thực hiện nhiệm vụ được chỉ định trong tài khoản đủ điều kiện.",
          "it": "La pagina mostra il 27 agosto 2026; l'importo del premio e la tempistica dell'attività vengono assegnati nell'account idoneo.",
          // l10n: needs native review
          "ur": "صفحہ 27 اگست 2026 دکھاتا ہے؛ انعام رقم اور کام وقت بندی اہل اکاؤنٹ میں تفویض کرتا ہے ہوتے ہیں۔",
          // l10n: needs native review
          "uk": "Сторінка показує 27 серпня 2026 року; сума винагороди та термін виконання завдання призначаються для відповідного акаунта."
        }
      },
      "okx-fet-september": {
        "summary": {
          "en": "The announcement schedules FET/USDT perpetuals for 5 September 2026 at 03:30 UTC on web, app and API. It asks users to confirm regional availability in the app. A published schedule does not prove a current account can trade.",
          "zh-Hans": "公告安排 FET/USDT 永续合约于 2026 年 9 月 5 日 03:30 UTC 在网页、应用与 API 上线，并要求用户在应用内确认地区可用性。公开时间表不能证明当前交易所账户可以交易。",
          "zh-Hant": "公告安排 FET/USDT 永續合約於 2026 年 9 月 5 日 03:30 UTC 在網頁、應用程式與 API 上線，並要求用戶在應用程式內確認地區可用性。公開時間表不能證明目前交易所帳戶可以交易。",
          "ja": "この発表は、FET/USDT 永続先物契約を 2026 年 9 月 5 日 03:30 UTC にウェブ、アプリ、API で提供予定とし、ユーザーにアプリ内で地域ごとの利用可否を確認するよう求めています。公開されたスケジュールは、現在のアカウントで取引できることを証明しません。",
          "ko": "발표는 2026년 9월 5일 03:30 UTC에 웹, 앱 및 API에서 FET/USDT 무기한 계약 제공을 예정하고, 사용자가 앱에서 지역별 이용 가능 여부를 확인하도록 요청합니다. 공개된 일정은 현재 거래소 계정이 거래할 수 있음을 증명하지 않습니다.",
          "tr": "Duyuru, FET/USDT sürekli vadeli sözleşmelerini 5 Eylül 2026 saat 03:30 UTC'de web, uygulama ve API için planlar. Kullanıcılardan uygulamada bölgesel erişimi doğrulamalarını ister. Yayınlanmış bir takvim, mevcut borsa hesabının işlem yapabileceğini kanıtlamaz.",
          "ar": "يحدد الإعلان موعد إدراج عقود FET/USDT الدائمة في 5 سبتمبر 2026 الساعة 03:30 بالتوقيت العالمي المنسق على الويب والتطبيق وواجهة برمجة التطبيقات. ويطلب من المستخدمين تأكيد التوفر الإقليمي داخل التطبيق. لا يثبت الجدول المنشور أن الحساب الحالي لدى منصة التداول يمكنه التداول.",
          "es": "El anuncio programa los contratos perpetuos FET/USDT para el 5 de septiembre de 2026 a las 03:30 UTC en web, app y API. Pide a los usuarios confirmar la disponibilidad regional en la aplicación. Un calendario publicado no prueba que la cuenta de exchange actual pueda operar.",
          "pt-BR": "O anúncio programa os contratos perpétuos FET/USDT para 5 de setembro de 2026 às 03h30 UTC na web, no app e na API. Ele pede aos usuários que confirmem a disponibilidade regional no aplicativo. Um cronograma publicado não prova que a conta atual na exchange possa negociar.",
          "fr": "L'annonce programme les contrats perpétuels FET/USDT pour le 5 septembre 2026 à 03:30 UTC sur le Web, l'application et l'API. Elle demande aux utilisateurs de confirmer la disponibilité régionale dans l'application. Un calendrier publié ne prouve pas que le compte d'échange actuel puisse trader.",
          "de": "Die Ankündigung plant FET/USDT-Perpetual-Kontrakte für den 5. September 2026 um 03:30 UTC im Web, in der App und über die API. Nutzer sollen die regionale Verfügbarkeit in der App bestätigen. Ein veröffentlichter Zeitplan beweist nicht, dass das aktuelle Börsenkonto handeln kann.",
          "ru": "Объявление планирует запуск бессрочных контрактов FET/USDT 5 сентября 2026 года в 03:30 UTC в веб-версии, приложении и API. Пользователей просят подтвердить региональную доступность в приложении. Опубликованное расписание не доказывает, что текущий биржевой аккаунт может торговать.",
          "id": "Pengumuman ini menjadwalkan kontrak perpetual FET/USDT pada 5 September 2026 pukul 03:30 UTC di web, aplikasi, dan API. Pengguna diminta mengonfirmasi ketersediaan regional di aplikasi. Jadwal yang dipublikasikan tidak membuktikan bahwa akun exchange saat ini dapat berdagang.",
          "vi": "Thông báo lên lịch hợp đồng vĩnh viễn FET/USDT vào ngày 5 tháng 9 năm 2026 lúc 03:30 UTC trên web, ứng dụng và API. Người dùng được yêu cầu xác nhận khả năng hỗ trợ theo khu vực trong ứng dụng. Lịch đã công bố không chứng minh tài khoản sàn hiện tại có thể giao dịch.",
          "it": "L'annuncio programma i contratti perpetui FET/USDT per il 5 settembre 2026 alle 03:30 UTC su web, app e API. Chiede agli utenti di confermare la disponibilità regionale nell'app. Un calendario pubblicato non prova che l'account exchange attuale possa fare trading.",
          // l10n: needs native review
          "ur": "اعلان FET/USDT پرپیچوئلز کو 5 ستمبر 2026 کو 03:30 UTC پر ویب، ایپ اور API پر شیڈول کرتا ہے۔ یہ صارفین سے ایپ میں علاقائی دستیابی کی تصدیق کرنے کو کہتا ہے۔ شائع شدہ شیڈول یہ ثابت نہیں کرتا کہ موجودہ اکاؤنٹ ٹریڈ کر سکتا ہے۔",
          // l10n: needs native review
          "uk": "Оголошення планує безстрокові контракти FET/USDT на 5 вересня 2026 року о 03:30 UTC у вебверсії, застосунку й API. Воно просить користувачів підтвердити регіональну доступність у застосунку. Опублікований розклад не доводить, що поточний акаунт може торгувати."
        }
      }
    },
    "evidenceRequirements": {
      "regions": {
        "en": "EEA offer only; country and account eligibility must still be confirmed.",
        "zh-Hans": "仅为 EEA 优惠，仍需确认国家与账户资格。",
        "zh-Hant": "僅為 EEA 優惠，仍需確認國家與帳戶資格。",
        "ja": "EEA のみの提供。国とアカウントの資格を確認する必要があります。",
        "ko": "EEA 제안에만 해당. 국가 및 계정 자격은 여전히 ​​확인되어야 합니다.",
        "tr": "Yalnızca AEA teklifi; ülke ve hesap uygunluğunun yine de doğrulanması gerekir.",
        "ar": "عرض المنطقة الاقتصادية الأوروبية فقط؛ لا يزال يتعين تأكيد أهلية البلد والحساب.",
        "es": "Oferta del EEE únicamente; La elegibilidad del país y de la cuenta aún debe ser confirmada.",
        "pt-BR": "Oferta apenas no EEE; a elegibilidade do país e da conta ainda deve ser confirmada.",
        "fr": "Offre EEE uniquement ; L’éligibilité du pays et du compte doit encore être confirmée.",
        "de": "Nur EWR-Angebot; Die Berechtigung für Land und Konto muss noch bestätigt werden.",
        "ru": "Только предложение ЕЭЗ; Страна и право на участие в учетной записи все равно должны быть подтверждены.",
        "id": "Hanya penawaran EEA; kelayakan negara dan akun masih harus dikonfirmasi.",
        "vi": "Chỉ cung cấp EEA; Tính đủ điều kiện của quốc gia và tài khoản vẫn phải được xác nhận.",
        "it": "Solo offerta SEE; il paese e l'idoneità dell'account devono ancora essere confermati.",
        // l10n: needs native review
        "ur": "صرف EEA پیشکش؛ ملک اور اکاؤنٹ اہلیت پھر بھی تصدیق کریں ہونی چاہیے۔",
        // l10n: needs native review
        "uk": "Пропозиція лише для ЄЕЗ; країну та відповідність акаунта все одно потрібно підтвердити."
      },
      "eligibility": {
        "en": "Confirm EEA residence support, a new main account, identity checks and the eligible entry channel.",
        "zh-Hans": "确认 EEA 地区支持、新主账户、身份验证及合资格入口渠道。",
        "zh-Hant": "確認 EEA 地區支援、新主帳戶、身分驗證及合資格入口管道。",
        "ja": "EEA 居住サポート、新しいメインアカウント、身元確認、対象となるエントリーチャネルを確認します。",
        "ko": "EEA 거주 지원, 새로운 기본 계정, 신원 확인 및 적격 진입 채널을 확인하세요.",
        "tr": "AEA ikamet desteğini, yeni bir ana hesabı, kimlik kontrollerini ve uygun giriş kanalını onaylayın.",
        "ar": "قم بتأكيد دعم الإقامة في المنطقة الاقتصادية الأوروبية، والحساب الرئيسي الجديد، وعمليات التحقق من الهوية، وقناة الدخول المؤهلة.",
        "es": "Confirme el soporte de residencia del EEE, una nueva cuenta principal, controles de identidad y el canal de entrada elegible.",
        "pt-BR": "Confirme o apoio à residência no EEE, uma nova conta principal, verificações de identidade e o canal de entrada elegível.",
        "fr": "Confirmez l'aide à la résidence dans l'EEE, un nouveau compte principal, les contrôles d'identité et le canal d'entrée éligible.",
        "de": "Bestätigen Sie die EWR-Aufenthaltsunterstützung, ein neues Hauptkonto, Identitätsprüfungen und den berechtigten Einreisekanal.",
        "ru": "Подтвердите поддержку проживания в ЕЭЗ, новый основной счет, проверку личности и соответствующий канал въезда.",
        "id": "Konfirmasikan dukungan tempat tinggal EEA, akun utama baru, pemeriksaan identitas, dan saluran masuk yang memenuhi syarat.",
        "vi": "Xác nhận hỗ trợ cư trú tại EEA, tài khoản chính mới, kiểm tra danh tính và kênh nhập cảnh đủ điều kiện.",
        "it": "Conferma il supporto per la residenza nel SEE, un nuovo account principale, i controlli di identità e il canale di ingresso idoneo.",
        // l10n: needs native review
        "ur": "EEA رہائش کی سپورٹ، نیا مرکزی اکاؤنٹ، شناختی چیکس اور اہل داخلہ چینل کی تصدیق کریں۔",
        // l10n: needs native review
        "uk": "Підтвердьте EEA підтримку резидентства, новий основний акаунт, перевірки особи і придатний канал входу."
      },
      "kyc": {
        "en": "Confirm EEA residence support, a new main account, identity checks and the eligible entry channel.",
        "zh-Hans": "确认 EEA 地区支持、新主账户、身份验证及合资格入口渠道。",
        "zh-Hant": "確認 EEA 地區支援、新主帳戶、身分驗證及合資格入口管道。",
        "ja": "EEA 居住サポート、新しいメインアカウント、身元確認、対象となるエントリーチャネルを確認します。",
        "ko": "EEA 거주 지원, 새로운 기본 계정, 신원 확인 및 적격 진입 채널을 확인하세요.",
        "tr": "AEA ikamet desteğini, yeni bir ana hesabı, kimlik kontrollerini ve uygun giriş kanalını onaylayın.",
        "ar": "قم بتأكيد دعم الإقامة في المنطقة الاقتصادية الأوروبية، والحساب الرئيسي الجديد، وعمليات التحقق من الهوية، وقناة الدخول المؤهلة.",
        "es": "Confirme el soporte de residencia del EEE, una nueva cuenta principal, controles de identidad y el canal de entrada elegible.",
        "pt-BR": "Confirme o apoio à residência no EEE, uma nova conta principal, verificações de identidade e o canal de entrada elegível.",
        "fr": "Confirmez l'aide à la résidence dans l'EEE, un nouveau compte principal, les contrôles d'identité et le canal d'entrée éligible.",
        "de": "Bestätigen Sie die EWR-Aufenthaltsunterstützung, ein neues Hauptkonto, Identitätsprüfungen und den berechtigten Einreisekanal.",
        "ru": "Подтвердите поддержку проживания в ЕЭЗ, новый основной счет, проверку личности и соответствующий канал въезда.",
        "id": "Konfirmasikan dukungan tempat tinggal EEA, akun utama baru, pemeriksaan identitas, dan saluran masuk yang memenuhi syarat.",
        "vi": "Xác nhận hỗ trợ cư trú tại EEA, tài khoản chính mới, kiểm tra danh tính và kênh nhập cảnh đủ điều kiện.",
        "it": "Conferma il supporto per la residenza nel SEE, un nuovo account principale, i controlli di identità e il canale di ingresso idoneo.",
        // l10n: needs native review
        "ur": "EEA رہائش حمایت، نیا مرکزی اکاؤنٹ، شناخت چیک اور اہل داخلہ چینل کی تصدیق کریں۔",
        // l10n: needs native review
        "uk": "Підтвердьте підтримку резидентства в ЄЕЗ, новий основний акаунт, перевірку особи та відповідний канал реєстрації."
      },
      "deposit": {
        "en": "Use the assigned task thresholds and deadlines; internal transfers do not qualify as eligible deposits.",
        "zh-Hans": "以账户分配的任务门槛和期限为准，内部转账不属于合资格入金。",
        "zh-Hant": "以帳戶分配的任務門檻和期限為準，內部轉帳不屬於合資格入金。",
        "ja": "割り当てられたタスクのしきい値と期限を使用します。内部送金は適格な預金としては認められません。",
        "ko": "할당된 작업 임계값과 마감일을 사용하십시오. 내부 이체는 적격 예금으로 인정되지 않습니다.",
        "tr": "Size atanan görev eşiklerini ve son tarihleri esas alın; dahili transferler geçerli para yatırma işlemi sayılmaz.",
        "ar": "استخدم عتبات المهام المعينة والمواعيد النهائية؛ التحويلات الداخلية لا تعتبر ودائع مؤهلة.",
        "es": "Utilice los umbrales y plazos de tareas asignados; Las transferencias internas no califican como depósitos elegibles.",
        "pt-BR": "Use os limites e prazos de tarefas atribuídos; as transferências internas não se qualificam como depósitos elegíveis.",
        "fr": "Utiliser les seuils et délais de tâches assignés ; les virements internes ne sont pas considérés comme des dépôts éligibles.",
        "de": "Verwenden Sie die zugewiesenen Aufgabenschwellenwerte und Fristen; Interne Überweisungen gelten nicht als zulässige Einlagen.",
        "ru": "Используйте назначенные пороговые значения и сроки выполнения задач; внутренние переводы не квалифицируются как приемлемые депозиты.",
        "id": "Gunakan ambang batas dan tenggat waktu tugas yang ditetapkan; transfer internal tidak memenuhi syarat sebagai simpanan yang memenuhi syarat.",
        "vi": "Sử dụng ngưỡng và thời hạn nhiệm vụ được giao; chuyển khoản nội bộ không đủ điều kiện là tiền gửi đủ điều kiện.",
        "it": "Utilizzare le soglie e le scadenze delle attività assegnate; i trasferimenti interni non si qualificano come depositi ammissibili.",
        // l10n: needs native review
        "ur": "تفویض شدہ کام کی حدیں اور آخری تاریخیں استعمال کریں؛ اندرونی منتقلیاں اہل ڈپازٹس کے طور پر اہل ہونا نہیں کرتے۔",
        // l10n: needs native review
        "uk": "Використовуйте пороги й кінцеві строки призначених завдань; внутрішні перекази не є придатними депозитами."
      },
      "trading": {
        "en": "Use the assigned task thresholds and deadlines; internal transfers do not qualify as eligible deposits.",
        "zh-Hans": "以账户分配的任务门槛和期限为准，内部转账不属于合资格入金。",
        "zh-Hant": "以帳戶分配的任務門檻和期限為準，內部轉帳不屬於合資格入金。",
        "ja": "割り当てられたタスクのしきい値と期限を使用します。内部送金は適格な預金としては認められません。",
        "ko": "할당된 작업 임계값과 마감일을 사용하십시오. 내부 이체는 적격 예금으로 인정되지 않습니다.",
        "tr": "Size atanan görev eşiklerini ve son tarihleri esas alın; dahili transferler geçerli para yatırma işlemi sayılmaz.",
        "ar": "استخدم عتبات المهام المعينة والمواعيد النهائية؛ التحويلات الداخلية لا تعتبر ودائع مؤهلة.",
        "es": "Utilice los umbrales y plazos de tareas asignados; Las transferencias internas no califican como depósitos elegibles.",
        "pt-BR": "Use os limites e prazos de tarefas atribuídos; as transferências internas não se qualificam como depósitos elegíveis.",
        "fr": "Utiliser les seuils et délais de tâches assignés ; les virements internes ne sont pas considérés comme des dépôts éligibles.",
        "de": "Verwenden Sie die zugewiesenen Aufgabenschwellenwerte und Fristen; Interne Überweisungen gelten nicht als zulässige Einlagen.",
        "ru": "Используйте назначенные пороговые значения и сроки выполнения задач; внутренние переводы не квалифицируются как приемлемые депозиты.",
        "id": "Gunakan ambang batas dan tenggat waktu tugas yang ditetapkan; transfer internal tidak memenuhi syarat sebagai simpanan yang memenuhi syarat.",
        "vi": "Sử dụng ngưỡng và thời hạn nhiệm vụ được giao; chuyển khoản nội bộ không đủ điều kiện là tiền gửi đủ điều kiện.",
        "it": "Utilizzare le soglie e le scadenze delle attività assegnate; i trasferimenti interni non si qualificano come depositi ammissibili.",
        // l10n: needs native review
        "ur": "تفویض شدہ کام کی حدیں اور آخری تاریخیں استعمال کریں؛ اندرونی منتقلیاں اہل ڈپازٹس نہیں بنتیں۔",
        // l10n: needs native review
        "uk": "Використовуйте пороги й кінцеві строки призначених завдань; внутрішні перекази не є придатними депозитами."
      },
      "rewardType": {
        "en": "Crypto, trading voucher or VIP pass",
        "zh-Hans": "加密资产、交易体验金券或 VIP 体验资格",
        "zh-Hant": "加密資產、交易體驗金券或 VIP 體驗資格",
        "ja": "暗号通貨、トレーディングバウチャーまたはVIPパス",
        "ko": "암호화폐, 거래 바우처 또는 VIP 패스",
        "tr": "Kripto, işlem kuponu veya VIP statü geçişi",
        "ar": "التشفير أو قسيمة التداول أو بطاقة VIP",
        "es": "Cripto, vale comercial o pase VIP",
        "pt-BR": "Criptomoeda, voucher comercial ou passe VIP",
        "fr": "Crypto, bon de trading ou pass VIP",
        "de": "Krypto, Handelsgutschein oder VIP-Pass",
        "ru": "Криптовалюта, торговый ваучер или VIP-пропуск",
        "id": "Kripto, voucher perdagangan, atau tiket VIP",
        "vi": "Tiền mã hóa, voucher giao dịch hoặc thẻ VIP",
        "it": "Criptovalute, voucher di trading o pass VIP",
        // l10n: needs native review
        "ur": "کرپٹو، ٹریڈنگ واؤچر یا VIP پاس",
        // l10n: needs native review
        "uk": "Криптовалюта, торговий ваучер або VIP-перепустка"
      },
      "limitations": {
        "en": "Check channel binding and stacking restrictions before using a different referral or promotion.",
        "zh-Hans": "使用其他邀请或促销前，先核对渠道绑定和优惠叠加限制。",
        "zh-Hant": "使用其他邀請或促銷前，先核對管道綁定和優惠疊加限制。",
        "ja": "別の紹介やプロモーションを使用する前に、チャネル バインディングとスタッキングの制限を確認してください。",
        "ko": "다른 추천이나 프로모션을 사용하기 전에 채널 바인딩 및 스택 제한을 확인하세요.",
        "tr": "Farklı bir yönlendirme veya promosyon kullanmadan önce kanal bağlama ve yığınlama kısıtlamalarını kontrol edin.",
        "ar": "تحقق من قيود ربط القناة وتكديسها قبل استخدام إحالة أو عرض ترويجي مختلف.",
        "es": "Verifique las restricciones de vinculación y acumulación de canales antes de usar una referencia o promoción diferente.",
        "pt-BR": "Verifique as restrições de vinculação e empilhamento do canal antes de usar uma indicação ou promoção diferente.",
        "fr": "Vérifiez les restrictions de liaison de chaîne et de cumul avant d'utiliser une référence ou une promotion différente.",
        "de": "Überprüfen Sie die Kanalbindungs- und Stacking-Einschränkungen, bevor Sie eine andere Empfehlung oder Aktion verwenden.",
        "ru": "Прежде чем использовать другой реферал или рекламную акцию, проверьте привязку канала и ограничения на суммирование.",
        "id": "Periksa batasan pengikatan dan penumpukan saluran sebelum menggunakan rujukan atau promosi lain.",
        "vi": "Kiểm tra các hạn chế ràng buộc và xếp chồng kênh trước khi sử dụng giới thiệu hoặc khuyến mãi khác.",
        "it": "Controlla le limitazioni di associazione e accumulo del canale prima di utilizzare un referral o una promozione diversi.",
        // l10n: needs native review
        "ur": "مختلف ریفرل یا پروموشن استعمال کرنے سے پہلے چینل بائنڈنگ اور اکٹھا کرنے پابندیاں چیک کریں۔",
        // l10n: needs native review
        "uk": "Перевірте прив’язку каналу та обмеження на суміщення перед використанням іншого реферального посилання чи промоакції."
      },
      "publishedDate": {
        "en": "2026-08-27",
        "zh-Hans": "2026-08-27",
        "zh-Hant": "2026-08-27",
        "ja": "2026-08-27",
        "ko": "2026-08-27",
        "tr": "2026-08-27",
        "ar": "2026-08-27",
        "es": "2026-08-27",
        "pt-BR": "27/08/2026",
        "fr": "2026-08-27",
        "de": "27.08.2026",
        "ru": "2026-08-27",
        "id": "27-08-2026",
        "vi": "27-08-2026",
        "it": "2026-08-27",
        // l10n: needs native review
        "ur": "2026-08-27",
        // l10n: needs native review
        "uk": "2026-08-27"
      },
      "datePrecision": {
        "en": "Source date retained as displayed; no missing timezone is inferred.",
        "zh-Hans": "保留来源显示日期，不推断缺失时区。",
        "zh-Hant": "保留來源顯示日期，不推斷缺失時區。",
        "ja": "ソースの日付は表示どおりに保持されます。欠落しているタイムゾーンは推論されません。",
        "ko": "소스 날짜는 표시된 대로 유지됩니다. 누락된 시간대는 유추되지 않습니다.",
        "tr": "Kaynak tarihi görüntülendiği şekilde tutuldu; eksik bir saat diliminin olmadığı anlaşılmaktadır.",
        "ar": "تم الاحتفاظ بتاريخ المصدر كما هو معروض؛ لا يتم استنتاج أي منطقة زمنية مفقودة.",
        "es": "La fecha de origen se conserva tal como se muestra; no se infiere ninguna zona horaria faltante.",
        "pt-BR": "Data de origem mantida conforme exibida; nenhum fuso horário ausente é inferido.",
        "fr": "Date source conservée telle qu'affichée ; aucun fuseau horaire manquant n’est déduit.",
        "de": "Quelldatum wie angezeigt beibehalten; Es wird keine fehlende Zeitzone abgeleitet.",
        "ru": "Исходная дата сохраняется в том виде, в каком она отображается; отсутствие отсутствующего часового пояса не предполагается.",
        "id": "Tanggal sumber dipertahankan seperti yang ditampilkan; tidak ada zona waktu yang hilang yang disimpulkan.",
        "vi": "Ngày nguồn được giữ lại như được hiển thị; không có múi giờ bị thiếu được suy ra.",
        "it": "Data di origine mantenuta come visualizzata; non si deduce alcun fuso orario mancante.",
        // l10n: needs native review
        "ur": "ماخذ تاریخ جیسے دکھائی گئی ویسے رکھی گئی؛ غائب وقت زون اخذ نہیں کیا گیا۔",
        // l10n: needs native review
        "uk": "Дату джерела збережено так, як показано; відсутній часовий пояс не виводиться."
      },
      "gaps": [
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The EEA FAQ covers crypto, X-Perps vouchers and VIP passes. This is region-specific, not a worldwide welcome offer.",
          "zh-Hans": "EEA FAQ 涵盖加密资产、X-Perps 体验金券与 VIP 体验资格，这是地区性规则，不是全球统一优惠。",
          "zh-Hant": "EEA FAQ 涵蓋加密資產、X-Perps 體驗金券與 VIP 體驗資格，這是地區性規則，不是全球統一優惠。",
          "ja": "EEA FAQ では、暗号通貨、X-Perps バウチャー、VIP パスについて説明しています。これは地域固有のものであり、世界的に歓迎されるオファーではありません。",
          "ko": "EEA FAQ에는 암호화폐, X-Perps 바우처 및 VIP 패스가 포함되어 있습니다. 이는 전 세계적으로 환영받는 제안이 아닌 지역별 제안입니다.",
          "tr": "AEA SSS sayfası; kripto ödüllerini, X-Perps kuponlarını ve VIP statü geçişlerini kapsar. Bu kampanya bölgeye özeldir, küresel bir hoş geldin teklifi değildir.",
          "ar": "تغطي الأسئلة الشائعة في المنطقة الاقتصادية الأوروبية العملات المشفرة وقسائم X-Perps وتذاكر VIP. هذا خاص بمنطقة معينة، وليس عرضًا ترحيبيًا عالميًا.",
          "es": "Las preguntas frecuentes del EEE cubren criptomonedas, vales X-Perps y pases VIP. Esta es una oferta de bienvenida específica de una región, no mundial.",
          "pt-BR": "As perguntas frequentes da EEA abrangem criptomoedas, vouchers X-Perps e passes VIP. Esta é uma oferta específica da região e não uma oferta de boas-vindas mundial.",
          "fr": "La FAQ de l'EEE couvre la cryptographie, les bons X-Perps et les pass VIP. Il s’agit d’une offre de bienvenue spécifique à une région et non à l’échelle mondiale.",
          "de": "Die EEA-FAQ behandelt Krypto, X-Perps-Gutscheine und VIP-Pässe. Dies ist regionalspezifisch und kein weltweites Willkommensangebot.",
          "ru": "Часто задаваемые вопросы ЕЭЗ охватывают криптовалюту, ваучеры X-Perps и VIP-пропуска. Это предложение зависит от региона, а не является глобальным.",
          "id": "FAQ EEA mencakup kripto, voucher X-Perps, dan tiket VIP. Penawaran ini khusus untuk wilayah tertentu, bukan tawaran sambutan di seluruh dunia.",
          "vi": "Câu hỏi thường gặp của EEA bao gồm tiền điện tử, phiếu thưởng X-Perps và thẻ VIP. Đây là ưu đãi dành riêng cho từng khu vực, không phải là ưu đãi chào mừng trên toàn thế giới.",
          "it": "Le domande frequenti dell'EEA riguardano criptovalute, voucher X-Perps e pass VIP. Questa è un'offerta specifica per regione, non un'offerta di benvenuto mondiale.",
          // l10n: needs native review
          "ur": "EEA FAQ کرپٹو، X-Perps واؤچرز اور VIP پاسز کا احاطہ کرتا ہے۔ یہ علاقے سے مخصوص ہے، عالمی استقبالی پیشکش نہیں۔",
          // l10n: needs native review
          "uk": "FAQ для EEA охоплює крипто, ваучери X-Perps і VIP-перепустки. Це регіональна, а не глобальна вітальна пропозиція."
        }
      ]
    }
  },
  "kraken": {
    "summary": {
      "en": "Kraken Pro referrals require an app-specific eligible path; the public page contains inconsistent reward amounts.",
      "zh-Hans": "Kraken Pro 邀请需走合资格应用内路径，公开页面对奖励金额的描述存在冲突。",
      "zh-Hant": "Kraken Pro 邀請需走合資格應用程式內路徑，公開頁面對獎勵金額的描述存在衝突。",
      "ja": "Kraken Pro の紹介には、アプリ固有の適格なパスが必要です。公開ページには一貫性のない報酬額が含まれています。",
      "ko": "Kraken Pro 추천에는 앱별 적격 경로가 필요합니다. 공개 페이지에 일관되지 않은 보상 금액이 포함되어 있습니다.",
      "tr": "Kraken Pro yönlendirmeleri, uygulamaya özel uygun bir yol gerektirir; genel sayfa tutarsız ödül miktarları içeriyor.",
      "ar": "تتطلب إحالات Kraken Pro مسارًا مؤهلاً خاصًا بالتطبيق؛ تحتوي الصفحة العامة على مبالغ مكافآت غير متناسقة.",
      "es": "Las referencias de Kraken Pro requieren una ruta elegible específica de la aplicación; la página pública contiene cantidades de recompensa inconsistentes.",
      "pt-BR": "As indicações do Kraken Pro exigem um caminho qualificado específico do aplicativo; a página pública contém valores de recompensa inconsistentes.",
      "fr": "Les références Kraken Pro nécessitent un chemin éligible spécifique à l'application ; la page publique contient des montants de récompense incohérents.",
      "de": "Für Kraken Pro-Empfehlungen ist ein App-spezifischer berechtigter Pfad erforderlich. Die öffentliche Seite enthält inkonsistente Prämienbeträge.",
      "ru": "Для рефералов Kraken Pro требуется соответствующий путь, соответствующий конкретному приложению; общедоступная страница содержит противоречивые суммы вознаграждений.",
      "id": "Rujukan Kraken Pro memerlukan jalur khusus aplikasi yang memenuhi syarat; halaman publik berisi jumlah hadiah yang tidak konsisten.",
      "vi": "Các lượt giới thiệu Kraken Pro yêu cầu một đường dẫn đủ điều kiện dành riêng cho ứng dụng; trang công khai chứa số tiền thưởng không nhất quán.",
      "it": "I referral Kraken Pro richiedono un percorso idoneo specifico per l'app; la pagina pubblica contiene importi di ricompensa incoerenti.",
      // l10n: needs native review
      "ur": "Kraken Pro ریفرلز کے لیے ایپ کا مخصوص اہل راستہ چاہیے؛ عوامی صفحے پر انعامی رقوم میں تضاد ہے۔",
      // l10n: needs native review
      "uk": "Реферали Kraken Pro потребують придатного маршруту в конкретному застосунку; публічна сторінка містить суперечливі суми винагород."
    },
    "signupReward": {
      "summary": {
        "en": "The heading says up to $200 while the FAQ describes a fixed 20 in the default currency. No common amount should be advertised until resolved.",
        "zh-Hans": "标题写最高 $200，FAQ 又写默认货币固定 20；在冲突解决前不展示统一奖励金额。",
        "zh-Hant": "標題寫最高 $200，FAQ 又寫預設貨幣固定 20；在衝突解決前不展示統一獎勵金額。",
        "ja": "見出しには最大 $200 とありますが、FAQ ではデフォルト通貨で固定 20 と説明されています。解決されるまでは、共通の金額を表示すべきではありません。",
        "ko": "제목에는 최대 $200라고 되어 있지만 FAQ에는 기본 통화 기준 고정 20이라고 설명되어 있습니다. 충돌이 해결될 때까지 공통 금액을 표시해서는 안 됩니다.",
        "tr": "Başlık 200$'a kadar derken, SSS varsayılan para biriminde sabit 20 tutarını açıklar. Çelişki çözülene kadar ortak bir tutar duyurulmamalıdır.",
        "ar": "يقول العنوان ما يصل إلى 200$، بينما تصف الأسئلة الشائعة مبلغ 20 ثابتًا بالعملة الافتراضية. لا ينبغي عرض مبلغ موحد حتى يتم حسم التعارض.",
        "es": "El título dice hasta $200, mientras que las preguntas frecuentes describen un valor fijo de 20 en la moneda predeterminada. No debe anunciarse una cantidad común hasta que se resuelva la discrepancia.",
        "pt-BR": "O título indica até US$ 200, enquanto o FAQ descreve um valor fixo de 20 na moeda padrão. Nenhum valor comum deve ser anunciado até que a divergência seja resolvida.",
        "fr": "Le titre indique jusqu'à 200 $, tandis que la FAQ décrit un montant fixe de 20 dans la devise par défaut. Aucun montant commun ne doit être annoncé tant que l'écart n'est pas résolu.",
        "de": "Die Überschrift nennt bis zu 200 $, während die FAQ einen festen Betrag von 20 in der Standardwährung beschreibt. Bis zur Klärung sollte kein einheitlicher Betrag beworben werden.",
        "ru": "В заголовке указано до 200 $, тогда как FAQ описывает фиксированные 20 в валюте по умолчанию. До разрешения расхождения не следует указывать единый размер вознаграждения.",
        "id": "Judul menyebut hingga $200, sedangkan FAQ menjelaskan angka tetap 20 dalam mata uang default. Tidak ada jumlah umum yang boleh dipromosikan sampai perbedaan ini diselesaikan.",
        "vi": "Tiêu đề ghi tối đa $200, trong khi FAQ mô tả mức cố định 20 theo loại tiền mặc định. Không nên công bố một số tiền chung cho đến khi điểm này được làm rõ.",
        "it": "Il titolo indica fino a 200 $, mentre le FAQ descrivono un importo fisso di 20 nella valuta predefinita. Nessun importo comune dovrebbe essere pubblicizzato finché la discrepanza non viene risolta.",
        // l10n: needs native review
        "ur": "سرخی زیادہ سے زیادہ $200 کہتی ہے جبکہ FAQ طے شدہ کرنسی میں مقررہ 20 بیان کرتا ہے۔ حل ہونے تک کوئی مشترک رقم مشتہر نہیں کرنی چاہیے۔",
        // l10n: needs native review
        "uk": "Заголовок каже до $200, тоді як FAQ описує фіксовані 20 у базовій валюті. Поки це не вирішено, не слід рекламувати жодну спільну суму."
      },
      "conditions": [
        {
          "en": "The friend must be new to Kraken, verified, and use the referral during account creation.",
          "zh-Hans": "好友须为 Kraken 新用户、完成验证，并在创建账户时使用邀请。",
          "zh-Hant": "好友須為 Kraken 新用戶、完成驗證，並在建立帳戶時使用邀請。",
          "ja": "友人は Kraken を初めて使用し、認証済みで、アカウント作成時に紹介を使用する必要があります。",
          "ko": "친구는 Kraken을 처음 사용하고 인증을 받아야 하며 계정 생성 시 추천을 사용해야 합니다.",
          "tr": "Arkadaşın Kraken'de yeni olması, doğrulanmış olması ve hesap oluşturma sırasında yönlendirmeyi kullanması gerekir.",
          "ar": "يجب أن يكون الصديق جديدًا في Kraken، وتم التحقق منه، ويستخدم الإحالة أثناء إنشاء الحساب.",
          "es": "El amigo debe ser nuevo en Kraken, estar verificado y utilizar la referencia durante la creación de la cuenta.",
          "pt-BR": "O amigo deve ser novo no Kraken, verificado e usar a indicação durante a criação da conta.",
          "fr": "L'ami doit être nouveau sur Kraken, vérifié et utiliser la référence lors de la création du compte.",
          "de": "Der Freund muss neu bei Kraken sein, verifiziert sein und die Empfehlung bei der Kontoerstellung verwenden.",
          "ru": "Приглашенный пользователь должен быть новым клиентом Kraken, пройти верификацию и применить реферальный код при регистрации.",
          "id": "Teman tersebut harus baru mengenal Kraken, terverifikasi, dan menggunakan referensi selama pembuatan akun.",
          "vi": "Người được giới thiệu phải là người dùng mới trên Kraken, đã hoàn tất xác minh và áp dụng mã giới thiệu khi tạo tài khoản.",
          "it": "L'amico deve essere nuovo su Kraken, verificato e utilizzare il referral durante la creazione dell'account.",
          // l10n: needs native review
          "ur": "دوست کو Kraken کے لیے نیا، تصدیق شدہ ہونا چاہیے اور اکاؤنٹ بناتے وقت کے دوران ریفرل استعمال کرنا چاہیے۔",
          // l10n: needs native review
          "uk": "Друг має бути новим для Kraken, верифікованим і використати реферал під час створення акаунта."
        },
        {
          "en": "Meet the app's fiat-deposit and trading requirements within 30 days; card deposits are excluded in these terms.",
          "zh-Hans": "三十天内完成应用内要求的法币入金与交易；该条款不计入银行卡入金。",
          "zh-Hant": "三十天內完成應用程式要求的法幣入金與交易；該條款不計入銀行卡入金。",
          "ja": "30 日以内にアプリの法定通貨入金および取引要件を満たす。カードでの入金は本規約では除外されます。",
          "ko": "30일 이내에 앱의 법정화폐 입금 및 거래 요구 사항을 충족하세요. 본 약관에서는 카드 예금은 제외됩니다.",
          "tr": "Uygulamanın fiat para yatırma ve ticaret gereksinimlerini 30 gün içinde karşılayın; Kartla yapılan para yatırma işlemleri bu şartlara dahil değildir.",
          "ar": "تلبية متطلبات الإيداع والتداول الخاصة بالتطبيق في غضون 30 يومًا؛ يتم استبعاد ودائع البطاقة في هذه الشروط.",
          "es": "Cumpla con los requisitos comerciales y de depósito fiduciario de la aplicación dentro de los 30 días; Los depósitos con tarjeta quedan excluidos en estos términos.",
          "pt-BR": "Atenda aos requisitos de negociação e depósito fiduciário do aplicativo em 30 dias; depósitos com cartão estão excluídos nestes termos.",
          "fr": "Répondez aux exigences de dépôt et de négociation fiduciaires de l'application dans les 30 jours ; les dépôts par carte sont exclus dans ces conditions.",
          "de": "Erfüllen Sie die Fiat-Einzahlungs- und Handelsanforderungen der App innerhalb von 30 Tagen; Karteneinzahlungen sind in diesen Bedingungen ausgeschlossen.",
          "ru": "Выполните требования приложения к депозитам и торговле в течение 30 дней; Депозиты по картам исключены из этих условий.",
          "id": "Memenuhi persyaratan deposit fiat dan perdagangan aplikasi dalam waktu 30 hari; setoran kartu tidak termasuk dalam ketentuan ini.",
          "vi": "Đáp ứng các yêu cầu giao dịch và tiền gửi fiat của ứng dụng trong vòng 30 ngày; tiền gửi bằng thẻ được loại trừ trong các điều khoản này.",
          "it": "Soddisfare i requisiti di deposito e trading fiat dell'app entro 30 giorni; i depositi con carta sono esclusi in questi termini.",
          // l10n: needs native review
          "ur": "ایپ کی فیاٹ ڈپازٹ اور ٹریڈنگ تقاضے کو 30 دن کے اندر پورا کریں؛ کارڈ ڈپازٹس ان شرائط میں خارج ہیں۔",
          // l10n: needs native review
          "uk": "Виконайте фіатний депозит і торгівля вимоги застосунку протягом 30 днів; картка депозити за цими умовами виключені."
        },
        {
          "en": "Verify supported countries and the same-country or eligible EEA cross-country rule.",
          "zh-Hans": "核对支持国家，以及同国或合资格 EEA 跨国邀请规则。",
          "zh-Hant": "核對支援國家，以及同國或合資格 EEA 跨國邀請規則。",
          "ja": "サポートされている国と、同じ国または対象となる EEA クロスカントリー ルールを確認します。",
          "ko": "지원되는 국가와 동일 국가 또는 적격 EEA 국가 간 규칙을 확인하세요.",
          "tr": "Desteklenen ülkeleri ve aynı ülke veya uygun AEA ülkeler arası kuralını doğrulayın.",
          "ar": "تحقق من البلدان المدعومة ونفس البلد أو قاعدة المنطقة الاقتصادية الأوروبية المؤهلة عبر البلاد.",
          "es": "Verifique los países admitidos y la regla entre países del mismo país o del EEE elegible.",
          "pt-BR": "Verifique os países suportados e a regra entre países do mesmo país ou do EEE elegível.",
          "fr": "Vérifiez les pays pris en charge et la règle internationale du même pays ou de l'EEE éligible.",
          "de": "Überprüfen Sie die unterstützten Länder und die Regel für das gleiche Land oder die zulässige EWR-übergreifende Regel.",
          "ru": "Проверьте поддерживаемые страны и правила для той же страны или приемлемого межстранового правила ЕЭЗ.",
          "id": "Verifikasi negara yang didukung dan aturan lintas negara EEA yang sama atau yang memenuhi syarat.",
          "vi": "Xác minh các quốc gia được hỗ trợ và quy tắc xuyên quốc gia cùng quốc gia hoặc EEA đủ điều kiện.",
          "it": "Verifica i paesi supportati e la regola transnazionale dello stesso paese o del SEE idoneo.",
          // l10n: needs native review
          "ur": "حمایت یافتہ ممالک اور اسی ملک یا اہل EEA بین ملکی قاعدہ کی تصدیق کریں۔",
          // l10n: needs native review
          "uk": "Перевірте підтримувані країни і та сама країна або придатне міжкраїнне правило EEA."
        }
      ]
    },
    "sources": {
      "kraken-pro-referrals": {
        "summary": {
          "en": "Page update shown: 8 May 2026. The amount conflict is preserved as an unresolved source issue.",
          "zh-Hans": "页面显示更新于 2026 年 5 月 8 日；金额冲突作为未解决来源问题保留。",
          "zh-Hant": "頁面顯示更新於 2026 年 5 月 8 日；金額衝突作為未解決來源問題保留。",
          "ja": "表示されるページ更新日: 2026 年 5 月 8 日。金額の競合は未解決のソース問題として保存されます。",
          "ko": "표시된 페이지 업데이트: 2026년 5월 8일. 금액 충돌은 해결되지 않은 소스 문제로 보존됩니다.",
          "tr": "Gösterilen sayfa güncellemesi: 8 Mayıs 2026. Tutar anlaşmazlığı, çözülmemiş bir kaynak sorunu olarak korunuyor.",
          "ar": "تم عرض تحديث الصفحة: 8 مايو 2026. يتم الاحتفاظ بتعارض المبلغ باعتباره مشكلة مصدر لم يتم حلها.",
          "es": "Actualización de página mostrada: 8 de mayo de 2026. El conflicto de cantidad se conserva como un problema de fuente no resuelto.",
          "pt-BR": "Atualização da página mostrada: 8 de maio de 2026. O conflito de valor é preservado como um problema de origem não resolvido.",
          "fr": "Mise à jour de la page affichée : 8 mai 2026. Le conflit de montant est conservé en tant que problème source non résolu.",
          "de": "Angezeigte Seitenaktualisierung: 8. Mai 2026. Der Mengenkonflikt bleibt als ungelöstes Quellenproblem erhalten.",
          "ru": "Показано обновление страницы: 8 мая 2026 г. Конфликт сумм сохраняется как нерешенная проблема источника.",
          "id": "Pembaruan halaman ditampilkan: 8 Mei 2026. Jumlah konflik dipertahankan sebagai sumber masalah yang belum terselesaikan.",
          "vi": "Cập nhật trang được hiển thị: ngày 8 tháng 5 năm 2026. Xung đột về số lượng được giữ nguyên dưới dạng vấn đề nguồn chưa được giải quyết.",
          "it": "Aggiornamento della pagina visualizzato: 8 maggio 2026. Il conflitto sull'importo viene mantenuto come problema di origine irrisolto.",
          // l10n: needs native review
          "ur": "صفحہ اپ ڈیٹ دکھائی گئی: 8 مئی 2026۔ رقم کا تضاد کو غیر حل شدہ ماخذ مسئلہ کے طور پر برقرار رکھا گیا ہے۔",
          // l10n: needs native review
          "uk": "Показано оновлення сторінки: 8 травня 2026 року. Розбіжність щодо суми збережено як невирішене питання джерела."
        }
      }
    },
    "evidenceRequirements": {
      "regions": {
        "en": "Verify supported countries and the same-country or eligible EEA cross-country rule.",
        "zh-Hans": "核对支持国家，以及同国或合资格 EEA 跨国邀请规则。",
        "zh-Hant": "核對支援國家，以及同國或合資格 EEA 跨國邀請規則。",
        "ja": "サポートされている国と、同じ国または対象となる EEA クロスカントリー ルールを確認します。",
        "ko": "지원되는 국가와 동일 국가 또는 적격 EEA 국가 간 규칙을 확인하세요.",
        "tr": "Desteklenen ülkeleri ve aynı ülke veya uygun AEA ülkeler arası kuralını doğrulayın.",
        "ar": "تحقق من البلدان المدعومة ونفس البلد أو قاعدة المنطقة الاقتصادية الأوروبية المؤهلة عبر البلاد.",
        "es": "Verifique los países admitidos y la regla entre países del mismo país o del EEE elegible.",
        "pt-BR": "Verifique os países suportados e a regra entre países do mesmo país ou do EEE elegível.",
        "fr": "Vérifiez les pays pris en charge et la règle internationale du même pays ou de l'EEE éligible.",
        "de": "Überprüfen Sie die unterstützten Länder und die Regel für das gleiche Land oder die zulässige EWR-übergreifende Regel.",
        "ru": "Проверьте поддерживаемые страны и правила для той же страны или приемлемого межстранового правила ЕЭЗ.",
        "id": "Verifikasi negara yang didukung dan aturan lintas negara EEA yang sama atau yang memenuhi syarat.",
        "vi": "Xác minh các quốc gia được hỗ trợ và quy tắc xuyên quốc gia cùng quốc gia hoặc EEA đủ điều kiện.",
        "it": "Verifica i paesi supportati e la regola transnazionale dello stesso paese o del SEE idoneo.",
        // l10n: needs native review
        "ur": "سپورٹڈ ممالک اور اسی ملک یا اہل EEA کراس کنٹری قاعدہ کی تصدیق کریں۔",
        // l10n: needs native review
        "uk": "Перевірте підтримувані країни і правило тієї самої країни або відповідне транскордонне правило ЄЕЗ."
      },
      "eligibility": {
        "en": "The friend must be new to Kraken, verified, and use the referral during account creation.",
        "zh-Hans": "好友须为 Kraken 新用户、完成验证，并在创建账户时使用邀请。",
        "zh-Hant": "好友須為 Kraken 新用戶、完成驗證，並在建立帳戶時使用邀請。",
        "ja": "友人は Kraken を初めて使用し、認証済みで、アカウント作成時に紹介を使用する必要があります。",
        "ko": "친구는 Kraken을 처음 사용하고 인증을 받아야 하며 계정 생성 시 추천을 사용해야 합니다.",
        "tr": "Arkadaşın Kraken'de yeni olması, doğrulanmış olması ve hesap oluşturma sırasında yönlendirmeyi kullanması gerekir.",
        "ar": "يجب أن يكون الصديق جديدًا في Kraken، وتم التحقق منه، ويستخدم الإحالة أثناء إنشاء الحساب.",
        "es": "El amigo debe ser nuevo en Kraken, estar verificado y utilizar la referencia durante la creación de la cuenta.",
        "pt-BR": "O amigo deve ser novo no Kraken, verificado e usar a indicação durante a criação da conta.",
        "fr": "L'ami doit être nouveau sur Kraken, vérifié et utiliser la référence lors de la création du compte.",
        "de": "Der Freund muss neu bei Kraken sein, verifiziert sein und die Empfehlung bei der Kontoerstellung verwenden.",
        "ru": "Приглашенный пользователь должен быть новым клиентом Kraken, пройти верификацию и применить реферальный код при регистрации.",
        "id": "Teman tersebut harus baru mengenal Kraken, terverifikasi, dan menggunakan referensi selama pembuatan akun.",
        "vi": "Người được giới thiệu phải là người dùng mới trên Kraken, đã hoàn tất xác minh và áp dụng mã giới thiệu khi tạo tài khoản.",
        "it": "L'amico deve essere nuovo su Kraken, verificato e utilizzare il referral durante la creazione dell'account.",
        // l10n: needs native review
        "ur": "دوست کو Kraken کے لیے نیا، تصدیق شدہ ہونا چاہیے، اور اکاؤنٹ تخلیق کے دوران ریفرل استعمال کرنا چاہیے۔",
        // l10n: needs native review
        "uk": "Друг має бути новим користувачем Kraken, пройти верифікацію та використати реферальне посилання під час створення акаунта."
      },
      "kyc": {
        "en": "The friend must be new to Kraken, verified, and use the referral during account creation.",
        "zh-Hans": "好友须为 Kraken 新用户、完成验证，并在创建账户时使用邀请。",
        "zh-Hant": "好友須為 Kraken 新用戶、完成驗證，並在建立帳戶時使用邀請。",
        "ja": "友人は Kraken を初めて使用し、認証済みで、アカウント作成時に紹介を使用する必要があります。",
        "ko": "친구는 Kraken을 처음 사용하고 인증을 받아야 하며 계정 생성 시 추천을 사용해야 합니다.",
        "tr": "Arkadaşın Kraken'de yeni olması, doğrulanmış olması ve hesap oluşturma sırasında yönlendirmeyi kullanması gerekir.",
        "ar": "يجب أن يكون الصديق جديدًا في Kraken، وتم التحقق منه، ويستخدم الإحالة أثناء إنشاء الحساب.",
        "es": "El amigo debe ser nuevo en Kraken, estar verificado y utilizar la referencia durante la creación de la cuenta.",
        "pt-BR": "O amigo deve ser novo no Kraken, verificado e usar a indicação durante a criação da conta.",
        "fr": "L'ami doit être nouveau sur Kraken, vérifié et utiliser la référence lors de la création du compte.",
        "de": "Der Freund muss neu bei Kraken sein, verifiziert sein und die Empfehlung bei der Kontoerstellung verwenden.",
        "ru": "Приглашенный пользователь должен быть новым клиентом Kraken, пройти верификацию и применить реферальный код при регистрации.",
        "id": "Teman tersebut harus baru mengenal Kraken, terverifikasi, dan menggunakan referensi selama pembuatan akun.",
        "vi": "Người được giới thiệu phải là người dùng mới trên Kraken, đã hoàn tất xác minh và áp dụng mã giới thiệu khi tạo tài khoản.",
        "it": "L'amico deve essere nuovo su Kraken, verificato e utilizzare il referral durante la creazione dell'account.",
        // l10n: needs native review
        "ur": "دوست کو Kraken کے لیے نیا، تصدیق شدہ ہونا چاہیے اور اکاؤنٹ بناتے وقت کے دوران ریفرل استعمال کرنا چاہیے۔",
        // l10n: needs native review
        "uk": "Друг має бути новим для Kraken, верифікованим і використати реферал під час створення акаунта."
      },
      "deposit": {
        "en": "Meet the app's fiat-deposit and trading requirements within 30 days; card deposits are excluded in these terms.",
        "zh-Hans": "三十天内完成应用内要求的法币入金与交易；该条款不计入银行卡入金。",
        "zh-Hant": "三十天內完成應用程式要求的法幣入金與交易；該條款不計入銀行卡入金。",
        "ja": "30 日以内にアプリの法定通貨入金および取引要件を満たす。カードでの入金は本規約では除外されます。",
        "ko": "30일 이내에 앱의 법정화폐 입금 및 거래 요구 사항을 충족하세요. 본 약관에서는 카드 예금은 제외됩니다.",
        "tr": "Uygulamanın fiat para yatırma ve ticaret gereksinimlerini 30 gün içinde karşılayın; Kartla yapılan para yatırma işlemleri bu şartlara dahil değildir.",
        "ar": "تلبية متطلبات الإيداع والتداول الخاصة بالتطبيق في غضون 30 يومًا؛ يتم استبعاد ودائع البطاقة في هذه الشروط.",
        "es": "Cumpla con los requisitos comerciales y de depósito fiduciario de la aplicación dentro de los 30 días; Los depósitos con tarjeta quedan excluidos en estos términos.",
        "pt-BR": "Atenda aos requisitos de negociação e depósito fiduciário do aplicativo em 30 dias; depósitos com cartão estão excluídos nestes termos.",
        "fr": "Répondez aux exigences de dépôt et de négociation fiduciaires de l'application dans les 30 jours ; les dépôts par carte sont exclus dans ces conditions.",
        "de": "Erfüllen Sie die Fiat-Einzahlungs- und Handelsanforderungen der App innerhalb von 30 Tagen; Karteneinzahlungen sind in diesen Bedingungen ausgeschlossen.",
        "ru": "Выполните требования приложения к депозитам и торговле в течение 30 дней; Депозиты по картам исключены из этих условий.",
        "id": "Memenuhi persyaratan deposit fiat dan perdagangan aplikasi dalam waktu 30 hari; setoran kartu tidak termasuk dalam ketentuan ini.",
        "vi": "Đáp ứng các yêu cầu giao dịch và tiền gửi fiat của ứng dụng trong vòng 30 ngày; tiền gửi bằng thẻ được loại trừ trong các điều khoản này.",
        "it": "Soddisfare i requisiti di deposito e trading fiat dell'app entro 30 giorni; i depositi con carta sono esclusi in questi termini.",
        // l10n: needs native review
        "ur": "30 دن کے اندر ایپ کی فیاٹ ڈپازٹ اور ٹریڈنگ شرائط پوری کریں؛ کارڈ ڈپازٹس ان شرائط میں خارج ہیں۔",
        // l10n: needs native review
        "uk": "Виконайте фіатний депозит і торгові вимоги застосунку протягом 30 днів; карткові депозити виключені за цими умовами."
      },
      "trading": {
        "en": "Meet the app's fiat-deposit and trading requirements within 30 days; card deposits are excluded in these terms.",
        "zh-Hans": "三十天内完成应用内要求的法币入金与交易；该条款不计入银行卡入金。",
        "zh-Hant": "三十天內完成應用程式要求的法幣入金與交易；該條款不計入銀行卡入金。",
        "ja": "30 日以内にアプリの法定通貨入金および取引要件を満たす。カードでの入金は本規約では除外されます。",
        "ko": "30일 이내에 앱의 법정화폐 입금 및 거래 요구 사항을 충족하세요. 본 약관에서는 카드 예금은 제외됩니다.",
        "tr": "Uygulamanın fiat para yatırma ve ticaret gereksinimlerini 30 gün içinde karşılayın; Kartla yapılan para yatırma işlemleri bu şartlara dahil değildir.",
        "ar": "تلبية متطلبات الإيداع والتداول الخاصة بالتطبيق في غضون 30 يومًا؛ يتم استبعاد ودائع البطاقة في هذه الشروط.",
        "es": "Cumpla con los requisitos comerciales y de depósito fiduciario de la aplicación dentro de los 30 días; Los depósitos con tarjeta quedan excluidos en estos términos.",
        "pt-BR": "Atenda aos requisitos de negociação e depósito fiduciário do aplicativo em 30 dias; depósitos com cartão estão excluídos nestes termos.",
        "fr": "Répondez aux exigences de dépôt et de négociation fiduciaires de l'application dans les 30 jours ; les dépôts par carte sont exclus dans ces conditions.",
        "de": "Erfüllen Sie die Fiat-Einzahlungs- und Handelsanforderungen der App innerhalb von 30 Tagen; Karteneinzahlungen sind in diesen Bedingungen ausgeschlossen.",
        "ru": "Выполните требования приложения к депозитам и торговле в течение 30 дней; Депозиты по картам исключены из этих условий.",
        "id": "Memenuhi persyaratan deposit fiat dan perdagangan aplikasi dalam waktu 30 hari; setoran kartu tidak termasuk dalam ketentuan ini.",
        "vi": "Đáp ứng các yêu cầu giao dịch và tiền gửi fiat của ứng dụng trong vòng 30 ngày; tiền gửi bằng thẻ được loại trừ trong các điều khoản này.",
        "it": "Soddisfare i requisiti di deposito e trading fiat dell'app entro 30 giorni; i depositi con carta sono esclusi in questi termini.",
        // l10n: needs native review
        "ur": "ایپ کی فیاٹ ڈپازٹ اور ٹریڈنگ تقاضے کو 30 دن کے اندر پورا کریں؛ کارڈ ڈپازٹس ان شرائط میں خارج ہیں۔",
        // l10n: needs native review
        "uk": "Виконайте фіатний депозит і торгівля вимоги застосунку протягом 30 днів; картка депозити за цими умовами виключені."
      },
      "rewardType": {
        "en": "Referral reward; public amount conflict unresolved",
        "zh-Hans": "邀请奖励，公开金额冲突尚未解决",
        "zh-Hant": "邀請獎勵，公開金額衝突尚未解決",
        "ja": "紹介報酬;公開金額の競合が未解決",
        "ko": "추천 보상; 공개 금액 충돌이 해결되지 않았습니다.",
        "tr": "Tavsiye ödülü; kamu miktarı anlaşmazlığı çözülmedi",
        "ar": "مكافأة الإحالة؛ تعارض المبلغ العام لم يتم حله",
        "es": "Recompensa por recomendación; Conflicto de cantidad pública sin resolver.",
        "pt-BR": "Recompensa de indicação; conflito de valor público não resolvido",
        "fr": "Récompense de parrainage ; conflit de montant public non résolu",
        "de": "Empfehlungsbelohnung; öffentlicher Betragskonflikt ungelöst",
        "ru": "Реферальное вознаграждение; конфликт публичной суммы неразрешен",
        "id": "Hadiah rujukan; konflik jumlah publik belum terselesaikan",
        "vi": "Phần thưởng giới thiệu; xung đột về số tiền công khai chưa được giải quyết",
        "it": "Premio per il rinvio; conflitto sull'importo pubblico irrisolto",
        // l10n: needs native review
        "ur": "ریفرل انعام؛ عوامی رقم کا تضاد غیر حل شدہ",
        // l10n: needs native review
        "uk": "Реферал винагорода; публічний конфлікт суми невирішений"
      },
      "limitations": {
        "en": "The heading says up to $200 while the FAQ describes a fixed 20 in the default currency. No common amount should be advertised until resolved.",
        "zh-Hans": "标题写最高 $200，FAQ 又写默认货币固定 20；在冲突解决前不展示统一奖励金额。",
        "zh-Hant": "標題寫最高 $200，FAQ 又寫預設貨幣固定 20；在衝突解決前不展示統一獎勵金額。",
        "ja": "見出しには最大 $200 とありますが、FAQ ではデフォルト通貨で固定 20 と説明されています。解決されるまでは、共通の金額を表示すべきではありません。",
        "ko": "제목에는 최대 $200라고 되어 있지만 FAQ에는 기본 통화 기준 고정 20이라고 설명되어 있습니다. 충돌이 해결될 때까지 공통 금액을 표시해서는 안 됩니다.",
        "tr": "Başlık 200$'a kadar derken, SSS varsayılan para biriminde sabit 20 tutarını açıklar. Çelişki çözülene kadar ortak bir tutar duyurulmamalıdır.",
        "ar": "يقول العنوان ما يصل إلى 200$، بينما تصف الأسئلة الشائعة مبلغ 20 ثابتًا بالعملة الافتراضية. لا ينبغي عرض مبلغ موحد حتى يتم حسم التعارض.",
        "es": "El título dice hasta $200, mientras que las preguntas frecuentes describen un valor fijo de 20 en la moneda predeterminada. No debe anunciarse una cantidad común hasta que se resuelva la discrepancia.",
        "pt-BR": "O título indica até US$ 200, enquanto o FAQ descreve um valor fixo de 20 na moeda padrão. Nenhum valor comum deve ser anunciado até que a divergência seja resolvida.",
        "fr": "Le titre indique jusqu'à 200 $, tandis que la FAQ décrit un montant fixe de 20 dans la devise par défaut. Aucun montant commun ne doit être annoncé tant que l'écart n'est pas résolu.",
        "de": "Die Überschrift nennt bis zu 200 $, während die FAQ einen festen Betrag von 20 in der Standardwährung beschreibt. Bis zur Klärung sollte kein einheitlicher Betrag beworben werden.",
        "ru": "В заголовке указано до 200 $, тогда как FAQ описывает фиксированные 20 в валюте по умолчанию. До разрешения расхождения не следует указывать единый размер вознаграждения.",
        "id": "Judul menyebut hingga $200, sedangkan FAQ menjelaskan angka tetap 20 dalam mata uang default. Tidak ada jumlah umum yang boleh dipromosikan sampai perbedaan ini diselesaikan.",
        "vi": "Tiêu đề ghi tối đa $200, trong khi FAQ mô tả mức cố định 20 theo loại tiền mặc định. Không nên công bố một số tiền chung cho đến khi điểm này được làm rõ.",
        "it": "Il titolo indica fino a 200 $, mentre le FAQ descrivono un importo fisso di 20 nella valuta predefinita. Nessun importo comune dovrebbe essere pubblicizzato finché la discrepanza non viene risolta.",
        // l10n: needs native review
        "ur": "ہیڈنگ $200 تک کہتی ہے جبکہ FAQ ڈیفالٹ کرنسی میں مقررہ 20 بیان کرتا ہے۔ حل ہونے تک کوئی مشترک رقم مشتہر نہیں ہونی چاہیے۔",
        // l10n: needs native review
        "uk": "Заголовок каже до $200, тоді як FAQ описує фіксовані 20 у базовій валюті. Поки конфлікт не вирішено, не слід рекламувати спільну суму."
      },
      "publishedDate": {
        "en": "2026-05-08",
        "zh-Hans": "2026-05-08",
        "zh-Hant": "2026-05-08",
        "ja": "2026-05-08",
        "ko": "2026-05-08",
        "tr": "2026-05-08",
        "ar": "2026-05-08",
        "es": "2026-05-08",
        "pt-BR": "08/05/2026",
        "fr": "2026-05-08",
        "de": "08.05.2026",
        "ru": "2026-05-08",
        "id": "08-05-2026",
        "vi": "2026-05-08",
        "it": "2026-05-08",
        // l10n: needs native review
        "ur": "2026-05-08",
        // l10n: needs native review
        "uk": "2026-05-08"
      },
      "datePrecision": {
        "en": "Source date retained as displayed; no missing timezone is inferred.",
        "zh-Hans": "保留来源显示日期，不推断缺失时区。",
        "zh-Hant": "保留來源顯示日期，不推斷缺失時區。",
        "ja": "ソースの日付は表示どおりに保持されます。欠落しているタイムゾーンは推論されません。",
        "ko": "소스 날짜는 표시된 대로 유지됩니다. 누락된 시간대는 유추되지 않습니다.",
        "tr": "Kaynak tarihi görüntülendiği şekilde tutuldu; eksik bir saat diliminin olmadığı anlaşılmaktadır.",
        "ar": "تم الاحتفاظ بتاريخ المصدر كما هو معروض؛ لا يتم استنتاج أي منطقة زمنية مفقودة.",
        "es": "La fecha de origen se conserva tal como se muestra; no se infiere ninguna zona horaria faltante.",
        "pt-BR": "Data de origem mantida conforme exibida; nenhum fuso horário ausente é inferido.",
        "fr": "Date source conservée telle qu'affichée ; aucun fuseau horaire manquant n’est déduit.",
        "de": "Quelldatum wie angezeigt beibehalten; Es wird keine fehlende Zeitzone abgeleitet.",
        "ru": "Исходная дата сохраняется в том виде, в каком она отображается; отсутствие отсутствующего часового пояса не предполагается.",
        "id": "Tanggal sumber dipertahankan seperti yang ditampilkan; tidak ada zona waktu yang hilang yang disimpulkan.",
        "vi": "Ngày nguồn được giữ lại như được hiển thị; không có múi giờ bị thiếu được suy ra.",
        "it": "Data di origine mantenuta come visualizzata; non si deduce alcun fuso orario mancante.",
        // l10n: needs native review
        "ur": "ذریعہ تاریخ جوں کی توں دکھائی گئی برقرار ہے؛ غائب ٹائم زون اخذ نہیں کیا گیا۔",
        // l10n: needs native review
        "uk": "Дату джерела збережено як показано; відсутній часовий пояс не виводиться."
      },
      "gaps": [
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مہم کی کوئی قطعی مدت تصدیق شدہ نہیں ہے؛ صرف پڑھنے کے قابل صفحہ پیشکش فعال ہونے کو ثابت نہیں کر سکتا۔",
          // l10n: needs native review
          "uk": "Повне абсолютне вікно кампанії не підтверджено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The heading says up to $200 while the FAQ describes a fixed 20 in the default currency. No common amount should be advertised until resolved.",
          "zh-Hans": "标题写最高 $200，FAQ 又写默认货币固定 20；在冲突解决前不展示统一奖励金额。",
          "zh-Hant": "標題寫最高 $200，FAQ 又寫預設貨幣固定 20；在衝突解決前不展示統一獎勵金額。",
          "ja": "見出しには最大 $200 とありますが、FAQ ではデフォルト通貨で固定 20 と説明されています。解決されるまでは、共通の金額を表示すべきではありません。",
          "ko": "제목에는 최대 $200라고 되어 있지만 FAQ에는 기본 통화 기준 고정 20이라고 설명되어 있습니다. 충돌이 해결될 때까지 공통 금액을 표시해서는 안 됩니다.",
          "tr": "Başlık 200$'a kadar derken, SSS varsayılan para biriminde sabit 20 tutarını açıklar. Çelişki çözülene kadar ortak bir tutar duyurulmamalıdır.",
          "ar": "يقول العنوان ما يصل إلى 200$، بينما تصف الأسئلة الشائعة مبلغ 20 ثابتًا بالعملة الافتراضية. لا ينبغي عرض مبلغ موحد حتى يتم حسم التعارض.",
          "es": "El título dice hasta $200, mientras que las preguntas frecuentes describen un valor fijo de 20 en la moneda predeterminada. No debe anunciarse una cantidad común hasta que se resuelva la discrepancia.",
          "pt-BR": "O título indica até US$ 200, enquanto o FAQ descreve um valor fixo de 20 na moeda padrão. Nenhum valor comum deve ser anunciado até que a divergência seja resolvida.",
          "fr": "Le titre indique jusqu'à 200 $, tandis que la FAQ décrit un montant fixe de 20 dans la devise par défaut. Aucun montant commun ne doit être annoncé tant que l'écart n'est pas résolu.",
          "de": "Die Überschrift nennt bis zu 200 $, während die FAQ einen festen Betrag von 20 in der Standardwährung beschreibt. Bis zur Klärung sollte kein einheitlicher Betrag beworben werden.",
          "ru": "В заголовке указано до 200 $, тогда как FAQ описывает фиксированные 20 в валюте по умолчанию. До разрешения расхождения не следует указывать единый размер вознаграждения.",
          "id": "Judul menyebut hingga $200, sedangkan FAQ menjelaskan angka tetap 20 dalam mata uang default. Tidak ada jumlah umum yang boleh dipromosikan sampai perbedaan ini diselesaikan.",
          "vi": "Tiêu đề ghi tối đa $200, trong khi FAQ mô tả mức cố định 20 theo loại tiền mặc định. Không nên công bố một số tiền chung cho đến khi điểm này được làm rõ.",
          "it": "Il titolo indica fino a 200 $, mentre le FAQ descrivono un importo fisso di 20 nella valuta predefinita. Nessun importo comune dovrebbe essere pubblicizzato finché la discrepanza non viene risolta.",
          // l10n: needs native review
          "ur": "سرخی زیادہ سے زیادہ $200 کہتی ہے جبکہ FAQ طے شدہ کرنسی میں مقررہ 20 بیان کرتا ہے۔ حل ہونے تک کوئی مشترک رقم مشتہر نہیں کرنی چاہیے۔",
          // l10n: needs native review
          "uk": "Заголовок каже до $200, тоді як FAQ описує фіксовані 20 у базовій валюті. Поки це не вирішено, не слід рекламувати жодну спільну суму."
        }
      ]
    }
  },
  "gate-io": {
    "summary": {
      "en": "Gate's welcome package is composed of vouchers. Gate Europe runs separate, region-bound campaign terms.",
      "zh-Hans": "Gate 欢迎礼包由卡券组成，Gate Europe 则有独立的地区活动条款。",
      "zh-Hant": "Gate 歡迎禮包由卡券組成，Gate Europe 則有獨立的地區活動條款。",
      "ja": "Gate のウェルカム パッケージはバウチャーで構成されています。 Gate Europe では、地域限定の個別のキャンペーン期間を実施しています。",
      "ko": "게이트의 웰컴 패키지는 바우처로 구성되어 있습니다. Gate Europe은 별도의 지역 한정 캠페인 기간을 운영합니다.",
      "tr": "Gate'in karşılama paketi kuponlardan oluşmaktadır. Gate Europe ayrı, bölgeye bağlı kampanya koşulları yürütür.",
      "ar": "تتكون باقة الترحيب الخاصة بـ Gate من قسائم. تدير Gate Europe شروط حملة منفصلة ومحددة بالمنطقة.",
      "es": "El paquete de bienvenida de Gate se compone de vales. Gate Europe ejecuta términos de campaña separados y vinculados a regiones.",
      "pt-BR": "O pacote de boas-vindas da Gate é composto por vouchers. A Gate Europe executa termos de campanha separados e vinculados à região.",
      "fr": "Le package de bienvenue de Gate est composé de bons. Gate Europe gère des conditions de campagne distinctes et liées à la région.",
      "de": "Das Willkommenspaket von Gate besteht aus Gutscheinen. Gate Europe führt separate, regional begrenzte Kampagnenbedingungen durch.",
      "ru": "Приветственный пакет Gate состоит из ваучеров. Gate Europe использует отдельные условия кампании, привязанные к региону.",
      "id": "Paket selamat datang Gate terdiri dari voucher. Gate Europe menjalankan persyaratan kampanye yang terpisah dan terikat wilayah.",
      "vi": "Gói chào mừng của Gate bao gồm các voucher. Gate Europe áp dụng các điều khoản chiến dịch riêng biệt theo khu vực.",
      "it": "Il pacchetto di benvenuto di Gate è composto da voucher. Gate Europe pubblica termini di campagna separati e delimitati per regione.",
      // l10n: needs native review
      "ur": "Gate کا استقبالی پیکج واؤچرز پر مشتمل ہے۔ Gate Europe الگ مہماتی شرائط چلاتا ہے جو مخصوص علاقوں تک محدود ہیں۔",
      // l10n: needs native review
      "uk": "Вітальний пакет Gate складається з ваучерів. Gate Europe має окремі умови кампаній з регіональними обмеженнями."
    },
    "signupReward": {
      "summary": {
        "en": "The public hub labels the 135 USDT welcome package as multiple vouchers, not 135 USDT of freely withdrawable cash.",
        "zh-Hans": "公开福利中心将 135 USDT 欢迎礼包逐项标为卡券，不是可自由提现的 135 USDT 现金。",
        "zh-Hant": "公開福利中心將 135 USDT 歡迎禮包逐項標為卡券，不是可自由提領的 135 USDT 現金。",
        "ja": "パブリック ハブは、135 USDT のウェルカム パッケージを、自由に引き出し可能な現金 135 USDT ではなく、複数のバウチャーとしてラベル付けします。",
        "ko": "공개 허브는 135 USDT 환영 패키지를 자유롭게 인출 가능한 현금 135 USDT가 아닌 다중 바우처로 표시합니다.",
        "tr": "Herkese açık ödül merkezi, 135 USDT'lik hoş geldin paketini serbestçe çekilebilen 135 USDT nakit olarak değil, birden fazla kupon olarak gösteriyor.",
        "ar": "يصنف المركز العام الحزمة الترحيبية البالغة 135 USDT على أنها قسائم متعددة، وليس 135 USDT من الأموال النقدية القابلة للسحب بحرية.",
        "es": "El centro público etiqueta el paquete de bienvenida de 135 USDT como vales múltiples, no 135 USDT de efectivo que se puede retirar libremente.",
        "pt-BR": "O centro público rotula o pacote de boas-vindas de 135 USDT como vouchers múltiplos, e não como 135 USDT de dinheiro que pode ser retirado gratuitamente.",
        "fr": "Le hub public qualifie le package de bienvenue de 135 USDT de bons multiples, et non de 135 USDT d'espèces librement retirables.",
        "de": "Der öffentliche Hub kennzeichnet das 135 USDT-Willkommenspaket als Mehrfachgutscheine und nicht als 135 USDT frei abhebbares Bargeld.",
        "ru": "Публичный хаб маркирует приветственный пакет на сумму 135 USDT как несколько ваучеров, а не как свободно выводимые наличные на сумму 135 USDT.",
        "id": "Pusat publik memberi label paket selamat datang 135 USDT sebagai beberapa voucher, bukan uang tunai 135 USDT yang dapat ditarik secara bebas.",
        "vi": "Trang tổng quan công khai nêu rõ gói chào mừng 135 USDT gồm nhiều voucher, không phải 135 USDT tiền mặt có thể rút tự do.",
        "it": "L'hub pubblico etichetta il pacchetto di benvenuto da 135 USDT come voucher multipli, non come 135 USDT di contanti liberamente prelevabili.",
        // l10n: needs native review
        "ur": "عوامی مرکز 135 USDT استقبالی پیکج کو متعدد واؤچرز کہتا ہے، آزادانہ قابل نکاسی نقد کے 135 USDT نہیں۔",
        // l10n: needs native review
        "uk": "Публічний центр позначає 135 USDT вітальний пакет як кілька ваучерів, а не 135 USDT вільних коштів, доступних для виведення."
      },
      "conditions": [
        {
          "en": "The package combines signup, identity/face verification, first deposit, first trade and first app download.",
          "zh-Hans": "礼包合计包含注册、身份与人脸验证、首次入金、首次交易和首次下载应用任务。",
          "zh-Hant": "禮包合計包含註冊、身分與人臉驗證、首次入金、首次交易和首次下載應用程式任務。",
          "ja": "このパッケージには、サインアップ、本人確認/顔認証、最初の入金、最初の取引、最初のアプリのダウンロードが含まれています。",
          "ko": "패키지에는 가입, 신원/얼굴 확인, 첫 입금, 첫 거래 및 첫 앱 다운로드가 결합되어 있습니다.",
          "tr": "Paket; kayıt, kimlik/yüz doğrulama, ilk para yatırma, ilk işlem ve ilk uygulama indirme görevlerini birleştirir.",
          "ar": "تجمع الحزمة بين التسجيل والتحقق من الهوية/الوجه والإيداع الأول والتداول الأول وتنزيل التطبيق الأول.",
          "es": "El paquete combina registro, verificación de identidad/cara, primer depósito, primera operación y primera descarga de la aplicación.",
          "pt-BR": "O pacote combina inscrição, verificação de identidade/face, primeiro depósito, primeira negociação e primeiro download do aplicativo.",
          "fr": "Le package combine l’inscription, la vérification d’identité/visage, le premier dépôt, la première transaction et le premier téléchargement d’application.",
          "de": "Das Paket umfasst Anmeldung, Identitäts-/Gesichtsüberprüfung, erste Einzahlung, ersten Handel und ersten App-Download.",
          "ru": "Пакет сочетает в себе регистрацию, проверку личности/лица, первый депозит, первую сделку и первую загрузку приложения.",
          "id": "Paket ini menggabungkan pendaftaran, verifikasi identitas/wajah, setoran pertama, perdagangan pertama, dan pengunduhan aplikasi pertama.",
          "vi": "Gói kết hợp đăng ký, xác minh danh tính/khuôn mặt, gửi tiền lần đầu, giao dịch đầu tiên và tải xuống ứng dụng đầu tiên.",
          "it": "Il pacchetto combina registrazione, verifica dell'identità/volto, primo deposito, primo scambio e primo download dell'app.",
          // l10n: needs native review
          "ur": "پیکج سائن اپ، شناخت/چہرہ تصدیق، پہلا ڈپازٹ، پہلی ٹریڈ اور پہلی ایپ ڈاؤن لوڈ کو جوڑتا ہے۔",
          // l10n: needs native review
          "uk": "Пакет поєднує реєстрацію, перевірку особи/обличчя, перший депозит, першу угоду і перше завантаження застосунку."
        },
        {
          "en": "The displayed deposit task requires at least 50 USDT; the first trade task at least 30 USDT.",
          "zh-Hans": "页面入金任务要求至少 50 USDT，首笔交易任务要求至少 30 USDT。",
          "zh-Hant": "頁面入金任務要求至少 50 USDT，首筆交易任務要求至少 30 USDT。",
          "ja": "表示された入金タスクには少なくとも 50 USDT が必要です。最初の取引タスクは少なくとも 30 USDT。",
          "ko": "표시된 입금 작업에는 최소 50 USDT가 필요합니다. 첫 번째 거래 작업은 최소 30 USDT입니다.",
          "tr": "Gösterilen para yatırma görevi en az 50 USDT, ilk işlem görevi ise en az 30 USDT gerektirir.",
          "ar": "تتطلب مهمة الإيداع المعروضة ما لا يقل عن 50 USDT؛ ومهمة التداول الأولى لا تقل عن 30 USDT.",
          "es": "La tarea de depósito mostrada requiere al menos 50 USDT; la primera tarea comercial al menos 30 USDT.",
          "pt-BR": "A tarefa de depósito exibida requer pelo menos 50 USDT; a primeira tarefa comercial pelo menos 30 USDT.",
          "fr": "La tâche de dépôt affichée nécessite au moins 50 USDT ; la première tâche commerciale au moins 30 USDT.",
          "de": "Für die angezeigte Einzahlungsaufgabe sind mindestens 50 USDT erforderlich; die erste Handelsaufgabe mindestens 30 USDT.",
          "ru": "Для отображаемого задания на депозит требуется не менее 50 USDT; первое торговое задание — не менее 30 USDT.",
          "id": "Tugas setoran yang ditampilkan memerlukan setidaknya 50 USDT; tugas perdagangan pertama setidaknya 30 USDT.",
          "vi": "Nhiệm vụ gửi tiền được hiển thị yêu cầu ít nhất 50 USDT; nhiệm vụ giao dịch đầu tiên ít nhất 30 USDT.",
          "it": "L'attività di deposito visualizzata richiede almeno 50 USDT; la prima attività commerciale almeno 30 USDT.",
          // l10n: needs native review
          "ur": "دکھایا گیا ڈپازٹ کام کم از کم 50 USDT چاہتا ہے؛ پہلی ٹریڈ کا کام کم از کم 30 USDT۔",
          // l10n: needs native review
          "uk": "Показане депозитне завдання вимагає щонайменше 50 USDT; завдання першої угоди — щонайменше 30 USDT."
        },
        {
          "en": "Read the account's voucher utility, claim deadline and jurisdiction before participating.",
          "zh-Hans": "参与前查看账户实际卡券用途、领取期限和适用地区。",
          "zh-Hant": "參與前查看帳戶實際卡券用途、領取期限和適用地區。",
          "ja": "参加する前に、アカウントのバウチャーユーティリティ、請求期限、および管轄権をよくお読みください。",
          "ko": "참여하기 전에 계정의 바우처 유틸리티, 청구 기한 및 관할권을 읽어보십시오.",
          "tr": "Katılmadan önce hesabın kupon hizmetini, talep tarihini ve yargı yetkisini okuyun.",
          "ar": "اقرأ فائدة قسيمة الحساب والموعد النهائي للمطالبة والاختصاص القضائي قبل المشاركة.",
          "es": "Lea la utilidad del bono de la cuenta, la fecha límite para reclamar y la jurisdicción antes de participar.",
          "pt-BR": "Leia o utilitário do voucher da conta, prazo de reivindicação e jurisdição antes de participar.",
          "fr": "Lisez l'utilitaire de bon du compte, la date limite de réclamation et la juridiction avant de participer.",
          "de": "Lesen Sie vor der Teilnahme die Gutscheinfunktion des Kontos, die Anspruchsfrist und den Gerichtsstand.",
          "ru": "Прежде чем участвовать, ознакомьтесь с полезностью ваучера учетной записи, сроком подачи заявки и юрисдикцией.",
          "id": "Baca kegunaan voucher akun, batas waktu klaim, dan yurisdiksi sebelum berpartisipasi.",
          "vi": "Đọc kỹ tiện ích voucher của tài khoản, thời hạn yêu cầu và thẩm quyền trước khi tham gia.",
          "it": "Prima di partecipare, leggi l'utilità del voucher dell'account, la scadenza per la richiesta e la giurisdizione.",
          // l10n: needs native review
          "ur": "شرکت سے پہلے اکاؤنٹ کا واؤچر استعمال، دعویٰ آخری تاریخ اور حوزه اختیار پڑھیں۔",
          // l10n: needs native review
          "uk": "Перед участь прочитайте використання ваучера, дедлайн заявки і юрисдикція акаунта."
        }
      ]
    },
    "sources": {
      "gate-rewards-hub": {
        "summary": {
          "en": "All five welcome task rewards are labelled vouchers; advanced trading maximums are separate tasks.",
          "zh-Hans": "五项欢迎任务奖励均标为卡券，进阶交易宣传最高额属于另一组任务。",
          "zh-Hant": "五項歡迎任務獎勵均標為卡券，進階交易宣傳最高額屬於另一組任務。",
          "ja": "5 つのウェルカム タスク報酬にはすべてバウチャーのラベルが付いています。高度な取引の最大値は別のタスクです。",
          "ko": "5가지 환영 작업 보상은 모두 바우처로 표시되어 있습니다. 고급 거래 최대치는 별도의 작업입니다.",
          "tr": "Beş hoş geldin görevi ödülünün tümü kupon olarak etiketlenmiştir; gelişmiş işlem maksimumları ayrı görevlerdir.",
          "ar": "جميع مكافآت المهام الترحيبية الخمس تحمل علامة قسائم؛ تعتبر الحدود القصوى للتداول المتقدمة مهام منفصلة.",
          "es": "Las cinco recompensas de tareas de bienvenida están etiquetadas como vales; Los máximos comerciales avanzados son tareas separadas.",
          "pt-BR": "Todas as cinco recompensas de tarefas de boas-vindas são vouchers rotulados; máximos de negociação avançados são tarefas separadas.",
          "fr": "Les cinq récompenses de tâches de bienvenue sont étiquetées comme des bons ; les maximums de trading avancés sont des tâches distinctes.",
          "de": "Alle fünf Belohnungen für Willkommensaufgaben sind als Gutscheine gekennzeichnet. Erweiterte Handelsmaxima sind separate Aufgaben.",
          "ru": "Все пять наград за приветственные задания обозначены как ваучеры; расширенные торговые максимумы — это отдельные задачи.",
          "id": "Kelima hadiah tugas selamat datang diberi label voucher; maksimum perdagangan tingkat lanjut adalah tugas terpisah.",
          "vi": "Tất cả năm phần thưởng nhiệm vụ chào mừng đều được ghi chú là voucher; các mức trần giao dịch nâng cao là những nhiệm vụ riêng biệt.",
          "it": "Tutti e cinque i premi per le attività di benvenuto sono etichettati come voucher; i massimi di trading avanzati sono compiti separati.",
          // l10n: needs native review
          "ur": "تمام پانچ استقبالی کاموں کے انعامات واؤچرز کے طور پر درج ہیں؛ ایڈوانسڈ ٹریڈنگ کی زیادہ سے زیادہ حدیں الگ کام ہیں۔",
          // l10n: needs native review
          "uk": "Усі п’ять винагороди за вітальні завдання позначені як ваучери; максимуми розширеної торгівлі є окремими завдання."
        }
      },
      "gate-europe-august-campaign": {
        "summary": {
          "en": "This dated Europe campaign ends at 00:00 UTC on 7 September. The first-200 new-user deposit/trade tasks award fee-rebate vouchers, not cash; higher tiers have distinct terms.",
          "zh-Hans": "该欧洲活动于 9 月 7 日 00:00 UTC 截止。新用户入金与交易各限前 200 名，发放手续费返还券而非现金；更高档任务另有条件。",
          "zh-Hant": "該歐洲活動於 9 月 7 日 00:00 UTC 截止。新用戶入金與交易各限前 200 名，發放手續費返還券而非現金；更高檔任務另有條件。",
          "ja": "この日付付きのヨーロッパ キャンペーンは、9 月 7 日 00:00 UTC に終了します。最初の 200 件の新規ユーザーの入金/取引タスクでは、現金ではなく手数料リベート バウチャーが付与されます。上位層には明確な用語があります。",
          "ko": "이 유럽 캠페인은 9월 7일 00:00 UTC에 종료됩니다. 최초 200명의 신규 사용자 예금/거래 작업은 현금이 아닌 수수료 리베이트 바우처를 제공합니다. 상위 계층에는 별도의 용어가 있습니다.",
          "tr": "Bu tarihli Avrupa kampanyası 7 Eylül 00:00 UTC'de sona eriyor. İlk 200 yeni kullanıcıya para yatırma/ticaret görevleri nakit yerine ücret iadesi kuponları verir; daha yüksek katmanların farklı koşulları vardır.",
          "ar": "تنتهي هذه الحملة الأوروبية المؤرخة في تمام الساعة 00:00 بالتوقيت العالمي المنسق في 7 سبتمبر. أول 200 مهمة إيداع/تداول للمستخدم الجديد تمنح قسائم خصم الرسوم، وليس نقدًا؛ المستويات الأعلى لها شروط مميزة.",
          "es": "Esta campaña europea con fecha finaliza a las 00:00 UTC del 7 de septiembre. Las primeras 200 tareas de depósito/comercio de nuevos usuarios otorgan vales de reembolso de tarifas, no efectivo; los niveles superiores tienen términos distintos.",
          "pt-BR": "Esta campanha datada na Europa termina às 00:00 UTC de 7 de setembro. As primeiras 200 tarefas de depósito/negociação de novos usuários concedem vouchers de desconto de taxas, não dinheiro; níveis superiores têm termos distintos.",
          "fr": "Cette campagne européenne datée se termine à 00h00 UTC le 7 septembre. Les 200 premières tâches de dépôt/échange pour les nouveaux utilisateurs attribuent des bons de réduction de frais, et non de l'argent liquide ; les niveaux supérieurs ont des termes distincts.",
          "de": "Diese datierte Europa-Kampagne endet am 7. September um 00:00 UTC. Bei den ersten 200 Einzahlungs-/Handelsaufgaben für neue Benutzer werden Gebührengutscheine und kein Bargeld vergeben. Höhere Stufen haben unterschiedliche Begriffe.",
          "ru": "Эта датированная европейская кампания завершится в 00:00 UTC 7 сентября. Первые 200 новых пользователей по депозитам/торговым операциям получают ваучеры на скидку, а не наличные деньги; более высокие уровни имеют отдельные условия.",
          "id": "Kampanye Eropa bertanggal ini berakhir pada 00:00 UTC pada tanggal 7 September. Voucher biaya-rebate penghargaan tugas deposit/perdagangan pengguna baru untuk 200 pengguna baru, bukan uang tunai; tingkatan yang lebih tinggi memiliki istilah yang berbeda.",
          "vi": "Chiến dịch Châu Âu có niên đại này kết thúc lúc 00:00 UTC vào ngày 7 tháng 9. 200 nhiệm vụ gửi tiền/giao dịch dành cho người dùng mới đầu tiên trao tặng phiếu giảm giá phí, không phải tiền mặt; cấp cao hơn có các điều khoản riêng biệt.",
          "it": "Questa campagna europea datata termina alle 00:00 UTC del 7 settembre. Le prime 200 attività di deposito/commercio dei nuovi utenti assegnano voucher di sconto sulle commissioni, non contanti; i livelli superiori hanno termini distinti.",
          // l10n: needs native review
          "ur": "یہ تاریخ والی یورپ مہم 7 ستمبر کو 00:00 UTC پر ختم ہوتی ہے۔ پہلے 200 نئے صارفین کے ڈپازٹ/ٹریڈ کام فیس ریبیٹ واؤچرز دیتے ہیں، نقد نہیں؛ بلند درجوں کی الگ شرائط ہیں۔",
          // l10n: needs native review
          "uk": "Ця датована європейська кампанія завершується 7 вересня о 00:00 UTC. Завдання депозиту/торгівлі для перших 200 нових користувачів дають ваучери ребейту комісій, а не готівку; вищі рівні мають окремі умови."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "The package combines signup, identity/face verification, first deposit, first trade and first app download.",
        "zh-Hans": "礼包合计包含注册、身份与人脸验证、首次入金、首次交易和首次下载应用任务。",
        "zh-Hant": "禮包合計包含註冊、身分與人臉驗證、首次入金、首次交易和首次下載應用程式任務。",
        "ja": "このパッケージには、サインアップ、本人確認/顔認証、最初の入金、最初の取引、最初のアプリのダウンロードが含まれています。",
        "ko": "패키지에는 가입, 신원/얼굴 확인, 첫 입금, 첫 거래 및 첫 앱 다운로드가 결합되어 있습니다.",
        "tr": "Paket; kayıt, kimlik/yüz doğrulama, ilk para yatırma, ilk işlem ve ilk uygulama indirme görevlerini birleştirir.",
        "ar": "تجمع الحزمة بين التسجيل والتحقق من الهوية/الوجه والإيداع الأول والتداول الأول وتنزيل التطبيق الأول.",
        "es": "El paquete combina registro, verificación de identidad/cara, primer depósito, primera operación y primera descarga de la aplicación.",
        "pt-BR": "O pacote combina inscrição, verificação de identidade/face, primeiro depósito, primeira negociação e primeiro download do aplicativo.",
        "fr": "Le package combine l’inscription, la vérification d’identité/visage, le premier dépôt, la première transaction et le premier téléchargement d’application.",
        "de": "Das Paket umfasst Anmeldung, Identitäts-/Gesichtsüberprüfung, erste Einzahlung, ersten Handel und ersten App-Download.",
        "ru": "Пакет сочетает в себе регистрацию, проверку личности/лица, первый депозит, первую сделку и первую загрузку приложения.",
        "id": "Paket ini menggabungkan pendaftaran, verifikasi identitas/wajah, setoran pertama, perdagangan pertama, dan pengunduhan aplikasi pertama.",
        "vi": "Gói kết hợp đăng ký, xác minh danh tính/khuôn mặt, gửi tiền lần đầu, giao dịch đầu tiên và tải xuống ứng dụng đầu tiên.",
        "it": "Il pacchetto combina registrazione, verifica dell'identità/volto, primo deposito, primo scambio e primo download dell'app.",
        // l10n: needs native review
        "ur": "پیکج سائن اپ، شناخت/چہرہ تصدیق، پہلا ڈپازٹ، پہلا ٹریڈ اور پہلا ایپ ڈاؤن لوڈ کو ملاتا ہے۔",
        // l10n: needs native review
        "uk": "Пакет поєднує реєстрація, ідентифікація/номінал перевірка, перший депозит, перший угода і перший застосунок завантаження."
      },
      "kyc": {
        "en": "The package combines signup, identity/face verification, first deposit, first trade and first app download.",
        "zh-Hans": "礼包合计包含注册、身份与人脸验证、首次入金、首次交易和首次下载应用任务。",
        "zh-Hant": "禮包合計包含註冊、身分與人臉驗證、首次入金、首次交易和首次下載應用程式任務。",
        "ja": "このパッケージには、サインアップ、本人確認/顔認証、最初の入金、最初の取引、最初のアプリのダウンロードが含まれています。",
        "ko": "패키지에는 가입, 신원/얼굴 확인, 첫 입금, 첫 거래 및 첫 앱 다운로드가 결합되어 있습니다.",
        "tr": "Paket; kayıt, kimlik/yüz doğrulama, ilk para yatırma, ilk işlem ve ilk uygulama indirme görevlerini birleştirir.",
        "ar": "تجمع الحزمة بين التسجيل والتحقق من الهوية/الوجه والإيداع الأول والتداول الأول وتنزيل التطبيق الأول.",
        "es": "El paquete combina registro, verificación de identidad/cara, primer depósito, primera operación y primera descarga de la aplicación.",
        "pt-BR": "O pacote combina inscrição, verificação de identidade/face, primeiro depósito, primeira negociação e primeiro download do aplicativo.",
        "fr": "Le package combine l’inscription, la vérification d’identité/visage, le premier dépôt, la première transaction et le premier téléchargement d’application.",
        "de": "Das Paket umfasst Anmeldung, Identitäts-/Gesichtsüberprüfung, erste Einzahlung, ersten Handel und ersten App-Download.",
        "ru": "Пакет сочетает в себе регистрацию, проверку личности/лица, первый депозит, первую сделку и первую загрузку приложения.",
        "id": "Paket ini menggabungkan pendaftaran, verifikasi identitas/wajah, setoran pertama, perdagangan pertama, dan pengunduhan aplikasi pertama.",
        "vi": "Gói kết hợp đăng ký, xác minh danh tính/khuôn mặt, gửi tiền lần đầu, giao dịch đầu tiên và tải xuống ứng dụng đầu tiên.",
        "it": "Il pacchetto combina registrazione, verifica dell'identità/volto, primo deposito, primo scambio e primo download dell'app.",
        // l10n: needs native review
        "ur": "پیکج سائن اپ، شناخت/چہرہ تصدیق، پہلا ڈپازٹ، پہلی ٹریڈ اور پہلی ایپ ڈاؤن لوڈ کو جوڑتا ہے۔",
        // l10n: needs native review
        "uk": "Пакет поєднує реєстрацію, перевірку особи/обличчя, перший депозит, першу угоду і перше завантаження застосунку."
      },
      "deposit": {
        "en": "The displayed deposit task requires at least 50 USDT; the first trade task at least 30 USDT.",
        "zh-Hans": "页面入金任务要求至少 50 USDT，首笔交易任务要求至少 30 USDT。",
        "zh-Hant": "頁面入金任務要求至少 50 USDT，首筆交易任務要求至少 30 USDT。",
        "ja": "表示された入金タスクには少なくとも 50 USDT が必要です。最初の取引タスクは少なくとも 30 USDT。",
        "ko": "표시된 입금 작업에는 최소 50 USDT가 필요합니다. 첫 번째 거래 작업은 최소 30 USDT입니다.",
        "tr": "Gösterilen para yatırma görevi en az 50 USDT, ilk işlem görevi ise en az 30 USDT gerektirir.",
        "ar": "تتطلب مهمة الإيداع المعروضة ما لا يقل عن 50 USDT؛ ومهمة التداول الأولى لا تقل عن 30 USDT.",
        "es": "La tarea de depósito mostrada requiere al menos 50 USDT; la primera tarea comercial al menos 30 USDT.",
        "pt-BR": "A tarefa de depósito exibida requer pelo menos 50 USDT; a primeira tarefa comercial pelo menos 30 USDT.",
        "fr": "La tâche de dépôt affichée nécessite au moins 50 USDT ; la première tâche commerciale au moins 30 USDT.",
        "de": "Für die angezeigte Einzahlungsaufgabe sind mindestens 50 USDT erforderlich; die erste Handelsaufgabe mindestens 30 USDT.",
        "ru": "Для отображаемого задания на депозит требуется не менее 50 USDT; первое торговое задание — не менее 30 USDT.",
        "id": "Tugas setoran yang ditampilkan memerlukan setidaknya 50 USDT; tugas perdagangan pertama setidaknya 30 USDT.",
        "vi": "Nhiệm vụ gửi tiền được hiển thị yêu cầu ít nhất 50 USDT; nhiệm vụ giao dịch đầu tiên ít nhất 30 USDT.",
        "it": "L'attività di deposito visualizzata richiede almeno 50 USDT; la prima attività commerciale almeno 30 USDT.",
        // l10n: needs native review
        "ur": "دکھایا گیا ڈپازٹ کام کم از کم 50 USDT چاہتا ہے؛ پہلی ٹریڈ کا کام کم از کم 30 USDT۔",
        // l10n: needs native review
        "uk": "Показане депозитне завдання вимагає щонайменше 50 USDT; завдання першої угоди — щонайменше 30 USDT."
      },
      "trading": {
        "en": "The displayed deposit task requires at least 50 USDT; the first trade task at least 30 USDT.",
        "zh-Hans": "页面入金任务要求至少 50 USDT，首笔交易任务要求至少 30 USDT。",
        "zh-Hant": "頁面入金任務要求至少 50 USDT，首筆交易任務要求至少 30 USDT。",
        "ja": "表示された入金タスクには少なくとも 50 USDT が必要です。最初の取引タスクは少なくとも 30 USDT。",
        "ko": "표시된 입금 작업에는 최소 50 USDT가 필요합니다. 첫 번째 거래 작업은 최소 30 USDT입니다.",
        "tr": "Gösterilen para yatırma görevi en az 50 USDT, ilk işlem görevi ise en az 30 USDT gerektirir.",
        "ar": "تتطلب مهمة الإيداع المعروضة ما لا يقل عن 50 USDT؛ ومهمة التداول الأولى لا تقل عن 30 USDT.",
        "es": "La tarea de depósito mostrada requiere al menos 50 USDT; la primera tarea comercial al menos 30 USDT.",
        "pt-BR": "A tarefa de depósito exibida requer pelo menos 50 USDT; a primeira tarefa comercial pelo menos 30 USDT.",
        "fr": "La tâche de dépôt affichée nécessite au moins 50 USDT ; la première tâche commerciale au moins 30 USDT.",
        "de": "Für die angezeigte Einzahlungsaufgabe sind mindestens 50 USDT erforderlich; die erste Handelsaufgabe mindestens 30 USDT.",
        "ru": "Для отображаемого задания на депозит требуется не менее 50 USDT; первое торговое задание — не менее 30 USDT.",
        "id": "Tugas setoran yang ditampilkan memerlukan setidaknya 50 USDT; tugas perdagangan pertama setidaknya 30 USDT.",
        "vi": "Nhiệm vụ gửi tiền được hiển thị yêu cầu ít nhất 50 USDT; nhiệm vụ giao dịch đầu tiên ít nhất 30 USDT.",
        "it": "L'attività di deposito visualizzata richiede almeno 50 USDT; la prima attività commerciale almeno 30 USDT.",
        // l10n: needs native review
        "ur": "دکھایا گیا ڈپازٹ کام کم از کم 50 USDT مانگتا ہے؛ پہلا ٹریڈ کام کم از کم 30 USDT۔",
        // l10n: needs native review
        "uk": "Відображене депозит завдання вимагає щонайменше 50 USDT; перший угода завдання — щонайменше 30 USDT."
      },
      "rewardType": {
        "en": "Task vouchers, with separate use and expiry rules",
        "zh-Hans": "任务卡券，各有用途与期限",
        "zh-Hant": "任務卡券，各有用途與期限",
        "ja": "個別の使用ルールと有効期限ルールを備えたタスクバウチャー",
        "ko": "별도의 사용 및 만료 규칙이 있는 작업 바우처",
        "tr": "Ayrı kullanım ve son kullanma kuralları olan görev kuponları",
        "ar": "قسائم المهام، مع قواعد الاستخدام وانتهاء الصلاحية المنفصلة",
        "es": "Vales de tareas, con reglas de uso y caducidad independientes",
        "pt-BR": "Vouchers de tarefas, com regras separadas de uso e vencimento",
        "fr": "Bons de tâches, avec des règles d'utilisation et d'expiration distinctes",
        "de": "Aufgabengutscheine mit getrennten Nutzungs- und Ablaufregeln",
        "ru": "Ваучеры задач с отдельными правилами использования и срока действия.",
        "id": "Voucher tugas, dengan aturan penggunaan dan kedaluwarsa terpisah",
        "vi": "Voucher nhiệm vụ, với quy tắc sử dụng và thời hạn riêng biệt",
        "it": "Voucher attività, con regole di utilizzo e scadenza separate",
        // l10n: needs native review
        "ur": "کام واؤچرز، الگ استعمال اور ختم ہونے کے قواعد کے ساتھ۔",
        // l10n: needs native review
        "uk": "Ваучери завдань, із окремим використанням і правилами закінчення строку."
      },
      "maximumConditions": {
        "en": "The public hub labels the 135 USDT welcome package as multiple vouchers, not 135 USDT of freely withdrawable cash.",
        "zh-Hans": "公开福利中心将 135 USDT 欢迎礼包逐项标为卡券，不是可自由提现的 135 USDT 现金。",
        "zh-Hant": "公開福利中心將 135 USDT 歡迎禮包逐項標為卡券，不是可自由提領的 135 USDT 現金。",
        "ja": "パブリック ハブは、135 USDT のウェルカム パッケージを、自由に引き出し可能な現金 135 USDT ではなく、複数のバウチャーとしてラベル付けします。",
        "ko": "공개 허브는 135 USDT 환영 패키지를 자유롭게 인출 가능한 현금 135 USDT가 아닌 다중 바우처로 표시합니다.",
        "tr": "Herkese açık ödül merkezi, 135 USDT'lik hoş geldin paketini serbestçe çekilebilen 135 USDT nakit olarak değil, birden fazla kupon olarak gösteriyor.",
        "ar": "يصنف المركز العام الحزمة الترحيبية البالغة 135 USDT على أنها قسائم متعددة، وليس 135 USDT من الأموال النقدية القابلة للسحب بحرية.",
        "es": "El centro público etiqueta el paquete de bienvenida de 135 USDT como vales múltiples, no 135 USDT de efectivo que se puede retirar libremente.",
        "pt-BR": "O centro público rotula o pacote de boas-vindas de 135 USDT como vouchers múltiplos, e não como 135 USDT de dinheiro que pode ser retirado gratuitamente.",
        "fr": "Le hub public qualifie le package de bienvenue de 135 USDT de bons multiples, et non de 135 USDT d'espèces librement retirables.",
        "de": "Der öffentliche Hub kennzeichnet das 135 USDT-Willkommenspaket als Mehrfachgutscheine und nicht als 135 USDT frei abhebbares Bargeld.",
        "ru": "Публичный хаб маркирует приветственный пакет на сумму 135 USDT как несколько ваучеров, а не как свободно выводимые наличные на сумму 135 USDT.",
        "id": "Pusat publik memberi label paket selamat datang 135 USDT sebagai beberapa voucher, bukan uang tunai 135 USDT yang dapat ditarik secara bebas.",
        "vi": "Trang tổng quan công khai nêu rõ gói chào mừng 135 USDT gồm nhiều voucher, không phải 135 USDT tiền mặt có thể rút tự do.",
        "it": "L'hub pubblico etichetta il pacchetto di benvenuto da 135 USDT come voucher multipli, non come 135 USDT di contanti liberamente prelevabili.",
        // l10n: needs native review
        "ur": "عوامی مرکز 135 USDT کے استقبالی پیکج کو متعدد واؤچرز کہتا ہے، آزادانہ نکلوائی کے قابل نقد کے 135 USDT نہیں۔",
        // l10n: needs native review
        "uk": "Публічний хаб позначає 135 USDT вітальний пакет як кілька ваучерів, а не 135 USDT вільно вивідні кошти."
      },
      "limitations": {
        "en": "Read the account's voucher utility, claim deadline and jurisdiction before participating.",
        "zh-Hans": "参与前查看账户实际卡券用途、领取期限和适用地区。",
        "zh-Hant": "參與前查看帳戶實際卡券用途、領取期限和適用地區。",
        "ja": "参加する前に、アカウントのバウチャーユーティリティ、請求期限、および管轄権をよくお読みください。",
        "ko": "참여하기 전에 계정의 바우처 유틸리티, 청구 기한 및 관할권을 읽어보십시오.",
        "tr": "Katılmadan önce hesabın kupon hizmetini, talep tarihini ve yargı yetkisini okuyun.",
        "ar": "اقرأ فائدة قسيمة الحساب والموعد النهائي للمطالبة والاختصاص القضائي قبل المشاركة.",
        "es": "Lea la utilidad del bono de la cuenta, la fecha límite para reclamar y la jurisdicción antes de participar.",
        "pt-BR": "Leia o utilitário do voucher da conta, prazo de reivindicação e jurisdição antes de participar.",
        "fr": "Lisez l'utilitaire de bon du compte, la date limite de réclamation et la juridiction avant de participer.",
        "de": "Lesen Sie vor der Teilnahme die Gutscheinfunktion des Kontos, die Anspruchsfrist und den Gerichtsstand.",
        "ru": "Прежде чем участвовать, ознакомьтесь с полезностью ваучера учетной записи, сроком подачи заявки и юрисдикцией.",
        "id": "Baca kegunaan voucher akun, batas waktu klaim, dan yurisdiksi sebelum berpartisipasi.",
        "vi": "Đọc kỹ tiện ích voucher của tài khoản, thời hạn yêu cầu và thẩm quyền trước khi tham gia.",
        "it": "Prima di partecipare, leggi l'utilità del voucher dell'account, la scadenza per la richiesta e la giurisdizione.",
        // l10n: needs native review
        "ur": "شرکت کرنے سے پہلے اکاؤنٹ کی واؤچر استعمال، کلیم کی آخری تاریخ اور دائرہ اختیار پڑھیں۔",
        // l10n: needs native review
        "uk": "Перед участь прочитайте використання ваучера, кінцевий строк отримання і юрисдикцію акаунта."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/ریجن اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Для цієї конкретної пропозиції не встановлено повний список придатності країн/регіонів."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        }
      ]
    },
    "notices": [
      {
        "en": "The dated Gate Europe campaign must not be presented as ongoing after its end time; it is not a global Gate offer.",
        "zh-Hans": "到达截止时间后，不得继续将该 Gate Europe 活动标为进行中，也不能作为全球 Gate 优惠展示。",
        "zh-Hant": "到達截止時間後，不得繼續將該 Gate Europe 活動標為進行中，也不能作為全球 Gate 優惠展示。",
        "ja": "日付付きの Gate Europe キャンペーンは、終了時刻以降に進行中であるように表示してはなりません。これはグローバルな Gate オファーではありません。",
        "ko": "날짜가 지정된 Gate Europe 캠페인은 종료 시간 이후에 진행 중인 것으로 표시되어서는 안 됩니다. 이는 글로벌 게이트 제안이 아닙니다.",
        "tr": "Tarihli Gate Europe kampanyası, bitiş zamanından sonra devam ediyormuş gibi sunulmamalıdır; bu küresel bir Gate teklifi değildir.",
        "ar": "يجب ألا يتم تقديم حملة Gate Europe المؤرخة على أنها مستمرة بعد وقت انتهائها؛ إنه ليس عرضًا عالميًا للبوابة.",
        "es": "La campaña Gate Europe fechada no debe presentarse como en curso después de su fecha de finalización; no es una oferta global de Gate.",
        "pt-BR": "A datada campanha Gate Europe não deve ser apresentada como em curso após o seu fim; não é uma oferta global da Gate.",
        "fr": "La campagne datée Gate Europe ne doit pas être présentée comme étant en cours après son heure de fin ; il ne s’agit pas d’une offre Gate globale.",
        "de": "Die veraltete Gate-Europe-Kampagne darf nicht als nach ihrem Ende noch andauernd dargestellt werden; Es handelt sich nicht um ein globales Gate-Angebot.",
        "ru": "Датированную кампанию Gate Europe нельзя представлять как продолжающуюся после времени ее окончания; это не глобальное предложение Gate.",
        "id": "Kampanye Gerbang Eropa yang tertanggal tidak boleh dianggap sedang berlangsung setelah masa berakhirnya; ini bukan tawaran Gate global.",
        "vi": "Chiến dịch Gate Europe ghi ngày không được thể hiện là đang diễn ra sau thời gian kết thúc; nó không phải là một ưu đãi Cổng toàn cầu.",
        "it": "La datata campagna Gate Europe non deve essere presentata come in corso dopo la sua fine; non è un'offerta Gate globale.",
        // l10n: needs native review
        "ur": "تاریخ شدہ Gate Europe مہم کو اس کے اختتامی وقت کے بعد جاری نہیں دکھانا چاہیے؛ یہ عالمی Gate پیشکش نہیں۔",
        // l10n: needs native review
        "uk": "Датовану кампанію Gate Europe не можна подавати як поточну після часу її завершення; це не глобальна пропозиція Gate."
      }
    ]
  },
  "kucoin": {
    "summary": {
      "en": "KuCoin's hub separates coupon rewards, crypto rewards and futures trial funds; withdrawal can require an additional threshold.",
      "zh-Hans": "KuCoin 福利中心区分卡券、加密资产奖励与合约体验金，提取奖励还可能有额外门槛。",
      "zh-Hant": "KuCoin 福利中心區分卡券、加密資產獎勵與合約體驗金，提領獎勵還可能有額外門檻。",
      "ja": "KuCoin のハブは、クーポン報酬、仮想通貨報酬、先物トライアル資金を分離します。引き出しには追加のしきい値が必要になる場合があります。",
      "ko": "KuCoin의 허브는 쿠폰 보상, 암호화폐 보상 및 선물 평가판 자금을 분리합니다. 인출에는 추가 기준이 필요할 수 있습니다.",
      "tr": "KuCoin'in merkezi kupon ödüllerini, kripto ödüllerini ve vadeli işlem deneme fonlarını ayırıyor; çekilme ek bir eşik gerektirebilir.",
      "ar": "يفصل مركز KuCoin بين مكافآت القسيمة ومكافآت العملات المشفرة وصناديق التجارب الآجلة؛ قد يتطلب الانسحاب عتبة إضافية.",
      "es": "El centro de KuCoin separa las recompensas de cupones, las recompensas de criptomonedas y los fondos de prueba de futuros; el retiro puede requerir un umbral adicional.",
      "pt-BR": "O hub da KuCoin separa recompensas de cupons, recompensas criptográficas e fundos de teste de futuros; a retirada pode exigir um limite adicional.",
      "fr": "Le hub de KuCoin sépare les récompenses de coupons, les récompenses cryptographiques et les fonds d'essai à terme ; le retrait peut nécessiter un seuil supplémentaire.",
      "de": "Der Hub von KuCoin trennt Coupon-Prämien, Krypto-Prämien und Futures-Testfonds; Für die Auszahlung kann ein zusätzlicher Schwellenwert erforderlich sein.",
      "ru": "Центр KuCoin разделяет купонные вознаграждения, крипто-вознаграждения и пробные фонды фьючерсов; для вывода может потребоваться дополнительный порог.",
      "id": "Hub KuCoin memisahkan imbalan kupon, imbalan kripto, dan dana uji coba berjangka; penarikan mungkin memerlukan ambang batas tambahan.",
      "vi": "Trung tâm của KuCoin tách biệt phần thưởng phiếu giảm giá, phần thưởng tiền điện tử và quỹ dùng thử hợp đồng tương lai; việc rút tiền có thể yêu cầu một ngưỡng bổ sung.",
      "it": "L'hub di KuCoin separa i premi in coupon, i premi in criptovaluta e i fondi di prova dei futures; il ritiro può richiedere una soglia aggiuntiva.",
      // l10n: needs native review
      "ur": "KuCoin کا مرکز کوپن انعامات، کرپٹو انعامات اور فیوچر آزمائشی فنڈز کو الگ کرتا ہے؛ نکلوائی کے لیے اضافی حد درکار ہو سکتی ہے۔",
      // l10n: needs native review
      "uk": "Хаб KuCoin розділяє купонні винагороди, криптовинагороди і пробні ф’ючерсні кошти; для виведення може знадобитися додатковий поріг."
    },
    "signupReward": {
      "summary": {
        "en": "The FAQ advertises an aggregate up to 3,200 USDT in USDT and coupons; some task rewards are random and withdrawal is conditional.",
        "zh-Hans": "FAQ 宣传 USDT 与卡券合计最高 3,200 USDT，部分任务随机发奖，提取奖励另有条件。",
        "zh-Hant": "FAQ 宣傳 USDT 與卡券合計最高 3,200 USDT，部分任務隨機發獎，提領獎勵另有條件。",
        "ja": "FAQ では、USDT とクーポンで合計最大 3,200 USDT を宣伝しています。一部のタスクの報酬はランダムであり、撤退には条件があります。",
        "ko": "FAQ에서는 총 3,200 USDT의 USDT 및 쿠폰을 광고합니다. 일부 작업 보상은 무작위이며 철회는 조건부입니다.",
        "tr": "SSS'de toplam 3.200 USDT'ye varan USDT ve kupon ödülleri tanıtılıyor; bazı görev ödülleri rastgeledir ve çekim işlemleri koşullara tabidir.",
        "ar": "تعلن الأسئلة الشائعة عن إجمالي ما يصل إلى 3200 USDT من USDT وكوبونات؛ بعض مكافآت المهام عشوائية والانسحاب مشروط.",
        "es": "Las preguntas frecuentes anuncian un total de hasta 3200 USDT en USDT y cupones; Algunas recompensas de tareas son aleatorias y el retiro es condicional.",
        "pt-BR": "O FAQ anuncia um total de até 3.200 USDT em USDT e cupons; algumas recompensas de tarefas são aleatórias e a retirada é condicional.",
        "fr": "La FAQ annonce un total allant jusqu'à 3 200 USDT en USDT et en coupons ; certaines récompenses de tâches sont aléatoires et le retrait est conditionnel.",
        "de": "Die FAQ bewirbt einen Gesamtbetrag von bis zu 3.200 USDT in USDT und Coupons; Einige Aufgabenbelohnungen sind zufällig und die Auszahlung ist an Bedingungen geknüpft.",
        "ru": "В разделе «Часто задаваемые вопросы» рекламируется совокупная сумма до 3 200 USDT в USDT и купонах; награды за некоторые задания являются случайными, а их вывод обусловлен выполнением условий.",
        "id": "FAQ mengiklankan total hingga 3.200 USDT dalam USDT dan kupon; beberapa hadiah tugas bersifat acak dan penarikannya bersyarat.",
        "vi": "Câu hỏi thường gặp quảng cáo tổng số tiền lên tới 3.200 USDT bằng USDT và phiếu giảm giá; một số phần thưởng nhiệm vụ là ngẫu nhiên và việc rút tiền có điều kiện.",
        "it": "Le FAQ pubblicizzano un totale fino a 3.200 USDT in USDT e coupon; alcune ricompense di attività sono casuali e il ritiro è condizionato.",
        // l10n: needs native review
        "ur": "FAQ USDT اور کوپنز میں مجموعی طور پر 3,200 USDT تک مشتہر کرتا ہے؛ کچھ کام انعامات بےترتیب ہیں اور نکاسی مشروط ہے۔",
        // l10n: needs native review
        "uk": "FAQ рекламує сукупно до 3,200 USDT у USDT і купони; деякі завдання винагороди випадкові, а виведення є умовним."
      },
      "conditions": [
        {
          "en": "Complete the relevant new-user tasks within 30 days of registration; participation is once per user.",
          "zh-Hans": "相关新客任务需在注册后三十天内完成，每位用户只能参加一次。",
          "zh-Hant": "相關新客任務需在註冊後三十天內完成，每位用戶只能參加一次。",
          "ja": "登録後 30 日以内に関連する新規ユーザーのタスクを完了してください。参加は1ユーザーにつき1回となります。",
          "ko": "등록 후 30일 이내에 관련 신규 사용자 작업을 완료합니다. 참여는 사용자 당 한 번입니다.",
          "tr": "İlgili yeni kullanıcı görevlerini kayıttan sonraki 30 gün içinde tamamlayın; katılım kullanıcı başına bir defadır.",
          "ar": "أكمل مهام المستخدم الجديد ذات الصلة خلال 30 يومًا من التسجيل؛ المشاركة تكون مرة واحدة لكل مستخدم.",
          "es": "Completar las tareas relevantes para nuevos usuarios dentro de los 30 días posteriores al registro; La participación es una vez por usuario.",
          "pt-BR": "Conclua as tarefas relevantes do novo usuário em até 30 dias após o registro; a participação é uma vez por usuário.",
          "fr": "Effectuer les tâches pertinentes pour les nouveaux utilisateurs dans les 30 jours suivant l'inscription ; la participation est une fois par utilisateur.",
          "de": "Erledigen Sie die relevanten Aufgaben für neue Benutzer innerhalb von 30 Tagen nach der Registrierung. Die Teilnahme ist einmal pro Benutzer möglich.",
          "ru": "Выполните соответствующие задачи для новых пользователей в течение 30 дней с момента регистрации; участие один раз для каждого пользователя.",
          "id": "Selesaikan tugas pengguna baru yang relevan dalam waktu 30 hari setelah pendaftaran; partisipasi adalah satu kali per pengguna.",
          "vi": "Hoàn thành các nhiệm vụ liên quan của người dùng mới trong vòng 30 ngày kể từ ngày đăng ký; sự tham gia là một lần cho mỗi người dùng.",
          "it": "Completare le attività pertinenti per i nuovi utenti entro 30 giorni dalla registrazione; la partecipazione è una volta per utente.",
          // l10n: needs native review
          "ur": "رجسٹریشن کے 30 دن کے اندر متعلقہ نیا-صارف کام مکمل کریں؛ شرکت فی صارف ایک بار ہے۔",
          // l10n: needs native review
          "uk": "Виконайте відповідний новий-користувач завдання протягом 30 днів після реєстрація; участь дозволена один раз на користувача."
        },
        {
          "en": "Verify whether the selected task needs identity checks, a first purchase/deposit or a specific trade.",
          "zh-Hans": "查看所选任务是否需要身份验证、首次购买或入金，以及指定交易。",
          "zh-Hant": "查看所選任務是否需要身分驗證、首次購買或入金，以及指定交易。",
          "ja": "選択したタスクに ID チェック、最初の購入/入金、または特定の取引が必要かどうかを確認します。",
          "ko": "선택한 작업에 신원 확인, 첫 구매/입금 또는 특정 거래가 필요한지 확인하세요.",
          "tr": "Seçtiğiniz görevin kimlik doğrulaması, ilk satın alma/para yatırma veya belirli bir işlem gerektirip gerektirmediğini kontrol edin.",
          "ar": "تحقق مما إذا كانت المهمة المحددة تحتاج إلى التحقق من الهوية أو الشراء/الإيداع الأول أو تجارة محددة.",
          "es": "Verifique si la tarea seleccionada necesita controles de identidad, una primera compra/depósito o un comercio específico.",
          "pt-BR": "Verifique se a tarefa selecionada necessita de verificação de identidade, uma primeira compra/depósito ou uma negociação específica.",
          "fr": "Vérifiez si la tâche sélectionnée nécessite des contrôles d'identité, un premier achat/dépôt ou un échange spécifique.",
          "de": "Überprüfen Sie, ob für die ausgewählte Aufgabe eine Identitätsprüfung, ein erster Kauf/eine erste Einzahlung oder ein bestimmter Handel erforderlich ist.",
          "ru": "Проверьте, требует ли выбранная задача проверки личности, первой покупки/депозита или конкретной сделки.",
          "id": "Verifikasi apakah tugas yang dipilih memerlukan pemeriksaan identitas, pembelian/deposit pertama, atau perdagangan tertentu.",
          "vi": "Xác minh xem nhiệm vụ đã chọn có cần kiểm tra danh tính, giao dịch mua/gửi tiền đầu tiên hay giao dịch cụ thể hay không.",
          "it": "Verifica se l'attività selezionata necessita di controlli di identità, di un primo acquisto/deposito o di un'operazione specifica.",
          // l10n: needs native review
          "ur": "تصدیق کریں کہ منتخب کام کو شناختی چیکس، پہلی خریداری/ڈپازٹ یا مخصوص ٹریڈ چاہیے یا نہیں۔",
          // l10n: needs native review
          "uk": "Перевірте, чи вибране завдання потребує перевірки особи, перша купівля/депозит або конкретна угода."
        },
        {
          "en": "Check the reward withdrawal threshold, claim deadline and coupon expiry rather than relying on the headline maximum.",
          "zh-Hans": "核对奖励提取门槛、领取期限与卡券有效期，不仅看宣传最高额。",
          "zh-Hant": "核對獎勵提領門檻、領取期限與卡券有效期，不僅看宣傳最高額。",
          "ja": "ヘッドラインの最大額に依存するのではなく、特典の引き出ししきい値、請求期限、クーポンの有効期限を確認してください。",
          "ko": "헤드라인 최대 금액에 의존하기보다는 보상 철회 기준, 청구 기한 및 쿠폰 만료를 확인하세요.",
          "tr": "Maksimum tutara güvenmek yerine, ödül çekme eşiğini, talep tarihini ve kuponun geçerlilik süresini kontrol edin.",
          "ar": "تحقق من حد سحب المكافأة والموعد النهائي للمطالبة وانتهاء صلاحية القسيمة بدلاً من الاعتماد على الحد الأقصى للعنوان.",
          "es": "Verifique el umbral de retiro de recompensas, la fecha límite para reclamar y el vencimiento del cupón en lugar de confiar en el máximo del título.",
          "pt-BR": "Verifique o limite de retirada da recompensa, o prazo de reivindicação e o vencimento do cupom, em vez de confiar no máximo do título.",
          "fr": "Vérifiez le seuil de retrait des récompenses, la date limite de réclamation et l’expiration du coupon plutôt que de vous fier au maximum global.",
          "de": "Überprüfen Sie den Auszahlungsschwellenwert für Prämien, die Anspruchsfrist und den Coupon-Ablauf, anstatt sich auf das Schlagzeilenmaximum zu verlassen.",
          "ru": "Проверьте порог вывода вознаграждения, крайний срок подачи заявки и срок действия купона, а не полагайтесь на максимальный размер заголовка.",
          "id": "Periksa ambang batas penarikan hadiah, tenggat waktu klaim, dan masa berlaku kupon daripada mengandalkan jumlah maksimum.",
          "vi": "Kiểm tra ngưỡng rút tiền thưởng, thời hạn yêu cầu và hết hạn phiếu giảm giá thay vì dựa vào mức tiêu đề tối đa.",
          "it": "Controlla la soglia di prelievo del premio, la scadenza per la richiesta e la scadenza del coupon invece di fare affidamento sul massimo del titolo.",
          // l10n: needs native review
          "ur": "سرخی والی زیادہ سے زیادہ رقم پر بھروسا کرنے کے بجائے انعام نکاسی حد، دعویٰ آخری تاریخ اور کوپن اختتام چیک کریں۔",
          // l10n: needs native review
          "uk": "Перевірте поріг виведення винагороди, дедлайн заявки і закінчення купона замість покладатися на максимум із заголовка."
        }
      ]
    },
    "sources": {
      "kucoin-rewards-faq": {
        "summary": {
          "en": "The help page describes distinct reward balances and a separate registration/completion/claim requirement for limited-time futures tasks.",
          "zh-Hans": "帮助页分别说明不同奖励余额；限时合约任务要求报名、完成任务和领取均在期限内。",
          "zh-Hant": "說明頁分別說明不同獎勵餘額；限時合約任務要求報名、完成任務和領取均在期限內。",
          "ja": "ヘルプ ページでは、個別の報酬残高と、期間限定の先物タスクの個別の登録/完了/請求要件について説明します。",
          "ko": "도움말 페이지에는 기간 한정 선물 작업에 대한 별도의 보상 잔액과 별도의 등록/완료/청구 요구 사항이 설명되어 있습니다.",
          "tr": "Yardım sayfasında farklı ödül bakiyeleri ve sınırlı süreli vadeli işlemler için ayrı bir kayıt/tamamlama/talep gereksinimi açıklanmaktadır.",
          "ar": "تصف صفحة المساعدة أرصدة المكافآت المميزة ومتطلبات التسجيل/الإكمال/المطالبة المنفصلة للمهام الآجلة لفترة محدودة.",
          "es": "La página de ayuda describe distintos saldos de recompensas y un requisito de registro/finalización/reclamación por separado para tareas de futuros por tiempo limitado.",
          "pt-BR": "A página de ajuda descreve saldos de recompensa distintos e um requisito separado de registro/conclusão/reivindicação para tarefas futuras por tempo limitado.",
          "fr": "La page d'aide décrit des soldes de récompense distincts et une exigence distincte d'enregistrement/d'achèvement/de réclamation pour les tâches futures à durée limitée.",
          "de": "Auf der Hilfeseite werden unterschiedliche Prämiensalden und eine separate Registrierungs-/Abschluss-/Anspruchsvoraussetzung für zeitlich begrenzte Futures-Aufgaben beschrieben.",
          "ru": "На странице справки описаны отдельные балансы вознаграждений и отдельные требования к регистрации/завершению/требованию для фьючерсных задач с ограниченным временем.",
          "id": "Halaman bantuan menjelaskan saldo hadiah yang berbeda dan persyaratan pendaftaran/penyelesaian/klaim terpisah untuk tugas berjangka waktu terbatas.",
          "vi": "Trang trợ giúp mô tả số dư phần thưởng riêng biệt và yêu cầu đăng ký/hoàn thành/yêu cầu riêng biệt cho các nhiệm vụ trong tương lai trong thời gian giới hạn.",
          "it": "La pagina della guida descrive saldi di ricompensa distinti e un requisito separato di registrazione/completamento/richiesta per attività future a tempo limitato.",
          // l10n: needs native review
          "ur": "ہیلپ پیج الگ انعامی بیلنسز اور محدود مدت کے فیوچر کام کے لیے الگ رجسٹریشن، تکمیل اور کلیم کی شرط بیان کرتا ہے۔",
          // l10n: needs native review
          "uk": "Сторінка довідки описує окремі баланси винагород і окрему вимогу реєстрації, завершення й отримання для обмежених у часі ф’ючерсні завдання."
        }
      },
      "kucoin-marscoin-september": {
        "summary": {
          "en": "The MARSCOIN/USDT spot notice specifies BSC-BEP20 deposits, a 5 September 06:00–07:00 UTC auction, 07:00 UTC trading and 6 September 10:00 UTC withdrawals. The displayed publication clock has no timezone. This is not a verified giveaway or service-status test.",
          "zh-Hans": "MARSCOIN/USDT 现货公告列出 BSC-BEP20 入金、9 月 5 日 06:00–07:00 UTC 集合竞价、07:00 UTC 交易及 9 月 6 日 10:00 UTC 提币。页面发布时钟未标时区，不作为赠币或实时服务可用性证明。",
          "zh-Hant": "MARSCOIN/USDT 現貨公告列出 BSC-BEP20 入金、9 月 5 日 06:00–07:00 UTC 集合競價、07:00 UTC 交易及 9 月 6 日 10:00 UTC 提幣。頁面發布時鐘未標時區，不作為贈幣或即時服務可用性證明。",
          "ja": "MARSCOIN/USDT の現物告知は、BSC-BEP20 入金、9 月 5 日 06:00–07:00 UTC のオークション、07:00 UTC の取引開始、9 月 6 日 10:00 UTC の出金を示しています。表示された公開時刻にはタイムゾーンがありません。これは検証済みの配布やサービス稼働状況の証明ではありません。",
          "ko": "MARSCOIN/USDT 현물 공지는 BSC-BEP20 입금, 9월 5일 06:00–07:00 UTC 경매, 07:00 UTC 거래 및 9월 6일 10:00 UTC 출금을 명시합니다. 표시된 게시 시각에는 시간대가 없습니다. 이는 검증된 증정이나 서비스 상태 테스트가 아닙니다.",
          "tr": "MARSCOIN/USDT spot duyurusu BSC-BEP20 yatırma işlemlerini, 5 Eylül 06:00–07:00 UTC açık artırmasını, 07:00 UTC işlemleri ve 6 Eylül 10:00 UTC çekimlerini belirtir. Gösterilen yayın saatinin zaman dilimi yoktur. Bu, doğrulanmış bir hediye veya hizmet durumu testi değildir.",
          "ar": "يحدد إشعار التداول الفوري MARSCOIN/USDT إيداعات BSC-BEP20، ومزاد 5 سبتمبر 06:00–07:00 UTC، والتداول عند 07:00 UTC، وعمليات السحب في 6 سبتمبر 10:00 UTC. وقت النشر المعروض لا يتضمن منطقة زمنية. هذا ليس هبة موثقة ولا اختبارًا لحالة الخدمة.",
          "es": "El aviso spot MARSCOIN/USDT especifica depósitos BSC-BEP20, una subasta el 5 de septiembre de 06:00 a 07:00 UTC, negociación a las 07:00 UTC y retiros el 6 de septiembre a las 10:00 UTC. El reloj de publicación mostrado no incluye zona horaria. No es un obsequio verificado ni una prueba del estado del servicio.",
          "pt-BR": "O aviso spot MARSCOIN/USDT especifica depósitos BSC-BEP20, leilão em 5 de setembro das 06h00 às 07h00 UTC, negociação às 07h00 UTC e saques em 6 de setembro às 10h00 UTC. O horário de publicação exibido não tem fuso horário. Não é uma oferta verificada nem um teste de status do serviço.",
          "fr": "L'avis spot MARSCOIN/USDT précise les dépôts BSC-BEP20, une enchère le 5 septembre de 06:00 à 07:00 UTC, la négociation à 07:00 UTC et les retraits le 6 septembre à 10:00 UTC. L'heure de publication affichée n'indique pas de fuseau horaire. Ce n'est ni un cadeau vérifié ni un test d'état du service.",
          "de": "Die MARSCOIN/USDT-Spot-Mitteilung nennt BSC-BEP20-Einzahlungen, eine Auktion am 5. September von 06:00–07:00 UTC, Handel um 07:00 UTC und Auszahlungen am 6. September um 10:00 UTC. Die angezeigte Veröffentlichungszeit hat keine Zeitzone. Dies ist kein verifiziertes Giveaway und kein Servicestatus-Test.",
          "ru": "Спотовое уведомление MARSCOIN/USDT указывает депозиты BSC-BEP20, аукцион 5 сентября 06:00–07:00 UTC, торговлю в 07:00 UTC и вывод средств 6 сентября в 10:00 UTC. У указанного времени публикации нет часового пояса. Это не подтвержденная раздача и не тест статуса сервиса.",
          "id": "Pemberitahuan spot MARSCOIN/USDT menetapkan setoran BSC-BEP20, lelang 5 September 06:00–07:00 UTC, perdagangan 07:00 UTC, dan penarikan 6 September 10:00 UTC. Jam publikasi yang ditampilkan tidak memiliki zona waktu. Ini bukan giveaway terverifikasi atau uji status layanan.",
          "vi": "Thông báo spot MARSCOIN/USDT nêu tiền gửi BSC-BEP20, phiên đấu giá ngày 5 tháng 9 từ 06:00–07:00 UTC, giao dịch lúc 07:00 UTC và rút tiền ngày 6 tháng 9 lúc 10:00 UTC. Thời điểm xuất bản hiển thị không có múi giờ. Đây không phải quà tặng đã xác minh hay bài kiểm tra trạng thái dịch vụ.",
          "it": "L'avviso spot MARSCOIN/USDT specifica depositi BSC-BEP20, un'asta il 5 settembre dalle 06:00 alle 07:00 UTC, trading alle 07:00 UTC e prelievi il 6 settembre alle 10:00 UTC. L'orario di pubblicazione visualizzato non ha fuso orario. Non è un giveaway verificato né un test sullo stato del servizio.",
          // l10n: needs native review
          "ur": "MARSCOIN/USDT اسپاٹ نوٹس میں BSC-BEP20 ڈپازٹس، 5 ستمبر کو 06:00–07:00 UTC نیلامی، 07:00 UTC ٹریڈنگ اور 6 ستمبر کو 10:00 UTC نکلوائی درج ہے۔ دکھایا گیا اشاعتی وقت ٹائم زون کے بغیر ہے۔ یہ تصدیق شدہ گِو اوے یا سروس اسٹیٹس ٹیسٹ نہیں۔",
          // l10n: needs native review
          "uk": "Спотове повідомлення MARSCOIN/USDT зазначає депозити BSC-BEP20, аукціон 5 вересня 06:00–07:00 UTC, торгівлю о 07:00 UTC і виведення 6 вересня о 10:00 UTC. Показаний час публікації не має часового поясу. Це не підтверджений розіграш і не тест статусу сервісу."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "Complete the relevant new-user tasks within 30 days of registration; participation is once per user.",
        "zh-Hans": "相关新客任务需在注册后三十天内完成，每位用户只能参加一次。",
        "zh-Hant": "相關新客任務需在註冊後三十天內完成，每位用戶只能參加一次。",
        "ja": "登録後 30 日以内に関連する新規ユーザーのタスクを完了してください。参加は1ユーザーにつき1回となります。",
        "ko": "등록 후 30일 이내에 관련 신규 사용자 작업을 완료합니다. 참여는 사용자 당 한 번입니다.",
        "tr": "İlgili yeni kullanıcı görevlerini kayıttan sonraki 30 gün içinde tamamlayın; katılım kullanıcı başına bir defadır.",
        "ar": "أكمل مهام المستخدم الجديد ذات الصلة خلال 30 يومًا من التسجيل؛ المشاركة تكون مرة واحدة لكل مستخدم.",
        "es": "Completar las tareas relevantes para nuevos usuarios dentro de los 30 días posteriores al registro; La participación es una vez por usuario.",
        "pt-BR": "Conclua as tarefas relevantes do novo usuário em até 30 dias após o registro; a participação é uma vez por usuário.",
        "fr": "Effectuer les tâches pertinentes pour les nouveaux utilisateurs dans les 30 jours suivant l'inscription ; la participation est une fois par utilisateur.",
        "de": "Erledigen Sie die relevanten Aufgaben für neue Benutzer innerhalb von 30 Tagen nach der Registrierung. Die Teilnahme ist einmal pro Benutzer möglich.",
        "ru": "Выполните соответствующие задачи для новых пользователей в течение 30 дней с момента регистрации; участие один раз для каждого пользователя.",
        "id": "Selesaikan tugas pengguna baru yang relevan dalam waktu 30 hari setelah pendaftaran; partisipasi adalah satu kali per pengguna.",
        "vi": "Hoàn thành các nhiệm vụ liên quan của người dùng mới trong vòng 30 ngày kể từ ngày đăng ký; sự tham gia là một lần cho mỗi người dùng.",
        "it": "Completare le attività pertinenti per i nuovi utenti entro 30 giorni dalla registrazione; la partecipazione è una volta per utente.",
        // l10n: needs native review
        "ur": "رجسٹریشن کے 30 دن کے اندر متعلقہ نئے صارف کے کام مکمل کریں؛ شرکت فی صارف ایک بار ہے۔",
        // l10n: needs native review
        "uk": "Виконайте відповідні завдання нового користувача протягом 30 днів після реєстрації; участь один раз на користувача."
      },
      "kyc": {
        "en": "Verify whether the selected task needs identity checks, a first purchase/deposit or a specific trade.",
        "zh-Hans": "查看所选任务是否需要身份验证、首次购买或入金，以及指定交易。",
        "zh-Hant": "查看所選任務是否需要身分驗證、首次購買或入金，以及指定交易。",
        "ja": "選択したタスクに ID チェック、最初の購入/入金、または特定の取引が必要かどうかを確認します。",
        "ko": "선택한 작업에 신원 확인, 첫 구매/입금 또는 특정 거래가 필요한지 확인하세요.",
        "tr": "Seçtiğiniz görevin kimlik doğrulaması, ilk satın alma/para yatırma veya belirli bir işlem gerektirip gerektirmediğini kontrol edin.",
        "ar": "تحقق مما إذا كانت المهمة المحددة تحتاج إلى التحقق من الهوية أو الشراء/الإيداع الأول أو تجارة محددة.",
        "es": "Verifique si la tarea seleccionada necesita controles de identidad, una primera compra/depósito o un comercio específico.",
        "pt-BR": "Verifique se a tarefa selecionada necessita de verificação de identidade, uma primeira compra/depósito ou uma negociação específica.",
        "fr": "Vérifiez si la tâche sélectionnée nécessite des contrôles d'identité, un premier achat/dépôt ou un échange spécifique.",
        "de": "Überprüfen Sie, ob für die ausgewählte Aufgabe eine Identitätsprüfung, ein erster Kauf/eine erste Einzahlung oder ein bestimmter Handel erforderlich ist.",
        "ru": "Проверьте, требует ли выбранная задача проверки личности, первой покупки/депозита или конкретной сделки.",
        "id": "Verifikasi apakah tugas yang dipilih memerlukan pemeriksaan identitas, pembelian/deposit pertama, atau perdagangan tertentu.",
        "vi": "Xác minh xem nhiệm vụ đã chọn có cần kiểm tra danh tính, giao dịch mua/gửi tiền đầu tiên hay giao dịch cụ thể hay không.",
        "it": "Verifica se l'attività selezionata necessita di controlli di identità, di un primo acquisto/deposito o di un'operazione specifica.",
        // l10n: needs native review
        "ur": "تصدیق کریں کہ منتخب کام کو شناختی چیکس، پہلی خریداری/ڈپازٹ یا مخصوص ٹریڈ چاہیے یا نہیں۔",
        // l10n: needs native review
        "uk": "Перевірте, чи вибране завдання потребує перевірки особи, перша купівля/депозит або конкретна угода."
      },
      "deposit": {
        "en": "Verify whether the selected task needs identity checks, a first purchase/deposit or a specific trade.",
        "zh-Hans": "查看所选任务是否需要身份验证、首次购买或入金，以及指定交易。",
        "zh-Hant": "查看所選任務是否需要身分驗證、首次購買或入金，以及指定交易。",
        "ja": "選択したタスクに ID チェック、最初の購入/入金、または特定の取引が必要かどうかを確認します。",
        "ko": "선택한 작업에 신원 확인, 첫 구매/입금 또는 특정 거래가 필요한지 확인하세요.",
        "tr": "Seçtiğiniz görevin kimlik doğrulaması, ilk satın alma/para yatırma veya belirli bir işlem gerektirip gerektirmediğini kontrol edin.",
        "ar": "تحقق مما إذا كانت المهمة المحددة تحتاج إلى التحقق من الهوية أو الشراء/الإيداع الأول أو تجارة محددة.",
        "es": "Verifique si la tarea seleccionada necesita controles de identidad, una primera compra/depósito o un comercio específico.",
        "pt-BR": "Verifique se a tarefa selecionada necessita de verificação de identidade, uma primeira compra/depósito ou uma negociação específica.",
        "fr": "Vérifiez si la tâche sélectionnée nécessite des contrôles d'identité, un premier achat/dépôt ou un échange spécifique.",
        "de": "Überprüfen Sie, ob für die ausgewählte Aufgabe eine Identitätsprüfung, ein erster Kauf/eine erste Einzahlung oder ein bestimmter Handel erforderlich ist.",
        "ru": "Проверьте, требует ли выбранная задача проверки личности, первой покупки/депозита или конкретной сделки.",
        "id": "Verifikasi apakah tugas yang dipilih memerlukan pemeriksaan identitas, pembelian/deposit pertama, atau perdagangan tertentu.",
        "vi": "Xác minh xem nhiệm vụ đã chọn có cần kiểm tra danh tính, giao dịch mua/gửi tiền đầu tiên hay giao dịch cụ thể hay không.",
        "it": "Verifica se l'attività selezionata necessita di controlli di identità, di un primo acquisto/deposito o di un'operazione specifica.",
        // l10n: needs native review
        "ur": "تصدیق کریں کہ منتخب کام کو شناختی تصدیق، پہلی خریداری/ڈپازٹ یا مخصوص ٹریڈ چاہیے یا نہیں۔",
        // l10n: needs native review
        "uk": "Перевірте, чи обраний завдання потребує ідентифікація перевірки, перший купівля/депозит або конкретний угода."
      },
      "trading": {
        "en": "Verify whether the selected task needs identity checks, a first purchase/deposit or a specific trade.",
        "zh-Hans": "查看所选任务是否需要身份验证、首次购买或入金，以及指定交易。",
        "zh-Hant": "查看所選任務是否需要身分驗證、首次購買或入金，以及指定交易。",
        "ja": "選択したタスクに ID チェック、最初の購入/入金、または特定の取引が必要かどうかを確認します。",
        "ko": "선택한 작업에 신원 확인, 첫 구매/입금 또는 특정 거래가 필요한지 확인하세요.",
        "tr": "Seçtiğiniz görevin kimlik doğrulaması, ilk satın alma/para yatırma veya belirli bir işlem gerektirip gerektirmediğini kontrol edin.",
        "ar": "تحقق مما إذا كانت المهمة المحددة تحتاج إلى التحقق من الهوية أو الشراء/الإيداع الأول أو تجارة محددة.",
        "es": "Verifique si la tarea seleccionada necesita controles de identidad, una primera compra/depósito o un comercio específico.",
        "pt-BR": "Verifique se a tarefa selecionada necessita de verificação de identidade, uma primeira compra/depósito ou uma negociação específica.",
        "fr": "Vérifiez si la tâche sélectionnée nécessite des contrôles d'identité, un premier achat/dépôt ou un échange spécifique.",
        "de": "Überprüfen Sie, ob für die ausgewählte Aufgabe eine Identitätsprüfung, ein erster Kauf/eine erste Einzahlung oder ein bestimmter Handel erforderlich ist.",
        "ru": "Проверьте, требует ли выбранная задача проверки личности, первой покупки/депозита или конкретной сделки.",
        "id": "Verifikasi apakah tugas yang dipilih memerlukan pemeriksaan identitas, pembelian/deposit pertama, atau perdagangan tertentu.",
        "vi": "Xác minh xem nhiệm vụ đã chọn có cần kiểm tra danh tính, giao dịch mua/gửi tiền đầu tiên hay giao dịch cụ thể hay không.",
        "it": "Verifica se l'attività selezionata necessita di controlli di identità, di un primo acquisto/deposito o di un'operazione specifica.",
        // l10n: needs native review
        "ur": "تصدیق کریں کہ منتخب کام کو شناختی چیکس، پہلی خریداری/ڈپازٹ یا مخصوص ٹریڈ چاہیے یا نہیں۔",
        // l10n: needs native review
        "uk": "Перевірте, чи вибране завдання потребує перевірки особи, перша купівля/депозит або конкретна угода."
      },
      "rewardType": {
        "en": "Crypto rewards and coupons with withdrawal conditions",
        "zh-Hans": "加密资产与卡券，提取另有条件",
        "zh-Hant": "加密資產與卡券，提領另有條件",
        "ja": "出金条件付きの暗号報酬とクーポン",
        "ko": "출금 조건이 있는 암호화폐 보상 및 쿠폰",
        "tr": "Para çekme koşullarına sahip kripto ödülleri ve kuponlar",
        "ar": "مكافآت وكوبونات التشفير مع شروط السحب",
        "es": "Recompensas y cupones criptográficos con condiciones de retiro",
        "pt-BR": "Recompensas e cupons criptográficos com condições de retirada",
        "fr": "Récompenses et coupons crypto avec conditions de retrait",
        "de": "Krypto-Prämien und Gutscheine mit Auszahlungsbedingungen",
        "ru": "Крипто-награды и купоны с условиями вывода средств",
        "id": "Hadiah dan kupon Crypto dengan ketentuan penarikan",
        "vi": "Phần thưởng và phiếu giảm giá tiền điện tử với điều kiện rút tiền",
        "it": "Premi e coupon cripto con condizioni di prelievo",
        // l10n: needs native review
        "ur": "کرپٹو انعامات اور کوپن نکلوائی شرائط کے ساتھ۔",
        // l10n: needs native review
        "uk": "Криптовинагороди і купони з умови виведення."
      },
      "maximumConditions": {
        "en": "The FAQ advertises an aggregate up to 3,200 USDT in USDT and coupons; some task rewards are random and withdrawal is conditional.",
        "zh-Hans": "FAQ 宣传 USDT 与卡券合计最高 3,200 USDT，部分任务随机发奖，提取奖励另有条件。",
        "zh-Hant": "FAQ 宣傳 USDT 與卡券合計最高 3,200 USDT，部分任務隨機發獎，提領獎勵另有條件。",
        "ja": "FAQ では、USDT とクーポンで合計最大 3,200 USDT を宣伝しています。一部のタスクの報酬はランダムであり、撤退には条件があります。",
        "ko": "FAQ에서는 총 3,200 USDT의 USDT 및 쿠폰을 광고합니다. 일부 작업 보상은 무작위이며 철회는 조건부입니다.",
        "tr": "SSS'de toplam 3.200 USDT'ye varan USDT ve kupon ödülleri tanıtılıyor; bazı görev ödülleri rastgeledir ve çekim işlemleri koşullara tabidir.",
        "ar": "تعلن الأسئلة الشائعة عن إجمالي ما يصل إلى 3200 USDT من USDT وكوبونات؛ بعض مكافآت المهام عشوائية والانسحاب مشروط.",
        "es": "Las preguntas frecuentes anuncian un total de hasta 3200 USDT en USDT y cupones; Algunas recompensas de tareas son aleatorias y el retiro es condicional.",
        "pt-BR": "O FAQ anuncia um total de até 3.200 USDT em USDT e cupons; algumas recompensas de tarefas são aleatórias e a retirada é condicional.",
        "fr": "La FAQ annonce un total allant jusqu'à 3 200 USDT en USDT et en coupons ; certaines récompenses de tâches sont aléatoires et le retrait est conditionnel.",
        "de": "Die FAQ bewirbt einen Gesamtbetrag von bis zu 3.200 USDT in USDT und Coupons; Einige Aufgabenbelohnungen sind zufällig und die Auszahlung ist an Bedingungen geknüpft.",
        "ru": "В разделе «Часто задаваемые вопросы» рекламируется совокупная сумма до 3 200 USDT в USDT и купонах; награды за некоторые задания являются случайными, а их вывод обусловлен выполнением условий.",
        "id": "FAQ mengiklankan total hingga 3.200 USDT dalam USDT dan kupon; beberapa hadiah tugas bersifat acak dan penarikannya bersyarat.",
        "vi": "Câu hỏi thường gặp quảng cáo tổng số tiền lên tới 3.200 USDT bằng USDT và phiếu giảm giá; một số phần thưởng nhiệm vụ là ngẫu nhiên và việc rút tiền có điều kiện.",
        "it": "Le FAQ pubblicizzano un totale fino a 3.200 USDT in USDT e coupon; alcune ricompense di attività sono casuali e il ritiro è condizionato.",
        // l10n: needs native review
        "ur": "FAQ USDT اور کوپنز میں مجموعی طور پر 3,200 USDT تک مشتہر کرتا ہے؛ کچھ کام انعامات بےترتیب ہیں اور نکاسی مشروط ہے۔",
        // l10n: needs native review
        "uk": "FAQ рекламує сукупно до 3,200 USDT у USDT і купони; деякі завдання винагороди випадкові, а виведення є умовним."
      },
      "limitations": {
        "en": "Check the reward withdrawal threshold, claim deadline and coupon expiry rather than relying on the headline maximum.",
        "zh-Hans": "核对奖励提取门槛、领取期限与卡券有效期，不仅看宣传最高额。",
        "zh-Hant": "核對獎勵提領門檻、領取期限與卡券有效期，不僅看宣傳最高額。",
        "ja": "ヘッドラインの最大額に依存するのではなく、特典の引き出ししきい値、請求期限、クーポンの有効期限を確認してください。",
        "ko": "헤드라인 최대 금액에 의존하기보다는 보상 철회 기준, 청구 기한 및 쿠폰 만료를 확인하세요.",
        "tr": "Maksimum tutara güvenmek yerine, ödül çekme eşiğini, talep tarihini ve kuponun geçerlilik süresini kontrol edin.",
        "ar": "تحقق من حد سحب المكافأة والموعد النهائي للمطالبة وانتهاء صلاحية القسيمة بدلاً من الاعتماد على الحد الأقصى للعنوان.",
        "es": "Verifique el umbral de retiro de recompensas, la fecha límite para reclamar y el vencimiento del cupón en lugar de confiar en el máximo del título.",
        "pt-BR": "Verifique o limite de retirada da recompensa, o prazo de reivindicação e o vencimento do cupom, em vez de confiar no máximo do título.",
        "fr": "Vérifiez le seuil de retrait des récompenses, la date limite de réclamation et l’expiration du coupon plutôt que de vous fier au maximum global.",
        "de": "Überprüfen Sie den Auszahlungsschwellenwert für Prämien, die Anspruchsfrist und den Coupon-Ablauf, anstatt sich auf das Schlagzeilenmaximum zu verlassen.",
        "ru": "Проверьте порог вывода вознаграждения, крайний срок подачи заявки и срок действия купона, а не полагайтесь на максимальный размер заголовка.",
        "id": "Periksa ambang batas penarikan hadiah, tenggat waktu klaim, dan masa berlaku kupon daripada mengandalkan jumlah maksimum.",
        "vi": "Kiểm tra ngưỡng rút tiền thưởng, thời hạn yêu cầu và hết hạn phiếu giảm giá thay vì dựa vào mức tiêu đề tối đa.",
        "it": "Controlla la soglia di prelievo del premio, la scadenza per la richiesta e la scadenza del coupon invece di fare affidamento sul massimo del titolo.",
        // l10n: needs native review
        "ur": "سرخی کی زیادہ سے زیادہ رقم پر انحصار کرنے کے بجائے انعام نکلوائی کی حد، کلیم کی آخری تاریخ اور کوپن ختم ہونے کی تاریخ چیک کریں۔",
        // l10n: needs native review
        "uk": "Перевірте поріг виведення винагороди, кінцевий строк отримання і закінчення дії купона, а не покладайтеся на максимум у заголовку."
      },
      "publishedDate": {
        "en": "2026-03-16 01:28:00",
        "zh-Hans": "2026-03-16 01:28:00",
        "zh-Hant": "2026-03-16 01:28:00",
        "ja": "2026-03-16 01:28:00",
        "ko": "2026-03-16 01:28:00",
        "tr": "2026-03-16 01:28:00",
        "ar": "2026-03-16 01:28:00",
        "es": "2026-03-16 01:28:00",
        "pt-BR": "16/03/2026 01:28:00",
        "fr": "2026-03-16 01:28:00",
        "de": "16.03.2026 01:28:00",
        "ru": "2026-03-16 01:28:00",
        "id": "16-03-2026 01:28:00",
        "vi": "2026-03-16 01:28:00",
        "it": "2026-03-16 01:28:00",
        // l10n: needs native review
        "ur": "2026-03-16 01:28:00",
        // l10n: needs native review
        "uk": "2026-03-16 01:28:00"
      },
      "datePrecision": {
        "en": "Source date retained as displayed; no missing timezone is inferred.",
        "zh-Hans": "保留来源显示日期，不推断缺失时区。",
        "zh-Hant": "保留來源顯示日期，不推斷缺失時區。",
        "ja": "ソースの日付は表示どおりに保持されます。欠落しているタイムゾーンは推論されません。",
        "ko": "소스 날짜는 표시된 대로 유지됩니다. 누락된 시간대는 유추되지 않습니다.",
        "tr": "Kaynak tarihi görüntülendiği şekilde tutuldu; eksik bir saat diliminin olmadığı anlaşılmaktadır.",
        "ar": "تم الاحتفاظ بتاريخ المصدر كما هو معروض؛ لا يتم استنتاج أي منطقة زمنية مفقودة.",
        "es": "La fecha de origen se conserva tal como se muestra; no se infiere ninguna zona horaria faltante.",
        "pt-BR": "Data de origem mantida conforme exibida; nenhum fuso horário ausente é inferido.",
        "fr": "Date source conservée telle qu'affichée ; aucun fuseau horaire manquant n’est déduit.",
        "de": "Quelldatum wie angezeigt beibehalten; Es wird keine fehlende Zeitzone abgeleitet.",
        "ru": "Исходная дата сохраняется в том виде, в каком она отображается; отсутствие отсутствующего часового пояса не предполагается.",
        "id": "Tanggal sumber dipertahankan seperti yang ditampilkan; tidak ada zona waktu yang hilang yang disimpulkan.",
        "vi": "Ngày nguồn được giữ lại như được hiển thị; không có múi giờ bị thiếu được suy ra.",
        "it": "Data di origine mantenuta come visualizzata; non si deduce alcun fuso orario mancante.",
        // l10n: needs native review
        "ur": "ماخذ تاریخ جیسے دکھائی گئی ویسے رکھی گئی؛ غائب وقت زون اخذ نہیں کیا گیا۔",
        // l10n: needs native review
        "uk": "Дату джерела збережено так, як показано; відсутній часовий пояс не виводиться."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The FAQ advertises an aggregate up to 3,200 USDT in USDT and coupons; some task rewards are random and withdrawal is conditional.",
          "zh-Hans": "FAQ 宣传 USDT 与卡券合计最高 3,200 USDT，部分任务随机发奖，提取奖励另有条件。",
          "zh-Hant": "FAQ 宣傳 USDT 與卡券合計最高 3,200 USDT，部分任務隨機發獎，提領獎勵另有條件。",
          "ja": "FAQ では、USDT とクーポンで合計最大 3,200 USDT を宣伝しています。一部のタスクの報酬はランダムであり、撤退には条件があります。",
          "ko": "FAQ에서는 총 3,200 USDT의 USDT 및 쿠폰을 광고합니다. 일부 작업 보상은 무작위이며 철회는 조건부입니다.",
          "tr": "SSS'de toplam 3.200 USDT'ye varan USDT ve kupon ödülleri tanıtılıyor; bazı görev ödülleri rastgeledir ve çekim işlemleri koşullara tabidir.",
          "ar": "تعلن الأسئلة الشائعة عن إجمالي ما يصل إلى 3200 USDT من USDT وكوبونات؛ بعض مكافآت المهام عشوائية والانسحاب مشروط.",
          "es": "Las preguntas frecuentes anuncian un total de hasta 3200 USDT en USDT y cupones; Algunas recompensas de tareas son aleatorias y el retiro es condicional.",
          "pt-BR": "O FAQ anuncia um total de até 3.200 USDT em USDT e cupons; algumas recompensas de tarefas são aleatórias e a retirada é condicional.",
          "fr": "La FAQ annonce un total allant jusqu'à 3 200 USDT en USDT et en coupons ; certaines récompenses de tâches sont aléatoires et le retrait est conditionnel.",
          "de": "Die FAQ bewirbt einen Gesamtbetrag von bis zu 3.200 USDT in USDT und Coupons; Einige Aufgabenbelohnungen sind zufällig und die Auszahlung ist an Bedingungen geknüpft.",
          "ru": "В разделе «Часто задаваемые вопросы» рекламируется совокупная сумма до 3 200 USDT в USDT и купонах; награды за некоторые задания являются случайными, а их вывод обусловлен выполнением условий.",
          "id": "FAQ mengiklankan total hingga 3.200 USDT dalam USDT dan kupon; beberapa hadiah tugas bersifat acak dan penarikannya bersyarat.",
          "vi": "Câu hỏi thường gặp quảng cáo tổng số tiền lên tới 3.200 USDT bằng USDT và phiếu giảm giá; một số phần thưởng nhiệm vụ là ngẫu nhiên và việc rút tiền có điều kiện.",
          "it": "Le FAQ pubblicizzano un totale fino a 3.200 USDT in USDT e coupon; alcune ricompense di attività sono casuali e il ritiro è condizionato.",
          // l10n: needs native review
          "ur": "FAQ مجموعی طور پر USDT اور کوپن میں زیادہ سے زیادہ 3,200 USDT مشتہر کرتا ہے؛ کچھ کام کے انعامات بے ترتیب ہیں اور نکلوائی مشروط ہے۔",
          // l10n: needs native review
          "uk": "FAQ рекламує сукупно до 3,200 USDT у USDT і купонах; деякі винагороди за завдання є випадкові, а виведення умовний."
        }
      ]
    }
  },
  "mexc": {
    "summary": {
      "en": "MEXC futures welcome tasks use net-deposit, holding and fee-paying-volume conditions; older campaign pages do not prove a current offer.",
      "zh-Hans": "MEXC 合约欢迎任务涉及净入金、持有期和付费交易量，旧活动页面不能证明当前仍有同一优惠。",
      "zh-Hant": "MEXC 合約歡迎任務涉及淨入金、持有期和付費交易量，舊活動頁面不能證明目前仍有同一優惠。",
      "ja": "MEXC 先物ウェルカムタスクでは、純預金、保有、および手数料支払い量の条件が使用されます。古いキャンペーン ページは現在のオファーを証明するものではありません。",
      "ko": "MEXC 선물 환영 작업은 순입금, 보유 및 수수료 지불량 조건을 사용합니다. 이전 캠페인 페이지는 현재 제안을 증명하지 않습니다.",
      "tr": "MEXC vadeli işlemleri karşılama görevleri net mevduat, tutma ve ücret ödeme hacmi koşullarını kullanır; eski kampanya sayfaları güncel bir teklifi kanıtlamaz.",
      "ar": "تستخدم المهام الترحيبية لعقود MEXC الآجلة شروط حجم الإيداع الصافي والحيازة ودفع الرسوم؛ صفحات الحملة القديمة لا تثبت العرض الحالي.",
      "es": "Las tareas de bienvenida de futuros de MEXC utilizan condiciones de depósito neto, tenencia y volumen de pago de tarifas; Las páginas de campaña más antiguas no prueban una oferta actual.",
      "pt-BR": "As tarefas de boas-vindas para futuros MEXC usam condições de depósito líquido, retenção e volume de pagamento de taxas; páginas de campanha mais antigas não representam uma oferta atual.",
      "fr": "Les tâches d'accueil des contrats à terme MEXC utilisent des conditions de dépôt net, de détention et de volume de paiement de frais ; les anciennes pages de campagne ne prouvent pas une offre actuelle.",
      "de": "MEXC-Futures-Willkommensaufgaben nutzen Nettoeinzahlungs-, Halte- und Gebührenzahlungsvolumenbedingungen; Ältere Aktionsseiten belegen kein aktuelles Angebot.",
      "ru": "Фьючерсы MEXC приветствуют задачи, использующие условия чистого депозита, владения и объема уплаты комиссий; старые страницы кампании не подтверждают актуальное предложение.",
      "id": "Kontrak berjangka MEXC menyambut tugas-tugas menggunakan ketentuan net-deposit, holding dan fee-paying-volume; halaman kampanye lama tidak membuktikan penawaran saat ini.",
      "vi": "Nhiệm vụ chào mừng hợp đồng tương lai của MEXC sử dụng các điều kiện về tiền gửi ròng, nắm giữ và khối lượng thanh toán phí; các trang chiến dịch cũ hơn không chứng minh được lời đề nghị hiện tại.",
      "it": "Le attività di benvenuto dei futures MEXC utilizzano condizioni di deposito netto, detenzione e volume di pagamento delle commissioni; le pagine delle campagne più vecchie non dimostrano un'offerta attuale.",
      // l10n: needs native review
      "ur": "MEXC فیوچرز کے استقبالی کام خالص ڈپازٹ، ہولڈنگ اور فیس دینے والے حجم کی شرائط استعمال کرتے ہیں؛ پرانے مہم صفحات موجودہ پیشکش ثابت نہیں کرتے۔",
      // l10n: needs native review
      "uk": "Вітальні завдання MEXC ф’ючерси використовують умови чистий депозит, утримання та обсяг з оплатою комісій; старі сторінки кампаній не доводять поточну пропозицію."
    },
    "signupReward": {
      "summary": {
        "en": "The August 2025 announcement is historical program guidance, not a verified current 10,000 USDT cash offer.",
        "zh-Hans": "2025 年 8 月公告只作为历史计划说明，不作为已核实的当前 10,000 USDT 现金优惠。",
        "zh-Hant": "2025 年 8 月公告只作為歷史計畫說明，不作為已核實的目前 10,000 USDT 現金優惠。",
        "ja": "2025 年 8 月の発表は過去のプログラム ガイダンスであり、現在の検証済みの 10,000 USDT 現金オファーではありません。",
        "ko": "2025년 8월 발표는 현재 검증된 10,000 USDT 현금 제안이 아닌 역사적인 프로그램 지침입니다.",
        "tr": "Ağustos 2025 duyurusu, güncel bir 10.000 USDT nakit teklifi değil, tarihi program rehberidir.",
        "ar": "يعد إعلان أغسطس 2025 بمثابة توجيه تاريخي للبرنامج، وليس عرضاً نقدياً حالياً بقيمة 10,000 USDT تم التحقق منه.",
        "es": "El anuncio de agosto de 2025 es una guía histórica del programa, no una oferta en efectivo actual verificada de 10,000 USDT.",
        "pt-BR": "O anúncio de agosto de 2025 é uma orientação histórica do programa, não uma oferta atual verificada de 10.000 USDT em dinheiro.",
        "fr": "L'annonce d'août 2025 constitue une orientation historique du programme et non une offre en espèces actuelle vérifiée de 10 000 USDT.",
        "de": "Bei der Ankündigung vom August 2025 handelt es sich um eine historische Programmprognose und nicht um ein verifiziertes aktuelles Bargeldangebot von 10.000 USDT.",
        "ru": "Объявление от августа 2025 года представляет собой историческое руководство по программе, а не подтвержденное текущее предложение наличными в размере 10 000 USDT.",
        "id": "Pengumuman pada bulan Agustus 2025 adalah panduan program historis, bukan penawaran tunai 10.000 USDT yang terverifikasi saat ini.",
        "vi": "Thông báo tháng 8 năm 2025 là hướng dẫn lịch sử của chương trình, không phải là ưu đãi tiền mặt 10.000 USDT hiện đã được xác minh.",
        "it": "L’annuncio dell’agosto 2025 rappresenta una guida storica del programma, non un’offerta in contanti verificata di 10.000 USDT attuali.",
        // l10n: needs native review
        "ur": "اگست 2025 اعلان تاریخی پروگرام رہنمائی ہے، تصدیق شدہ موجودہ 10,000 USDT نقد پیشکش نہیں۔",
        // l10n: needs native review
        "uk": "Оголошення серпня 2025 року є історичний програма настанова, а не перевірений поточний 10,000 USDT готівка пропозиція."
      },
      "conditions": [
        {
          "en": "Some tasks require advanced identity verification; confirm the account's current task.",
          "zh-Hans": "部分任务要求高级身份验证，需核对账户当前任务。",
          "zh-Hant": "部分任務要求進階身分驗證，需核對帳戶目前任務。",
          "ja": "一部のタスクでは高度な ID 検証が必要です。アカウントの現在のタスクを確認します。",
          "ko": "일부 작업에는 고급 신원 확인이 필요합니다. 계정의 현재 작업을 확인하세요.",
          "tr": "Bazı görevler gelişmiş kimlik doğrulaması gerektirir; hesabın mevcut görevini onaylayın.",
          "ar": "تتطلب بعض المهام التحقق المتقدم من الهوية؛ تأكيد المهمة الحالية للحساب.",
          "es": "Algunas tareas requieren una verificación de identidad avanzada; confirmar la tarea actual de la cuenta.",
          "pt-BR": "Algumas tarefas requerem verificação avançada de identidade; confirme a tarefa atual da conta.",
          "fr": "Certaines tâches nécessitent une vérification d'identité avancée ; confirmer la tâche actuelle du compte.",
          "de": "Für einige Aufgaben ist eine erweiterte Identitätsprüfung erforderlich. Bestätigen Sie die aktuelle Aufgabe des Kontos.",
          "ru": "Некоторые задачи требуют расширенной проверки личности; подтвердить текущую задачу аккаунта.",
          "id": "Beberapa tugas memerlukan verifikasi identitas tingkat lanjut; konfirmasikan tugas akun saat ini.",
          "vi": "Một số nhiệm vụ yêu cầu xác minh danh tính nâng cao; xác nhận nhiệm vụ hiện tại của tài khoản.",
          "it": "Alcune attività richiedono una verifica avanzata dell'identità; confermare l'attività corrente dell'account.",
          // l10n: needs native review
          "ur": "کچھ کام اعلیٰ شناختی تصدیق مانگتے ہیں؛ اکاؤنٹ کا موجودہ کام تصدیق کریں۔",
          // l10n: needs native review
          "uk": "Деякі завдання вимагають розширену перевірку особи; підтвердьте поточне завдання акаунта."
        },
        {
          "en": "The guide counts on-chain/P2P deposits, not internal transfers, and requires maintaining the task's minimum net balance.",
          "zh-Hans": "该指南计入链上与 P2P 入金、不计内部划转，并要求在任务持有期内维持最低净余额。",
          "zh-Hant": "該指南計入鏈上與 P2P 入金、不計內部劃轉，並要求在任務持有期內維持最低淨餘額。",
          "ja": "このガイドでは内部送金ではなくオンチェーン/P2P デポジットをカウントしており、タスクの最小ネット残高を維持する必要があります。",
          "ko": "가이드는 내부 전송이 아닌 온체인/P2P 예금을 계산하며 작업의 최소 순 잔액을 유지하도록 요구합니다.",
          "tr": "Kılavuz, dahili transferleri değil zincir içi/P2P mevduatlarını sayıyor ve görevin minimum net bakiyesinin korunmasını gerektiriyor.",
          "ar": "يحسب الدليل الودائع على السلسلة/P2P، وليس التحويلات الداخلية، ويتطلب الحفاظ على الحد الأدنى من صافي رصيد المهمة.",
          "es": "La guía cuenta los depósitos en cadena/P2P, no las transferencias internas, y requiere mantener el saldo neto mínimo de la tarea.",
          "pt-BR": "O guia conta depósitos em rede/P2P, não transferências internas, e exige a manutenção do saldo líquido mínimo da tarefa.",
          "fr": "Le guide compte les dépôts en chaîne/P2P, pas les transferts internes, et exige de maintenir le solde net minimum de la tâche.",
          "de": "Der Leitfaden zählt On-Chain-/P2P-Einzahlungen, nicht interne Überweisungen, und erfordert die Einhaltung des Mindestnettoguthabens der Aufgabe.",
          "ru": "Руководство учитывает внутрисетевые/P2P-депозиты, а не внутренние переводы, и требует поддержания минимального чистого баланса задачи.",
          "id": "Panduan ini menghitung setoran on-chain/P2P, bukan transfer internal, dan mengharuskan pemeliharaan saldo bersih minimum tugas.",
          "vi": "Hướng dẫn tính số tiền gửi trên chuỗi/P2P, không phải chuyển khoản nội bộ và yêu cầu duy trì số dư ròng tối thiểu của nhiệm vụ.",
          "it": "La guida conta i depositi on-chain/P2P, non i trasferimenti interni, e richiede il mantenimento del saldo netto minimo dell'attività.",
          // l10n: needs native review
          "ur": "گائیڈ آن چین/P2P ڈپازٹس شمار کرتی ہے، اندرونی منتقلیاں نہیں، اور کام کا کم از کم خالص بیلنس برقرار رکھنے کا تقاضا کرتی ہے۔",
          // l10n: needs native review
          "uk": "Гід зараховує ончейн/P2P депозити, а не внутрішні перекази, і вимагає підтримувати мінімальний чистий баланс завдання."
        },
        {
          "en": "Confirm fee-paying futures-volume rules and whether moving funds would forfeit a bonus.",
          "zh-Hans": "核对付费合约交易量规则，以及转出资金是否会使赠金失效。",
          "zh-Hant": "核對付費合約交易量規則，以及轉出資金是否會使贈金失效。",
          "ja": "手数料を支払う先物取引量ルールと、資金を移動するとボーナスが失われるかどうかを確認します。",
          "ko": "수수료를 지불하는 선물 거래량 규칙과 자금 이동 시 보너스가 상실되는지 여부를 확인하십시오.",
          "tr": "Ücret ödeyen vadeli işlem hacmi kurallarını ve fonların taşınmasının bir ikramiyeyi kaybedip kaybetmeyeceğini doğrulayın.",
          "ar": "قم بتأكيد قواعد حجم العقود الآجلة لدفع الرسوم وما إذا كان نقل الأموال سيؤدي إلى خسارة المكافأة.",
          "es": "Confirme las reglas de volumen de futuros que pagan tarifas y si mover fondos perdería el derecho a recibir una bonificación.",
          "pt-BR": "Confirmar as regras de volume de futuros para pagamento de taxas e se a movimentação de fundos perderia um bônus.",
          "fr": "Confirmez les règles de volume des contrats à terme payantes et si le transfert de fonds entraînerait une perte de bonus.",
          "de": "Bestätigen Sie die gebührenpflichtigen Futures-Volumenregeln und prüfen Sie, ob beim Verschieben von Geldern ein Bonus verloren geht.",
          "ru": "Подтвердите правила по объему фьючерсов с уплатой комиссионных и уточните, будет ли перемещение средств лишаться бонуса.",
          "id": "Konfirmasikan aturan volume berjangka yang membayar biaya dan apakah pemindahan dana akan menghilangkan bonus.",
          "vi": "Xác nhận các quy tắc về khối lượng hợp đồng tương lai trả phí và liệu việc chuyển tiền có bị mất tiền thưởng hay không.",
          "it": "Confermare le regole sul volume dei futures a pagamento e se lo spostamento di fondi comporterebbe la perdita di un bonus.",
          // l10n: needs native review
          "ur": "فیس دینے والے فیوچر والیوم قواعد اور فنڈز منتقل کرنا سے بونس ضائع ہو گا یا نہیں، اس کی تصدیق کریں۔",
          // l10n: needs native review
          "uk": "Підтвердьте правила ф’ючерсного обсягу з комісією і чи переміщення коштів призведе до втрати бонусу."
        }
      ]
    },
    "sources": {
      "mexc-welcome-guide": {
        "summary": {
          "en": "Historical headline maximum; no current account-specific entitlement verified.",
          "zh-Hans": "历史标题最高额；未核实当前账户的具体奖励资格。",
          "zh-Hant": "歷史標題最高額；未核實目前帳戶的具體獎勵資格。",
          "ja": "過去の見出し上の最大額であり、現在のアカウントに対する具体的な権利は確認されていません。",
          "ko": "과거 헤드라인 기준 최대값이며, 현재 계정별 구체적 수급 자격은 확인되지 않았습니다.",
          "tr": "Tarihsel başlıkta yer alan azami tutar; mevcut hesaba özel hak doğrulanmamıştır.",
          "ar": "هذا حد أقصى تاريخي في العنوان؛ ولم يتم التحقق من استحقاق محدد للحساب الحالي.",
          "es": "Máximo histórico del titular; no se ha verificado ningún derecho específico para la cuenta actual.",
          "pt-BR": "Máximo histórico do título; nenhum direito específico da conta atual foi verificado.",
          "fr": "Maximum historique affiché dans le titre ; aucun droit spécifique au compte actuel n'a été vérifié.",
          "de": "Historisches Maximum aus der Überschrift; keine spezifische Berechtigung für das aktuelle Konto wurde verifiziert.",
          "ru": "Исторический максимум из заголовка; конкретное право для текущего аккаунта не подтверждено.",
          "id": "Maksimum historis pada judul; belum ada hak khusus untuk akun saat ini yang diverifikasi.",
          "vi": "Mức tối đa theo tiêu đề lịch sử; chưa xác minh quyền lợi cụ thể cho tài khoản hiện tại.",
          "it": "Massimo storico indicato nel titolo; non è stato verificato alcun diritto specifico per l'account attuale.",
          // l10n: needs native review
          "ur": "تاریخی سرخی کی زیادہ سے زیادہ رقم؛ کوئی موجودہ اکاؤنٹ-مخصوص استحقاق تصدیق شدہ نہیں۔",
          // l10n: needs native review
          "uk": "Історичний максимум у заголовку; жодне поточне право конкретного акаунта не підтверджено."
        }
      },
      "mexc-tradingpapa-ended": {
        "summary": {
          "en": "The page explicitly says Event Ended and shows 20 August–2 September 2026. Its timezone is not stated; no UTC deadline is inferred.",
          "zh-Hans": "页面明确显示活动已结束，日期为 2026 年 8 月 20 日至 9 月 2 日；未标时区，因此不推算 UTC 截止时间。",
          "zh-Hant": "頁面明確顯示活動已結束，日期為 2026 年 8 月 20 日至 9 月 2 日；未標時區，因此不推算 UTC 截止時間。",
          "ja": "このページにはイベントが終了したと明示されており、2026 年 8 月 20 日から 9 月 2 日までと表示されています。タイムゾーンは記載されていません。 UTC 期限は推測されません。",
          "ko": "페이지에는 Event Ended라고 명시되어 있으며 2026년 8월 20일부터 9월 2일까지 표시됩니다. 해당 시간대는 명시되어 있지 않습니다. UTC 기한은 유추되지 않습니다.",
          "tr": "Sayfada açıkça Etkinlik Sona Erdi yazıyor ve 20 Ağustos–2 Eylül 2026 tarihini gösteriyor. Saat dilimi belirtilmemiş; UTC son tarihi belirtilmez.",
          "ar": "تشير الصفحة صراحةً إلى انتهاء الحدث وتظهر الفترة من 20 أغسطس إلى 2 سبتمبر 2026. ولم يتم ذكر المنطقة الزمنية الخاصة بها؛ لا يتم استنتاج الموعد النهائي لـ UTC.",
          "es": "La página dice explícitamente que el evento finalizó y muestra del 20 de agosto al 2 de septiembre de 2026. No se indica su zona horaria; no se infiere ninguna fecha límite UTC.",
          "pt-BR": "A página diz explicitamente Event Ended e mostra 20 de agosto a 2 de setembro de 2026. Seu fuso horário não é indicado; nenhum prazo UTC é inferido.",
          "fr": "La page indique explicitement que l'événement est terminé et affiche la période du 20 août au 2 septembre 2026. Son fuseau horaire n'est pas indiqué ; aucune date limite UTC n’est déduite.",
          "de": "Auf der Seite steht ausdrücklich „Ereignis beendet“ und der Zeitraum vom 20. August bis 2. September 2026. Die Zeitzone wird nicht angegeben. Es wird keine UTC-Frist abgeleitet.",
          "ru": "На странице явно указано, что событие завершено, и указано время с 20 августа по 2 сентября 2026 г. Часовой пояс не указан; Крайний срок UTC не предполагается.",
          "id": "Halaman tersebut secara eksplisit menyatakan Acara Berakhir dan menunjukkan 20 Agustus–2 September 2026. Zona waktunya tidak disebutkan; tidak ada batas waktu UTC yang disimpulkan.",
          "vi": "Trang này cho biết rõ ràng Sự kiện đã kết thúc và hiển thị từ ngày 20 tháng 8 đến ngày 2 tháng 9 năm 2026. Múi giờ của nó không được nêu rõ; không có thời hạn UTC nào được suy ra.",
          "it": "La pagina dice esplicitamente che l'evento è terminato e mostra il periodo dal 20 agosto al 2 settembre 2026. Il suo fuso orario non è indicato; non si deduce alcuna scadenza UTC.",
          // l10n: needs native review
          "ur": "صفحہ واضح طور پر ایونٹ ختم ہو چکا ہے کہتا ہے اور 20 اگست–2 ستمبر 2026 دکھاتا ہے۔ اس کا ٹائم زون درج نہیں؛ کوئی UTC آخری تاریخ اخذ نہیں کی گئی۔",
          // l10n: needs native review
          "uk": "Сторінка прямо каже Подія завершена і показує період 20 серпня–2 вересня 2026 року. Її часовий пояс не зазначений; жоден UTC кінцевий строк не виводиться."
        }
      },
      "mexc-pair-september": {
        "summary": {
          "en": "PAIRUSDT futures are scheduled for 6 September 2026 at 15:30 UTC. The notice specifies higher Innovation Zone fees (0.04% maker, 0.10% taker), regional restrictions and no API trading. Its generic welcome-reward banner contains no qualifying terms and is not treated as reward evidence.",
          "zh-Hans": "PAIRUSDT 合约时间表为 2026 年 9 月 6 日 15:30 UTC。公告说明创新区费率更高（挂单 0.04%、吃单 0.10%）、有地区限制且不支持 API 交易。通用新客奖励横幅未含资格条款，不作为奖励证据。",
          "zh-Hant": "PAIRUSDT 合約時間表為 2026 年 9 月 6 日 15:30 UTC。公告說明創新區費率更高（掛單 0.04%、吃單 0.10%）、有地區限制且不支援 API 交易。通用新客獎勵橫幅未含資格條款，不作為獎勵證據。",
          "ja": "PAIRUSDT 先物は 2026 年 9 月 6 日の 15:30 UTC に予定されています。この通知では、イノベーションゾーン手数料の引き上げ（メイカー0.04％、テイカー0.10％）、地域制限、API取引の禁止を明記している。その一般的なウェルカム報酬バナーには資格条件が含まれておらず、報酬の証拠として扱われません。",
          "ko": "PAIRUSDT 선물은 2026년 9월 6일 15:30 UTC에 예정되어 있습니다. 이 공지에는 더 높은 혁신 구역 수수료(메이커 0.04%, 테이커 0.10%), 지역 제한 및 API 거래 금지가 명시되어 있습니다. 일반적인 환영 보상 배너에는 적격 조건이 포함되어 있지 않으며 보상 증거로 취급되지 않습니다.",
          "tr": "PAIRUSDT vadeli işlemleri 6 Eylül 2026 15:30 UTC'de planlanıyor. Bildirimde daha yüksek İnovasyon Bölgesi ücretleri (%0,04 yapıcı, %0,10 alıcı), bölgesel kısıtlamalar ve API ticaretinin yapılmaması belirtiliyor. Genel hoş geldin ödülü afişi, hiçbir nitelikli terim içermez ve ödül kanıtı olarak değerlendirilmez.",
          "ar": "من المقرر عقد العقود الآجلة لـ PAIRUSDT في 6 سبتمبر 2026 الساعة 15:30 بالتوقيت العالمي المنسق. يحدد الإشعار رسوم منطقة الابتكار الأعلى (0.04% صانع، 0.10% متلقي)، والقيود الإقليمية وعدم تداول API. لا يحتوي شعار المكافأة الترحيبية العام الخاص بها على شروط مؤهلة ولا يتم التعامل معه كدليل على المكافأة.",
          "es": "Los futuros del PAIRUSDT están programados para el 6 de septiembre de 2026 a las 15:30 UTC. El aviso especifica tarifas más altas de la Zona de Innovación (0,04% fabricante, 0,10% receptor), restricciones regionales y no comercio de API. Su banner genérico de recompensa de bienvenida no contiene términos calificativos y no se trata como evidencia de recompensa.",
          "pt-BR": "Os futuros PAIRUSDT estão agendados para 6 de setembro de 2026 às 15h30 UTC. O aviso especifica taxas mais altas da Zona de Inovação (0,04% do fabricante, 0,10% do tomador), restrições regionais e nenhuma negociação de API. Seu banner genérico de recompensa de boas-vindas não contém termos qualificativos e não é tratado como evidência de recompensa.",
          "fr": "Les contrats à terme PAIRUSDT sont prévus pour le 6 septembre 2026 à 15h30 UTC. L'avis précise des frais plus élevés pour la zone d'innovation (0,04 % pour le fabricant, 0,10 % pour le preneur), des restrictions régionales et l'absence d'échange d'API. Sa bannière générique de récompense de bienvenue ne contient aucun terme qualificatif et n'est pas traitée comme une preuve de récompense.",
          "de": "PAIRUSDT-Futures sind für den 6. September 2026 um 15:30 UTC geplant. In der Bekanntmachung werden höhere Gebühren für die Innovationszone (0,04 % Hersteller, 0,10 % Abnehmer), regionale Beschränkungen und kein API-Handel genannt. Sein allgemeines Willkommens-Prämien-Banner enthält keine qualifizierenden Bedingungen und wird nicht als Belohnungsnachweis behandelt.",
          "ru": "Фьючерсы на PAIRUSDT запланированы на 6 сентября 2026 года в 15:30 UTC. В уведомлении указаны более высокие комиссии в зоне инноваций (0,04% для производителя, 0,10% для получателя), региональные ограничения и отсутствие торговли API. Его общий баннер приветствия и вознаграждения не содержит уточняющих условий и не рассматривается как свидетельство вознаграждения.",
          "id": "Kontrak berjangka PAIRUSDT dijadwalkan pada 6 September 2026 pukul 15:30 UTC. Pemberitahuan tersebut menetapkan biaya Zona Inovasi yang lebih tinggi (0,04% pembuat, 0,10% pengambil), pembatasan regional, dan tidak adanya perdagangan API. Spanduk hadiah selamat datang yang umum tidak berisi persyaratan yang memenuhi syarat dan tidak diperlakukan sebagai bukti hadiah.",
          "vi": "Hợp đồng tương lai PAIRUSDT được lên lịch vào ngày 6 tháng 9 năm 2026 lúc 15:30 UTC. Thông báo nêu rõ phí Khu vực đổi mới cao hơn (nhà sản xuất 0,04%, người nhận 0,10%), các hạn chế trong khu vực và không có giao dịch API. Biểu ngữ khen thưởng chào mừng chung của nó không chứa các điều khoản đủ điều kiện và không được coi là bằng chứng khen thưởng.",
          "it": "I futures PAIRUSDT sono previsti per il 6 settembre 2026 alle 15:30 UTC. L'avviso specifica commissioni più elevate per l'Innovation Zone (0,04% produttore, 0,10% acquirente), restrizioni regionali e divieto di scambio API. Il banner generico del premio di benvenuto non contiene termini qualificanti e non viene trattato come prova del premio.",
          // l10n: needs native review
          "ur": "PAIRUSDT فیوچرز 6 ستمبر 2026 کو 15:30 UTC پر شیڈول ہیں۔ نوٹس میں Innovation Zone کی زیادہ فیسیں (0.04% میکر، 0.10% ٹیکر)، علاقائی پابندیاں اور API ٹریڈنگ نہ ہونے کی بات درج ہے۔ اس کا عمومی استقبالی انعامی بینر اہلیت کی شرائط نہیں دیتا، اس لیے اسے انعام کے ثبوت کے طور پر نہیں لیا گیا۔",
          // l10n: needs native review
          "uk": "Ф’ючерси PAIRUSDT заплановані на 6 вересня 2026 року о 15:30 UTC. У повідомленні зазначені вищі комісії Innovation Zone (0.04% мейкер, 0.10% тейкер), регіональні обмеження й відсутність торгівлі через API. Загальний банер вітальної винагороди не містить умов кваліфікації, тому не є доказом винагороди."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "Some tasks require advanced identity verification; confirm the account's current task.",
        "zh-Hans": "部分任务要求高级身份验证，需核对账户当前任务。",
        "zh-Hant": "部分任務要求進階身分驗證，需核對帳戶目前任務。",
        "ja": "一部のタスクでは高度な ID 検証が必要です。アカウントの現在のタスクを確認します。",
        "ko": "일부 작업에는 고급 신원 확인이 필요합니다. 계정의 현재 작업을 확인하세요.",
        "tr": "Bazı görevler gelişmiş kimlik doğrulaması gerektirir; hesabın mevcut görevini onaylayın.",
        "ar": "تتطلب بعض المهام التحقق المتقدم من الهوية؛ تأكيد المهمة الحالية للحساب.",
        "es": "Algunas tareas requieren una verificación de identidad avanzada; confirmar la tarea actual de la cuenta.",
        "pt-BR": "Algumas tarefas requerem verificação avançada de identidade; confirme a tarefa atual da conta.",
        "fr": "Certaines tâches nécessitent une vérification d'identité avancée ; confirmer la tâche actuelle du compte.",
        "de": "Für einige Aufgaben ist eine erweiterte Identitätsprüfung erforderlich. Bestätigen Sie die aktuelle Aufgabe des Kontos.",
        "ru": "Некоторые задачи требуют расширенной проверки личности; подтвердить текущую задачу аккаунта.",
        "id": "Beberapa tugas memerlukan verifikasi identitas tingkat lanjut; konfirmasikan tugas akun saat ini.",
        "vi": "Một số nhiệm vụ yêu cầu xác minh danh tính nâng cao; xác nhận nhiệm vụ hiện tại của tài khoản.",
        "it": "Alcune attività richiedono una verifica avanzata dell'identità; confermare l'attività corrente dell'account.",
        // l10n: needs native review
        "ur": "کچھ کام اعلیٰ شناختی تصدیق مانگتے ہیں؛ اکاؤنٹ کا موجودہ کام تصدیق کریں۔",
        // l10n: needs native review
        "uk": "Деякі завдання потребують розширена перевірка особи; підтвердьте поточний завдання акаунта."
      },
      "kyc": {
        "en": "Some tasks require advanced identity verification; confirm the account's current task.",
        "zh-Hans": "部分任务要求高级身份验证，需核对账户当前任务。",
        "zh-Hant": "部分任務要求進階身分驗證，需核對帳戶目前任務。",
        "ja": "一部のタスクでは高度な ID 検証が必要です。アカウントの現在のタスクを確認します。",
        "ko": "일부 작업에는 고급 신원 확인이 필요합니다. 계정의 현재 작업을 확인하세요.",
        "tr": "Bazı görevler gelişmiş kimlik doğrulaması gerektirir; hesabın mevcut görevini onaylayın.",
        "ar": "تتطلب بعض المهام التحقق المتقدم من الهوية؛ تأكيد المهمة الحالية للحساب.",
        "es": "Algunas tareas requieren una verificación de identidad avanzada; confirmar la tarea actual de la cuenta.",
        "pt-BR": "Algumas tarefas requerem verificação avançada de identidade; confirme a tarefa atual da conta.",
        "fr": "Certaines tâches nécessitent une vérification d'identité avancée ; confirmer la tâche actuelle du compte.",
        "de": "Für einige Aufgaben ist eine erweiterte Identitätsprüfung erforderlich. Bestätigen Sie die aktuelle Aufgabe des Kontos.",
        "ru": "Некоторые задачи требуют расширенной проверки личности; подтвердить текущую задачу аккаунта.",
        "id": "Beberapa tugas memerlukan verifikasi identitas tingkat lanjut; konfirmasikan tugas akun saat ini.",
        "vi": "Một số nhiệm vụ yêu cầu xác minh danh tính nâng cao; xác nhận nhiệm vụ hiện tại của tài khoản.",
        "it": "Alcune attività richiedono una verifica avanzata dell'identità; confermare l'attività corrente dell'account.",
        // l10n: needs native review
        "ur": "کچھ کام اعلیٰ شناختی تصدیق مانگتے ہیں؛ اکاؤنٹ کا موجودہ کام تصدیق کریں۔",
        // l10n: needs native review
        "uk": "Деякі завдання вимагають розширену перевірку особи; підтвердьте поточне завдання акаунта."
      },
      "deposit": {
        "en": "The guide counts on-chain/P2P deposits, not internal transfers, and requires maintaining the task's minimum net balance.",
        "zh-Hans": "该指南计入链上与 P2P 入金、不计内部划转，并要求在任务持有期内维持最低净余额。",
        "zh-Hant": "該指南計入鏈上與 P2P 入金、不計內部劃轉，並要求在任務持有期內維持最低淨餘額。",
        "ja": "このガイドでは内部送金ではなくオンチェーン/P2P デポジットをカウントしており、タスクの最小ネット残高を維持する必要があります。",
        "ko": "가이드는 내부 전송이 아닌 온체인/P2P 예금을 계산하며 작업의 최소 순 잔액을 유지하도록 요구합니다.",
        "tr": "Kılavuz, dahili transferleri değil zincir içi/P2P mevduatlarını sayıyor ve görevin minimum net bakiyesinin korunmasını gerektiriyor.",
        "ar": "يحسب الدليل الودائع على السلسلة/P2P، وليس التحويلات الداخلية، ويتطلب الحفاظ على الحد الأدنى من صافي رصيد المهمة.",
        "es": "La guía cuenta los depósitos en cadena/P2P, no las transferencias internas, y requiere mantener el saldo neto mínimo de la tarea.",
        "pt-BR": "O guia conta depósitos em rede/P2P, não transferências internas, e exige a manutenção do saldo líquido mínimo da tarefa.",
        "fr": "Le guide compte les dépôts en chaîne/P2P, pas les transferts internes, et exige de maintenir le solde net minimum de la tâche.",
        "de": "Der Leitfaden zählt On-Chain-/P2P-Einzahlungen, nicht interne Überweisungen, und erfordert die Einhaltung des Mindestnettoguthabens der Aufgabe.",
        "ru": "Руководство учитывает внутрисетевые/P2P-депозиты, а не внутренние переводы, и требует поддержания минимального чистого баланса задачи.",
        "id": "Panduan ini menghitung setoran on-chain/P2P, bukan transfer internal, dan mengharuskan pemeliharaan saldo bersih minimum tugas.",
        "vi": "Hướng dẫn tính số tiền gửi trên chuỗi/P2P, không phải chuyển khoản nội bộ và yêu cầu duy trì số dư ròng tối thiểu của nhiệm vụ.",
        "it": "La guida conta i depositi on-chain/P2P, non i trasferimenti interni, e richiede il mantenimento del saldo netto minimo dell'attività.",
        // l10n: needs native review
        "ur": "گائیڈ آن چین/P2P ڈپازٹس شمار کرتی ہے، اندرونی منتقلیاں نہیں، اور کام کا کم از کم خالص بیلنس برقرار رکھنے کا تقاضا کرتی ہے۔",
        // l10n: needs native review
        "uk": "Гід зараховує ончейн/P2P депозити, а не внутрішні перекази, і вимагає підтримувати мінімальний чистий баланс завдання."
      },
      "trading": {
        "en": "Confirm fee-paying futures-volume rules and whether moving funds would forfeit a bonus.",
        "zh-Hans": "核对付费合约交易量规则，以及转出资金是否会使赠金失效。",
        "zh-Hant": "核對付費合約交易量規則，以及轉出資金是否會使贈金失效。",
        "ja": "手数料を支払う先物取引量ルールと、資金を移動するとボーナスが失われるかどうかを確認します。",
        "ko": "수수료를 지불하는 선물 거래량 규칙과 자금 이동 시 보너스가 상실되는지 여부를 확인하십시오.",
        "tr": "Ücret ödeyen vadeli işlem hacmi kurallarını ve fonların taşınmasının bir ikramiyeyi kaybedip kaybetmeyeceğini doğrulayın.",
        "ar": "قم بتأكيد قواعد حجم العقود الآجلة لدفع الرسوم وما إذا كان نقل الأموال سيؤدي إلى خسارة المكافأة.",
        "es": "Confirme las reglas de volumen de futuros que pagan tarifas y si mover fondos perdería el derecho a recibir una bonificación.",
        "pt-BR": "Confirmar as regras de volume de futuros para pagamento de taxas e se a movimentação de fundos perderia um bônus.",
        "fr": "Confirmez les règles de volume des contrats à terme payantes et si le transfert de fonds entraînerait une perte de bonus.",
        "de": "Bestätigen Sie die gebührenpflichtigen Futures-Volumenregeln und prüfen Sie, ob beim Verschieben von Geldern ein Bonus verloren geht.",
        "ru": "Подтвердите правила по объему фьючерсов с уплатой комиссионных и уточните, будет ли перемещение средств лишаться бонуса.",
        "id": "Konfirmasikan aturan volume berjangka yang membayar biaya dan apakah pemindahan dana akan menghilangkan bonus.",
        "vi": "Xác nhận các quy tắc về khối lượng hợp đồng tương lai trả phí và liệu việc chuyển tiền có bị mất tiền thưởng hay không.",
        "it": "Confermare le regole sul volume dei futures a pagamento e se lo spostamento di fondi comporterebbe la perdita di un bonus.",
        // l10n: needs native review
        "ur": "فیس دینے والے فیوچرز حجم قواعد کی تصدیق کریں اور یہ بھی کہ فنڈز منتقل کرنا کرنے سے بونس ضائع ہونا ہو گی یا نہیں۔",
        // l10n: needs native review
        "uk": "Підтвердьте правила ф’ючерсного обсягу з оплатою комісій і чи переміщення коштів призведе до втрата бонусу."
      },
      "rewardType": {
        "en": "Conditional futures bonus",
        "zh-Hans": "附条件合约赠金",
        "zh-Hant": "附條件合約贈金",
        "ja": "条件付き先物ボーナス",
        "ko": "조건부 선물 보너스",
        "tr": "Koşullu vadeli işlem bonusu",
        "ar": "مكافأة العقود الآجلة المشروطة",
        "es": "Bono de futuros condicional",
        "pt-BR": "Bônus futuro condicional",
        "fr": "Bonus à terme conditionnel",
        "de": "Bedingter Futures-Bonus",
        "ru": "Условный фьючерсный бонус",
        "id": "Bonus berjangka bersyarat",
        "vi": "Tiền thưởng tương lai có điều kiện",
        "it": "Bonus futures condizionato",
        // l10n: needs native review
        "ur": "مشروط فیوچر بونس۔",
        // l10n: needs native review
        "uk": "Умовний ф’ючерсний бонус."
      },
      "limitations": {
        "en": "The August 2025 announcement is historical program guidance, not a verified current 10,000 USDT cash offer.",
        "zh-Hans": "2025 年 8 月公告只作为历史计划说明，不作为已核实的当前 10,000 USDT 现金优惠。",
        "zh-Hant": "2025 年 8 月公告只作為歷史計畫說明，不作為已核實的目前 10,000 USDT 現金優惠。",
        "ja": "2025 年 8 月の発表は過去のプログラム ガイダンスであり、現在の検証済みの 10,000 USDT 現金オファーではありません。",
        "ko": "2025년 8월 발표는 현재 검증된 10,000 USDT 현금 제안이 아닌 역사적인 프로그램 지침입니다.",
        "tr": "Ağustos 2025 duyurusu, güncel bir 10.000 USDT nakit teklifi değil, tarihi program rehberidir.",
        "ar": "يعد إعلان أغسطس 2025 بمثابة توجيه تاريخي للبرنامج، وليس عرضاً نقدياً حالياً بقيمة 10,000 USDT تم التحقق منه.",
        "es": "El anuncio de agosto de 2025 es una guía histórica del programa, no una oferta en efectivo actual verificada de 10,000 USDT.",
        "pt-BR": "O anúncio de agosto de 2025 é uma orientação histórica do programa, não uma oferta atual verificada de 10.000 USDT em dinheiro.",
        "fr": "L'annonce d'août 2025 constitue une orientation historique du programme et non une offre en espèces actuelle vérifiée de 10 000 USDT.",
        "de": "Bei der Ankündigung vom August 2025 handelt es sich um eine historische Programmprognose und nicht um ein verifiziertes aktuelles Bargeldangebot von 10.000 USDT.",
        "ru": "Объявление от августа 2025 года представляет собой историческое руководство по программе, а не подтвержденное текущее предложение наличными в размере 10 000 USDT.",
        "id": "Pengumuman pada bulan Agustus 2025 adalah panduan program historis, bukan penawaran tunai 10.000 USDT yang terverifikasi saat ini.",
        "vi": "Thông báo tháng 8 năm 2025 là hướng dẫn lịch sử của chương trình, không phải là ưu đãi tiền mặt 10.000 USDT hiện đã được xác minh.",
        "it": "L’annuncio dell’agosto 2025 rappresenta una guida storica del programma, non un’offerta in contanti verificata di 10.000 USDT attuali.",
        // l10n: needs native review
        "ur": "اگست 2025 کا اعلان تاریخی پروگرام رہنمائی ہے، تصدیق شدہ موجودہ 10,000 USDT نقد پیشکش نہیں۔",
        // l10n: needs native review
        "uk": "Оголошення серпня 2025 року є історичні правила програми, а не підтвердженою поточною 10,000 USDT грошова пропозиція."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/ریجن اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Для цієї конкретної пропозиції не встановлено повний список придатності країн/регіонів."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مہم کی کوئی قطعی مدت تصدیق شدہ نہیں ہے؛ صرف پڑھنے کے قابل صفحہ پیشکش فعال ہونے کو ثابت نہیں کر سکتا۔",
          // l10n: needs native review
          "uk": "Повне абсолютне вікно кампанії не підтверджено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The August 2025 announcement is historical program guidance, not a verified current 10,000 USDT cash offer.",
          "zh-Hans": "2025 年 8 月公告只作为历史计划说明，不作为已核实的当前 10,000 USDT 现金优惠。",
          "zh-Hant": "2025 年 8 月公告只作為歷史計畫說明，不作為已核實的目前 10,000 USDT 現金優惠。",
          "ja": "2025 年 8 月の発表は過去のプログラム ガイダンスであり、現在の検証済みの 10,000 USDT 現金オファーではありません。",
          "ko": "2025년 8월 발표는 현재 검증된 10,000 USDT 현금 제안이 아닌 역사적인 프로그램 지침입니다.",
          "tr": "Ağustos 2025 duyurusu, güncel bir 10.000 USDT nakit teklifi değil, tarihi program rehberidir.",
          "ar": "يعد إعلان أغسطس 2025 بمثابة توجيه تاريخي للبرنامج، وليس عرضاً نقدياً حالياً بقيمة 10,000 USDT تم التحقق منه.",
          "es": "El anuncio de agosto de 2025 es una guía histórica del programa, no una oferta en efectivo actual verificada de 10,000 USDT.",
          "pt-BR": "O anúncio de agosto de 2025 é uma orientação histórica do programa, não uma oferta atual verificada de 10.000 USDT em dinheiro.",
          "fr": "L'annonce d'août 2025 constitue une orientation historique du programme et non une offre en espèces actuelle vérifiée de 10 000 USDT.",
          "de": "Bei der Ankündigung vom August 2025 handelt es sich um eine historische Programmprognose und nicht um ein verifiziertes aktuelles Bargeldangebot von 10.000 USDT.",
          "ru": "Объявление от августа 2025 года представляет собой историческое руководство по программе, а не подтвержденное текущее предложение наличными в размере 10 000 USDT.",
          "id": "Pengumuman pada bulan Agustus 2025 adalah panduan program historis, bukan penawaran tunai 10.000 USDT yang terverifikasi saat ini.",
          "vi": "Thông báo tháng 8 năm 2025 là hướng dẫn lịch sử của chương trình, không phải là ưu đãi tiền mặt 10.000 USDT hiện đã được xác minh.",
          "it": "L’annuncio dell’agosto 2025 rappresenta una guida storica del programma, non un’offerta in contanti verificata di 10.000 USDT attuali.",
          // l10n: needs native review
          "ur": "اگست 2025 اعلان تاریخی پروگرام رہنمائی ہے، تصدیق شدہ موجودہ 10,000 USDT نقد پیشکش نہیں۔",
          // l10n: needs native review
          "uk": "Оголошення серпня 2025 року є історичний програма настанова, а не перевірений поточний 10,000 USDT готівка пропозиція."
        }
      ]
    },
    "notices": [
      {
        "en": "TradingPapa8 is historical and ended. Its channel-bound futures bonuses must not appear as a currently claimable signup gift.",
        "zh-Hans": "TradingPapa8 已结束，其指定渠道的合约赠金不得展示为当前可领取的注册礼。",
        "zh-Hant": "TradingPapa8 已結束，其指定管道的合約贈金不得展示為目前可領取的註冊禮。",
        "ja": "TradingPapa8 は歴史的なものであり、終了しました。チャネル限定の先物ボーナスは、現在請求可能なサインアップギフトとして表示されてはなりません。",
        "ko": "TradingPapa8은 역사적이며 종료되었습니다. 채널에 바인딩된 선물 보너스는 현재 청구 가능한 가입 선물로 표시되어서는 안 됩니다.",
        "tr": "TradingPapa8 tarihseldir ve sona ermiştir. Kanala bağlı vadeli işlem bonusları, şu anda talep edilebilir bir kayıt hediyesi olarak görünmemelidir.",
        "ar": "TradingPapa8 تاريخي وانتهى. يجب ألا تظهر مكافآت العقود الآجلة المرتبطة بالقناة كهدية اشتراك يمكن المطالبة بها حاليًا.",
        "es": "TradingPapa8 es histórico y finalizado. Sus bonos de futuros vinculados al canal no deben aparecer como un regalo de registro actualmente reclamable.",
        "pt-BR": "TradingPapa8 é histórico e terminou. Seus bônus futuros vinculados ao canal não devem aparecer como um presente de inscrição atualmente exigível.",
        "fr": "TradingPapa8 est historique et terminé. Ses bonus à terme liés aux chaînes ne doivent pas apparaître comme un cadeau d'inscription actuellement récupérable.",
        "de": "TradingPapa8 ist historisch und beendet. Seine kanalgebundenen Futures-Boni dürfen nicht als aktuell beanspruchbares Anmeldegeschenk erscheinen.",
        "ru": "TradingPapa8 является историческим и завершился. Фьючерсные бонусы, привязанные к каналу, не должны фигурировать в качестве подарка за регистрацию, на который в настоящее время можно претендовать.",
        "id": "TradingPapa8 bersifat historis dan berakhir. Bonus berjangka yang terikat saluran tidak boleh muncul sebagai hadiah pendaftaran yang saat ini dapat diklaim.",
        "vi": "TradingPapa8 là lịch sử và đã kết thúc. Phần thưởng tương lai giới hạn theo kênh của nó không được xuất hiện dưới dạng quà tặng đăng ký hiện có thể nhận được.",
        "it": "TradingPapa8 è storico ed è terminato. I suoi bonus futures legati al canale non devono apparire come un regalo di iscrizione attualmente richiudibile.",
        // l10n: needs native review
        "ur": "TradingPapa8 تاریخی ہے اور ختم ہو چکا ہے۔ اس کے چینل سے بندھے فیوچر بونس کو اس وقت قابل کلیم سائن اپ تحفہ کے طور پر نہیں دکھانا چاہیے۔",
        // l10n: needs native review
        "uk": "TradingPapa8 є історичним і завершеним. Його ф’ючерсні бонуси, прив’язані до каналу, не мають відображатися як поточний подарунок за реєстрацію, доступний для отримання."
      }
    ]
  },
  "backpack": {
    "summary": {
      "en": "Backpack's referral document describes a commission paid to the inviter, not a verified cash payment to a new user.",
      "zh-Hans": "Backpack 邀请文档描述的是邀请人佣金，不是已核实的新用户现金奖励。",
      "zh-Hant": "Backpack 邀請文件描述的是邀請人佣金，不是已核實的新用戶現金獎勵。",
      "ja": "Backpack の紹介文書には、新規ユーザーへの確認済みの現金支払いではなく、招待者に支払われる手数料が記載されています。",
      "ko": "Backpack의 추천 문서에는 신규 사용자에게 확인된 현금 지급이 아닌 초대자에게 지급되는 수수료가 설명되어 있습니다.",
      "tr": "Backpack'in yönlendirme belgesinde, yeni bir kullanıcıya yapılan doğrulanmış bir nakit ödeme değil, davet edene ödenen bir komisyon açıklanmaktadır.",
      "ar": "يصف مستند إحالة Backpack العمولة المدفوعة للداعي، وليس دفعة نقدية تم التحقق منها لمستخدم جديد.",
      "es": "El documento de referencia de Backpack describe una comisión pagada al invitante, no un pago en efectivo verificado a un nuevo usuario.",
      "pt-BR": "O documento de indicação do Backpack descreve uma comissão paga ao autor do convite, e não um pagamento em dinheiro verificado a um novo usuário.",
      "fr": "Le document de référence de Backpack décrit une commission versée à l'invitant, et non un paiement en espèces vérifié à un nouvel utilisateur.",
      "de": "Das Empfehlungsdokument von Backpack beschreibt eine an den Einladenden gezahlte Provision und keine verifizierte Barzahlung an einen neuen Benutzer.",
      "ru": "Реферальный документ Backpack описывает комиссию, выплачиваемую приглашающему, а не подтвержденную денежную выплату новому пользователю.",
      "id": "Dokumen rujukan Backpack menjelaskan komisi yang dibayarkan kepada pengundang, bukan pembayaran tunai terverifikasi kepada pengguna baru.",
      "vi": "Tài liệu giới thiệu của Backpack mô tả khoản hoa hồng trả cho người mời chứ không phải khoản thanh toán bằng tiền mặt đã được xác minh cho người dùng mới.",
      "it": "Il documento di segnalazione di Backpack descrive una commissione pagata all'invitante, non un pagamento in contanti verificato a un nuovo utente.",
      // l10n: needs native review
      "ur": "Backpack کی ریفرل دستاویز مدعو کنندہ کو ادا کیا گیا کمیشن بیان کرتی ہے، نئے صارف کو تصدیق شدہ نقد ادائیگی نہیں۔",
      // l10n: needs native review
      "uk": "Реферальний документ Backpack описує комісію, сплачену запрошувачу, а не підтверджену грошову виплату новому користувачеві."
    },
    "signupReward": {
      "summary": {
        "en": "The source describes a 10% inviter fee share after the referred user completes KYC. No invitee cash amount was verified from this document.",
        "zh-Hans": "来源描述好友完成 KYC 后，邀请人可分得 10% 交易手续费；该文档未核实受邀人的现金奖励金额。",
        "zh-Hant": "來源描述好友完成 KYC 後，邀請人可分得 10% 交易手續費；該文件未核實受邀人的現金獎勵金額。",
        "ja": "情報源には、紹介されたユーザーが KYC を完了した後、招待者料金の 10% が割り当てられると記載されています。この文書からは招待者の現金金額は確認されていません。",
        "ko": "출처는 추천된 사용자가 KYC를 완료한 후 10%의 초대 수수료 공유를 설명합니다. 이 문서에서는 초대받은 사람의 현금 금액이 확인되지 않았습니다.",
        "tr": "Kaynak, yönlendirilen kullanıcı KYC'yi tamamladıktan sonra %10 davetli ücreti payını açıklıyor. Bu belgeden davetlinin nakit tutarı doğrulanmadı.",
        "ar": "يصف المصدر حصة رسوم الدعوة بنسبة 10% بعد أن يكمل المستخدم المُحال عملية اعرف عميلك (KYC). لم يتم التحقق من أي مبلغ نقدي للمدعو من هذا المستند.",
        "es": "La fuente describe una tarifa compartida del 10% para el invitado después de que el usuario recomendado completa KYC. No se verificó ningún monto en efectivo del invitado a partir de este documento.",
        "pt-BR": "A fonte descreve uma parcela da taxa de convite de 10% após o usuário indicado concluir o KYC. Nenhum valor em dinheiro do convidado foi verificado neste documento.",
        "fr": "La source décrit une part des frais d'invitation de 10 % une fois que l'utilisateur référé a terminé le KYC. Aucun montant en espèces de l'invité n'a été vérifié à partir de ce document.",
        "de": "Die Quelle beschreibt einen Anteil von 10 % an der Einladungsgebühr, nachdem der empfohlene Benutzer KYC abgeschlossen hat. Aus diesem Dokument wurde kein Bargeldbetrag des eingeladenen Teilnehmers bestätigt.",
        "ru": "Источник описывает долю комиссии пригласителя в размере 10% после того, как приглашенный пользователь завершит KYC. Никакая сумма денежных средств приглашенного не была подтверждена из этого документа.",
        "id": "Sumber tersebut menjelaskan pembagian biaya pengundang sebesar 10% setelah pengguna yang dirujuk menyelesaikan KYC. Tidak ada jumlah uang tunai undangan yang diverifikasi dari dokumen ini.",
        "vi": "Nguồn mô tả chia sẻ phí người mời 10% sau khi người dùng được giới thiệu hoàn thành KYC. Không có số tiền mặt nào của người được mời được xác minh từ tài liệu này.",
        "it": "La fonte descrive una quota di commissione dell'invitatore del 10% dopo che l'utente segnalato ha completato il KYC. Nessun importo in contanti dell'invitato è stato verificato da questo documento.",
        // l10n: needs native review
        "ur": "ذریعہ KYC مکمل کرنے کے بعد ریفر کیے گئے صارف پر مدعو کنندہ کے لیے 10% فیس کا حصہ بیان کرتا ہے۔ اس دستاویز سے مدعو صارف کے لیے کوئی نقد رقم تصدیق نہیں ہوئی۔",
        // l10n: needs native review
        "uk": "Джерело описує 10% частку комісії для запрошувача після того, як запрошений користувач завершить KYC. Жодної грошової суми для запрошеного з цього документа не підтверджено."
      },
      "conditions": [
        {
          "en": "Add a referral code before completing KYC; the document disallows adding one retroactively after KYC.",
          "zh-Hans": "邀请码需在完成 KYC 前添加，文档不支持 KYC 后补填。",
          "zh-Hant": "邀請碼需在完成 KYC 前加入，文件不支援 KYC 後補填。",
          "ja": "KYCを完了する前に紹介コードを追加してください。この文書では、KYC 後に遡って追加することを禁止しています。",
          "ko": "KYC를 완료하기 전에 추천 코드를 추가하세요. 문서에서는 KYC 이후에 소급하여 추가하는 것을 허용하지 않습니다.",
          "tr": "KYC'yi tamamlamadan önce bir yönlendirme kodu ekleyin; belge, KYC'den sonra geriye dönük olarak bir tane eklenmesine izin vermiyor.",
          "ar": "أضف رمز الإحالة قبل إكمال KYC؛ لا يسمح المستند بإضافة واحد بأثر رجعي بعد KYC.",
          "es": "Agregue un código de referencia antes de completar KYC; el documento no permite agregar uno retroactivamente después de KYC.",
          "pt-BR": "Adicione um código de referência antes de concluir o KYC; o documento não permite adicionar um retroativamente após KYC.",
          "fr": "Ajoutez un code de parrainage avant de terminer KYC ; le document interdit d’en ajouter un rétroactivement après KYC.",
          "de": "Fügen Sie einen Empfehlungscode hinzu, bevor Sie KYC abschließen. Das Dokument verbietet das rückwirkende Hinzufügen eines solchen nach KYC.",
          "ru": "Добавьте реферальный код перед завершением KYC; документ запрещает добавлять его задним числом после KYC.",
          "id": "Tambahkan kode referral sebelum menyelesaikan KYC; dokumen tersebut tidak mengizinkan penambahan kode susulan setelah KYC.",
          "vi": "Thêm mã giới thiệu trước khi hoàn thành KYC; tài liệu không cho phép thêm một tài liệu hồi tố sau KYC.",
          "it": "Aggiungi un codice di riferimento prima di completare KYC; il documento non ne consente l'aggiunta retroattiva dopo il KYC.",
          // l10n: needs native review
          "ur": "KYC مکمل کرنے سے پہلے ریفرل کوڈ شامل کریں؛ دستاویز KYC کے بعد بعد از وقت شامل کرنے کی اجازت نہیں دیتی۔",
          // l10n: needs native review
          "uk": "Додайте реферал код перед завершенням KYC; документ забороняє додавати його заднім числом після KYC."
        },
        {
          "en": "Keep inviter commission separate from any benefit actually offered to the invitee.",
          "zh-Hans": "将邀请人佣金与受邀人实际优惠分开说明。",
          "zh-Hant": "將邀請人佣金與受邀人實際優惠分開說明。",
          "ja": "招待者のコミッションは、招待者に実際に提供される特典とは別にしてください。",
          "ko": "초대받은 사람에게 실제로 제공되는 혜택과 초대자 커미션을 별도로 유지하세요.",
          "tr": "Davetçi komisyonunu, davetliye sunulan herhangi bir avantajdan ayrı tutun.",
          "ar": "أبقِ عمولة المدعو منفصلة عن أي فائدة مقدمة فعليًا للمدعو.",
          "es": "Mantenga la comisión del invitado separada de cualquier beneficio realmente ofrecido al invitado.",
          "pt-BR": "Mantenha a comissão do convidado separada de qualquer benefício realmente oferecido ao convidado.",
          "fr": "Séparez la commission de l’invitant de tout avantage réellement offert à l’invité.",
          "de": "Halten Sie die Provision des Einladenden von allen Vorteilen getrennt, die dem Eingeladenen tatsächlich angeboten werden.",
          "ru": "Держите комиссию приглашенного отдельно от любых выгод, фактически предлагаемых приглашенному.",
          "id": "Pisahkan komisi pengundang dari manfaat apa pun yang sebenarnya ditawarkan kepada pengundang.",
          "vi": "Tách biệt hoa hồng của người mời với bất kỳ lợi ích nào thực sự được cung cấp cho người được mời.",
          "it": "Mantieni la commissione dell'invitante separata da qualsiasi vantaggio effettivamente offerto all'invitato.",
          // l10n: needs native review
          "ur": "دعوت دہندہ کمیشن کو مدعو صارف کو حقیقتاً پیش کردہ کسی فائدہ سے الگ رکھیں۔",
          // l10n: needs native review
          "uk": "Тримайте комісія запрошувача окремо від будь-якої вигода, фактично запропонована для запрошений."
        },
        {
          "en": "Review product exclusions and claim terms; equity-perpetual fees are excluded in this source.",
          "zh-Hans": "核对产品排除项和领取条款；来源排除了股票永续合约相关手续费。",
          "zh-Hant": "核對產品排除項和領取條款；來源排除了股票永續合約相關手續費。",
          "ja": "製品の除外条件と請求条件を確認してください。この情報源では株式無期限契約の手数料が除外されています。",
          "ko": "제품 제외 사항과 청구 조건을 확인하세요. 이 출처에서는 주식 무기한 계약 수수료가 제외됩니다.",
          "tr": "Ürün hariç tutmalarını ve talep koşullarını inceleyin; hisse senedi sürekli vadeli sözleşme ücretleri bu kaynakta hariç tutulur.",
          "ar": "راجع استثناءات المنتج وشروط المطالبة؛ رسوم عقود الأسهم الدائمة مستبعدة في هذا المصدر.",
          "es": "Revise las exclusiones de producto y los términos de reclamación; las comisiones de contratos perpetuos sobre acciones están excluidas en esta fuente.",
          "pt-BR": "Revise as exclusões de produto e os termos de solicitação; as taxas de contratos perpétuos de ações estão excluídas nesta fonte.",
          "fr": "Vérifiez les exclusions de produits et les conditions de réclamation ; les frais des contrats perpétuels sur actions sont exclus dans cette source.",
          "de": "Prüfen Sie Produktausschlüsse und Anspruchsbedingungen; Gebühren für Aktien-Perpetual-Kontrakte sind in dieser Quelle ausgeschlossen.",
          "ru": "Проверьте исключения по продуктам и условия получения; комиссии по бессрочным контрактам на акции исключены в этом источнике.",
          "id": "Tinjau pengecualian produk dan ketentuan klaim; biaya kontrak perpetual saham dikecualikan dalam sumber ini.",
          "vi": "Xem lại các loại trừ sản phẩm và điều khoản nhận quyền; phí hợp đồng vĩnh viễn trên cổ phiếu bị loại trừ trong nguồn này.",
          "it": "Esamina le esclusioni dei prodotti e i termini di richiesta; le commissioni dei contratti perpetui su azioni sono escluse in questa fonte.",
          // l10n: needs native review
          "ur": "مصنوعات استثنا اور کلیم شرائط دیکھیں؛ ایکوئٹی پرپیچوئل فیس اس ذریعہ میں خارج ہیں۔",
          // l10n: needs native review
          "uk": "Перегляньте винятки продуктів і умови отримання; комісії безстрокових контрактів на акції виключені в цьому джерелі."
        }
      ]
    },
    "sources": {
      "backpack-referrals": {
        "summary": {
          "en": "Read from the official support Markdown export after the web reader rejected its content type. Inviter benefits are not re-labelled as invitee rewards.",
          "zh-Hans": "网页读取器不支持内容类型后，已读取官方支持站的 Markdown 导出；不会把邀请人利益改写为受邀人奖励。",
          "zh-Hant": "網頁讀取器不支援內容類型後，已讀取官方支援站的 Markdown 匯出；不會把邀請人利益改寫為受邀人獎勵。",
          "ja": "Web リーダーがコンテンツ タイプを拒否した後、公式サポートのマークダウン エクスポートから読み取ります。招待者の特典は、招待者の特典として再ラベル付けされません。",
          "ko": "웹 리더가 콘텐츠 유형을 거부한 후 공식 지원 Markdown 내보내기를 읽어보세요. 초대자 혜택은 초대 대상자 보상으로 다시 표시되지 않습니다.",
          "tr": "Web okuyucusu içerik türünü reddettikten sonra resmi destek Markdown dışa aktarımından okuyun. Davet eden avantajları, davetli ödülleri olarak yeniden etiketlenmez.",
          "ar": "اقرأ من الدعم الرسمي لتصدير Markdown بعد أن رفض قارئ الويب نوع المحتوى الخاص به. لا يتم إعادة تصنيف مزايا المدعو على أنها مكافآت للمدعوين.",
          "es": "Lea la exportación de Markdown de soporte oficial después de que el lector web rechazó su tipo de contenido. Los beneficios para invitados no se vuelven a etiquetar como recompensas para invitados.",
          "pt-BR": "Leia o suporte oficial à exportação de Markdown depois que o leitor da web rejeitou seu tipo de conteúdo. Os benefícios do convidado não são renomeados como recompensas do convidado.",
          "fr": "Lisez à partir du support officiel Markdown Export après que le lecteur Web a rejeté son type de contenu. Les avantages des invités ne sont pas renommés en récompenses des invités.",
          "de": "Lesen Sie aus dem offiziellen Support-Markdown-Export, nachdem der Webreader seinen Inhaltstyp abgelehnt hat. Vorteile für Einladende werden nicht in Belohnungen für Eingeladene umbenannt.",
          "ru": "Прочитайте официальную поддержку экспорта Markdown после того, как веб-ридер отклонил его тип контента. Привилегии для приглашенных не переименовываются в награды для приглашенных.",
          "id": "Baca dari dukungan resmi Ekspor penurunan harga setelah pembaca web menolak jenis kontennya. Manfaat pengundang tidak diberi label ulang sebagai hadiah pengundang.",
          "vi": "Đọc từ hỗ trợ chính thức Xuất Markdown sau khi trình đọc web từ chối loại nội dung của nó. Lợi ích của người mời không được gắn nhãn lại là phần thưởng của người được mời.",
          "it": "Leggi dall'esportazione Markdown del supporto ufficiale dopo che il lettore Web ha rifiutato il tipo di contenuto. I vantaggi per gli invitati non vengono rietichettati come premi per gli invitati.",
          // l10n: needs native review
          "ur": "ویب ریڈر نے مواد کی قسم مسترد کرنے کے بعد اسے سرکاری سپورٹ Markdown ایکسپورٹ سے پڑھا گیا۔ مدعو کنندہ کے فوائد کو مدعو کیے گئے صارف کے انعامات کا نام نہیں دیا گیا۔",
          // l10n: needs native review
          "uk": "Прочитано з офіційного експорт Markdownу підтримки після того, як вебчитач відхилив його тип вмісту. Вигоди запрошувача не перейменовуються на винагороди запрошеного."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "Add a referral code before completing KYC; the document disallows adding one retroactively after KYC.",
        "zh-Hans": "邀请码需在完成 KYC 前添加，文档不支持 KYC 后补填。",
        "zh-Hant": "邀請碼需在完成 KYC 前加入，文件不支援 KYC 後補填。",
        "ja": "KYCを完了する前に紹介コードを追加してください。この文書では、KYC 後に遡って追加することを禁止しています。",
        "ko": "KYC를 완료하기 전에 추천 코드를 추가하세요. 문서에서는 KYC 이후에 소급하여 추가하는 것을 허용하지 않습니다.",
        "tr": "KYC'yi tamamlamadan önce bir yönlendirme kodu ekleyin; belge, KYC'den sonra geriye dönük olarak bir tane eklenmesine izin vermiyor.",
        "ar": "أضف رمز الإحالة قبل إكمال KYC؛ لا يسمح المستند بإضافة واحد بأثر رجعي بعد KYC.",
        "es": "Agregue un código de referencia antes de completar KYC; el documento no permite agregar uno retroactivamente después de KYC.",
        "pt-BR": "Adicione um código de referência antes de concluir o KYC; o documento não permite adicionar um retroativamente após KYC.",
        "fr": "Ajoutez un code de parrainage avant de terminer KYC ; le document interdit d’en ajouter un rétroactivement après KYC.",
        "de": "Fügen Sie einen Empfehlungscode hinzu, bevor Sie KYC abschließen. Das Dokument verbietet das rückwirkende Hinzufügen eines solchen nach KYC.",
        "ru": "Добавьте реферальный код перед завершением KYC; документ запрещает добавлять его задним числом после KYC.",
        "id": "Tambahkan kode referral sebelum menyelesaikan KYC; dokumen tersebut tidak mengizinkan penambahan kode susulan setelah KYC.",
        "vi": "Thêm mã giới thiệu trước khi hoàn thành KYC; tài liệu không cho phép thêm một tài liệu hồi tố sau KYC.",
        "it": "Aggiungi un codice di riferimento prima di completare KYC; il documento non ne consente l'aggiunta retroattiva dopo il KYC.",
        // l10n: needs native review
        "ur": "KYC مکمل کرنے سے پہلے ریفرل کوڈ شامل کریں؛ دستاویز KYC کے بعد بعد ازاں کوڈ شامل کرنے کی اجازت نہیں دیتا۔",
        // l10n: needs native review
        "uk": "Додайте реферальний код до завершення KYC; документ забороняє додавати його заднім числом після KYC."
      },
      "kyc": {
        "en": "Add a referral code before completing KYC; the document disallows adding one retroactively after KYC.",
        "zh-Hans": "邀请码需在完成 KYC 前添加，文档不支持 KYC 后补填。",
        "zh-Hant": "邀請碼需在完成 KYC 前加入，文件不支援 KYC 後補填。",
        "ja": "KYCを完了する前に紹介コードを追加してください。この文書では、KYC 後に遡って追加することを禁止しています。",
        "ko": "KYC를 완료하기 전에 추천 코드를 추가하세요. 문서에서는 KYC 이후에 소급하여 추가하는 것을 허용하지 않습니다.",
        "tr": "KYC'yi tamamlamadan önce bir yönlendirme kodu ekleyin; belge, KYC'den sonra geriye dönük olarak bir tane eklenmesine izin vermiyor.",
        "ar": "أضف رمز الإحالة قبل إكمال KYC؛ لا يسمح المستند بإضافة واحد بأثر رجعي بعد KYC.",
        "es": "Agregue un código de referencia antes de completar KYC; el documento no permite agregar uno retroactivamente después de KYC.",
        "pt-BR": "Adicione um código de referência antes de concluir o KYC; o documento não permite adicionar um retroativamente após KYC.",
        "fr": "Ajoutez un code de parrainage avant de terminer KYC ; le document interdit d’en ajouter un rétroactivement après KYC.",
        "de": "Fügen Sie einen Empfehlungscode hinzu, bevor Sie KYC abschließen. Das Dokument verbietet das rückwirkende Hinzufügen eines solchen nach KYC.",
        "ru": "Добавьте реферальный код перед завершением KYC; документ запрещает добавлять его задним числом после KYC.",
        "id": "Tambahkan kode referral sebelum menyelesaikan KYC; dokumen tersebut tidak mengizinkan penambahan kode susulan setelah KYC.",
        "vi": "Thêm mã giới thiệu trước khi hoàn thành KYC; tài liệu không cho phép thêm một tài liệu hồi tố sau KYC.",
        "it": "Aggiungi un codice di riferimento prima di completare KYC; il documento non ne consente l'aggiunta retroattiva dopo il KYC.",
        // l10n: needs native review
        "ur": "KYC مکمل کرنے سے پہلے ریفرل کوڈ شامل کریں؛ دستاویز KYC کے بعد بعد از وقت شامل کرنے کی اجازت نہیں دیتی۔",
        // l10n: needs native review
        "uk": "Додайте реферал код перед завершенням KYC; документ забороняє додавати його заднім числом після KYC."
      },
      "rewardType": {
        "en": "Inviter commission; invitee payment unconfirmed",
        "zh-Hans": "邀请人佣金，受邀人到账奖励未核实",
        "zh-Hant": "邀請人佣金，受邀人到帳獎勵未核實",
        "ja": "招待者手数料;招待者の支払いが未確認",
        "ko": "초대 수수료; 초대 대상자 결제가 확인되지 않았습니다.",
        "tr": "Davetçi komisyonu; davetlinin ödemesi onaylanmadı",
        "ar": "عمولة الداعي؛ لم يتم تأكيد دفع المدعوين",
        "es": "Comisión de invitados; pago del invitado no confirmado",
        "pt-BR": "Comissão de convidado; pagamento do convidado não confirmado",
        "fr": "Commission d'invitation ; paiement de l'invité non confirmé",
        "de": "Einladende Provision; Zahlung des Eingeladenen nicht bestätigt",
        "ru": "Комиссия приглашающего; платеж приглашенного не подтвержден",
        "id": "Komisi pengundang; pembayaran orang yang diundang belum dikonfirmasi",
        "vi": "Hoa hồng của người mời; khoản thanh toán của người được mời chưa được xác nhận",
        "it": "Commissione invitante; pagamento dell'invitato non confermato",
        // l10n: needs native review
        "ur": "مدعو کنندہ کمیشن؛ مدعو صارف کو ادائیگی غیر تصدیق شدہ۔",
        // l10n: needs native review
        "uk": "Комісія запрошувача; платіж запрошеному не підтверджено."
      },
      "limitations": {
        "en": "Review product exclusions and claim terms; equity-perpetual fees are excluded in this source.",
        "zh-Hans": "核对产品排除项和领取条款；来源排除了股票永续合约相关手续费。",
        "zh-Hant": "核對產品排除項和領取條款；來源排除了股票永續合約相關手續費。",
        "ja": "製品の除外条件と請求条件を確認してください。この情報源では株式無期限契約の手数料が除外されています。",
        "ko": "제품 제외 사항과 청구 조건을 확인하세요. 이 출처에서는 주식 무기한 계약 수수료가 제외됩니다.",
        "tr": "Ürün hariç tutmalarını ve talep koşullarını inceleyin; hisse senedi sürekli vadeli sözleşme ücretleri bu kaynakta hariç tutulur.",
        "ar": "راجع استثناءات المنتج وشروط المطالبة؛ رسوم عقود الأسهم الدائمة مستبعدة في هذا المصدر.",
        "es": "Revise las exclusiones de producto y los términos de reclamación; las comisiones de contratos perpetuos sobre acciones están excluidas en esta fuente.",
        "pt-BR": "Revise as exclusões de produto e os termos de solicitação; as taxas de contratos perpétuos de ações estão excluídas nesta fonte.",
        "fr": "Vérifiez les exclusions de produits et les conditions de réclamation ; les frais des contrats perpétuels sur actions sont exclus dans cette source.",
        "de": "Prüfen Sie Produktausschlüsse und Anspruchsbedingungen; Gebühren für Aktien-Perpetual-Kontrakte sind in dieser Quelle ausgeschlossen.",
        "ru": "Проверьте исключения по продуктам и условия получения; комиссии по бессрочным контрактам на акции исключены в этом источнике.",
        "id": "Tinjau pengecualian produk dan ketentuan klaim; biaya kontrak perpetual saham dikecualikan dalam sumber ini.",
        "vi": "Xem lại các loại trừ sản phẩm và điều khoản nhận quyền; phí hợp đồng vĩnh viễn trên cổ phiếu bị loại trừ trong nguồn này.",
        "it": "Esamina le esclusioni dei prodotti e i termini di richiesta; le commissioni dei contratti perpetui su azioni sono escluse in questa fonte.",
        // l10n: needs native review
        "ur": "پروڈکٹ اخراجات اور دعویٰ شرائط دیکھیں؛ اس ماخذ میں equity-perpetual فیسیں خارج ہیں۔",
        // l10n: needs native review
        "uk": "Перегляньте продуктові виключення й умови заявки; комісії equity-perpetual у цьому джерелі виключені."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The source describes a 10% inviter fee share after the referred user completes KYC. No invitee cash amount was verified from this document.",
          "zh-Hans": "来源描述好友完成 KYC 后，邀请人可分得 10% 交易手续费；该文档未核实受邀人的现金奖励金额。",
          "zh-Hant": "來源描述好友完成 KYC 後，邀請人可分得 10% 交易手續費；該文件未核實受邀人的現金獎勵金額。",
          "ja": "情報源には、紹介されたユーザーが KYC を完了した後、招待者料金の 10% が割り当てられると記載されています。この文書からは招待者の現金金額は確認されていません。",
          "ko": "출처는 추천된 사용자가 KYC를 완료한 후 10%의 초대 수수료 공유를 설명합니다. 이 문서에서는 초대받은 사람의 현금 금액이 확인되지 않았습니다.",
          "tr": "Kaynak, yönlendirilen kullanıcı KYC'yi tamamladıktan sonra %10 davetli ücreti payını açıklıyor. Bu belgeden davetlinin nakit tutarı doğrulanmadı.",
          "ar": "يصف المصدر حصة رسوم الدعوة بنسبة 10% بعد أن يكمل المستخدم المُحال عملية اعرف عميلك (KYC). لم يتم التحقق من أي مبلغ نقدي للمدعو من هذا المستند.",
          "es": "La fuente describe una tarifa compartida del 10% para el invitado después de que el usuario recomendado completa KYC. No se verificó ningún monto en efectivo del invitado a partir de este documento.",
          "pt-BR": "A fonte descreve uma parcela da taxa de convite de 10% após o usuário indicado concluir o KYC. Nenhum valor em dinheiro do convidado foi verificado neste documento.",
          "fr": "La source décrit une part des frais d'invitation de 10 % une fois que l'utilisateur référé a terminé le KYC. Aucun montant en espèces de l'invité n'a été vérifié à partir de ce document.",
          "de": "Die Quelle beschreibt einen Anteil von 10 % an der Einladungsgebühr, nachdem der empfohlene Benutzer KYC abgeschlossen hat. Aus diesem Dokument wurde kein Bargeldbetrag des eingeladenen Teilnehmers bestätigt.",
          "ru": "Источник описывает долю комиссии пригласителя в размере 10% после того, как приглашенный пользователь завершит KYC. Никакая сумма денежных средств приглашенного не была подтверждена из этого документа.",
          "id": "Sumber tersebut menjelaskan pembagian biaya pengundang sebesar 10% setelah pengguna yang dirujuk menyelesaikan KYC. Tidak ada jumlah uang tunai undangan yang diverifikasi dari dokumen ini.",
          "vi": "Nguồn mô tả chia sẻ phí người mời 10% sau khi người dùng được giới thiệu hoàn thành KYC. Không có số tiền mặt nào của người được mời được xác minh từ tài liệu này.",
          "it": "La fonte descrive una quota di commissione dell'invitatore del 10% dopo che l'utente segnalato ha completato il KYC. Nessun importo in contanti dell'invitato è stato verificato da questo documento.",
          // l10n: needs native review
          "ur": "ماخذ بتاتا ہے کہ ریفر کیے گئے صارف کے KYC مکمل کرنے کے بعد دعوت دینے والے کو 10% فیس شیئر ملتا ہے۔ اس دستاویز سے مدعو صارف کے لیے کوئی نقد رقم تصدیق نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Джерело описує 10% частку комісій для запрошувача після проходження KYC запрошеним користувачем. Із цього документа не перевірено жодної грошової суми для запрошеного."
        }
      ]
    }
  },
  "deribit": {
    "summary": {
      "en": "Deribit's published affiliate benefit is a time-limited fee discount; the program also has a documented migration schedule.",
      "zh-Hans": "Deribit 公开邀请利益属于限期手续费折扣，该计划还列有迁移时间表。",
      "zh-Hant": "Deribit 公開邀請利益屬於限期手續費折扣，該計畫還列有遷移時間表。",
      "ja": "Deribit の公開アフィリエイト特典は、期間限定の料金割引です。プログラムには文書化された移行スケジュールもあります。",
      "ko": "Deribit이 공개한 제휴 혜택은 시간 제한이 있는 수수료 할인입니다. 이 프로그램에는 문서화된 마이그레이션 일정도 있습니다.",
      "tr": "Deribit'in yayınlanmış ortaklık avantajı, süreli sınırlı ücret indirimidir; Program ayrıca belgelenmiş bir geçiş planına da sahiptir.",
      "ar": "إن فائدة الشركة التابعة المنشورة لشركة Deribit هي خصم على الرسوم لفترة محدودة؛ يحتوي البرنامج أيضًا على جدول ترحيل موثق.",
      "es": "El beneficio de afiliado publicado de Deribit es un descuento en la tarifa por tiempo limitado; El programa también tiene un cronograma de migración documentado.",
      "pt-BR": "O benefício de afiliado publicado da Deribit é um desconto de taxa por tempo limitado; o programa também possui um cronograma de migração documentado.",
      "fr": "L'avantage d'affiliation publié par Deribit est une réduction de frais limitée dans le temps ; le programme dispose également d'un calendrier de migration documenté.",
      "de": "Der veröffentlichte Affiliate-Vorteil von Deribit ist ein zeitlich begrenzter Gebührenrabatt; Das Programm verfügt außerdem über einen dokumentierten Migrationsplan.",
      "ru": "Опубликованное партнерское преимущество Deribit представляет собой ограниченную по времени скидку на комиссии; программа также имеет документированный график миграции.",
      "id": "Manfaat afiliasi yang diterbitkan Deribit adalah diskon biaya berbatas waktu; program ini juga memiliki jadwal migrasi yang terdokumentasi.",
      "vi": "Lợi ích liên kết được công bố của Deribit là giảm phí có giới hạn thời gian; chương trình cũng có lịch trình di chuyển được ghi lại.",
      "it": "Il vantaggio di affiliazione pubblicato da Deribit è uno sconto sulla commissione limitato nel tempo; il programma dispone anche di un programma di migrazione documentato.",
      // l10n: needs native review
      "ur": "Deribit کا شائع شدہ افیلی ایٹ فائدہ محدود مدت کا فیس رعایت ہے؛ پروگرام کا دستاویزی مائیگریشن شیڈول بھی ہے۔",
      // l10n: needs native review
      "uk": "Опублікована партнерська перевага Deribit — це обмежена в часі знижка на комісію; програма також має задокументований графік міграції."
    },
    "signupReward": {
      "summary": {
        "en": "Eligible new users of the covered entity receive a 10% trading-fee discount for six months through a valid affiliate link; spot is excluded.",
        "zh-Hans": "适用实体的合资格新用户通过有效邀请链接，可在六个月内享 10% 交易手续费折扣；现货交易不适用。",
        "zh-Hant": "適用實體的合資格新用戶透過有效邀請連結，可在六個月內享 10% 交易手續費折扣；現貨交易不適用。",
        "ja": "対象事業体の適格な新規ユーザーは、有効なアフィリエイトリンク経由で 6 か月間 10% の取引手数料割引を受けます。現物取引は対象外です。",
        "ko": "해당 법인의 적격 신규 사용자는 유효한 제휴 링크를 통해 6개월 동안 거래 수수료 10% 할인을 받습니다. 현물 거래는 제외됩니다.",
        "tr": "Kapsam dahilindeki kuruluşun uygun yeni kullanıcıları, geçerli bir ortaklık bağlantısı üzerinden altı ay boyunca %10 işlem ücreti indirimi alır; spot işlem hariçtir.",
        "ar": "يحصل المستخدمون الجدد المؤهلون للكيان المشمول على خصم 10% على رسوم التداول لمدة ستة أشهر من خلال رابط تابع صالح؛ التداول الفوري مستبعد.",
        "es": "Los nuevos usuarios elegibles de la entidad cubierta reciben un descuento del 10 % en las comisiones de trading durante seis meses mediante un enlace de afiliado válido; el trading spot está excluido.",
        "pt-BR": "Novos usuários elegíveis da entidade coberta recebem desconto de 10% nas taxas de negociação por seis meses por meio de um link de afiliado válido; negociação à vista está excluída.",
        "fr": "Les nouveaux utilisateurs éligibles de l'entité couverte bénéficient d'une remise de 10 % sur les frais de trading pendant six mois via un lien d'affiliation valide ; le trading au comptant est exclu.",
        "de": "Berechtigte neue Nutzer der abgedeckten Einheit erhalten über einen gültigen Affiliate-Link sechs Monate lang 10 % Rabatt auf Handelsgebühren; Spot-Handel ist ausgeschlossen.",
        "ru": "Новые пользователи соответствующей организации получают скидку 10% на торговые комиссии в течение шести месяцев по действующей партнерской ссылке; спотовая торговля исключена.",
        "id": "Pengguna baru yang memenuhi syarat dari entitas tercakup menerima diskon biaya trading 10% selama enam bulan melalui tautan afiliasi yang valid; perdagangan spot dikecualikan.",
        "vi": "Người dùng mới đủ điều kiện của thực thể được áp dụng nhận giảm 10% phí giao dịch trong sáu tháng thông qua liên kết liên kết hợp lệ; giao dịch spot bị loại trừ.",
        "it": "I nuovi utenti idonei dell'entità coperta ricevono uno sconto del 10% sulle commissioni di trading per sei mesi tramite un link affiliato valido; il trading spot è escluso.",
        // l10n: needs native review
        "ur": "متعلقہ ادارہ کے اہل نئے صارفین درست افیلی ایٹ لنک کے ذریعے چھ ماہ کے لیے 10% ٹریڈنگ فیس رعایت لیتے ہیں؛ اسپاٹ خارج ہے۔",
        // l10n: needs native review
        "uk": "Придатні нові користувачі охопленої юридичної особи отримують 10% знижки на торгові комісії на шість місяців через дійсне афіліатне посилання; спот виключено."
      },
      "conditions": [
        {
          "en": "Confirm the account is under DRB Panama, not Deribit FZE, and that the user's region is eligible.",
          "zh-Hans": "确认账户属于 DRB Panama 而非 Deribit FZE，并核对用户地区资格。",
          "zh-Hant": "確認帳戶屬於 DRB Panama 而非 Deribit FZE，並核對用戶地區資格。",
          "ja": "アカウントが Deribit FZE ではなく DRB Panama の下にあり、ユーザーの地域が対象であることを確認してください。",
          "ko": "계정이 Deribit FZE가 아닌 DRB 파나마에 속해 있는지, 사용자의 지역이 적격인지 확인하세요.",
          "tr": "Hesabın Deribit FZE değil DRB Panama kapsamında olduğunu ve kullanıcının bölgesinin uygun olduğunu doğrulayın.",
          "ar": "تأكد من أن الحساب تابع لـ DRB Pennsylvania، وليس Deribit FZE، وأن منطقة المستخدم مؤهلة.",
          "es": "Confirme que la cuenta esté bajo DRB Panamá, no Deribit FZE, y que la región del usuario sea elegible.",
          "pt-BR": "Confirme se a conta está no DRB Panamá, não no Deribit FZE, e se a região do usuário é elegível.",
          "fr": "Confirmez que le compte est sous DRB Panama, et non Deribit FZE, et que la région de l'utilisateur est éligible.",
          "de": "Bestätigen Sie, dass das Konto DRB Panama und nicht Deribit FZE unterliegt und dass die Region des Benutzers berechtigt ist.",
          "ru": "Убедитесь, что учетная запись находится под управлением DRB Panama, а не Deribit FZE, и что регион пользователя соответствует критериям.",
          "id": "Konfirmasikan bahwa akun tersebut berada di bawah DRB Panama, bukan Deribit FZE, dan bahwa wilayah pengguna memenuhi syarat.",
          "vi": "Xác nhận tài khoản thuộc DRB Panama chứ không phải Deribit FZE và khu vực của người dùng đủ điều kiện.",
          "it": "Verifica che l'account sia sotto DRB Panama, non Deribit FZE, e che la regione dell'utente sia idonea.",
          // l10n: needs native review
          "ur": "تصدیق کریں کہ اکاؤنٹ DRB Panama کے تحت ہے، Deribit FZE کے تحت نہیں، اور صارف کا علاقہ اہل ہے۔",
          // l10n: needs native review
          "uk": "Підтвердьте, що акаунт належить DRB Panama, а не Deribit FZE, і що регіон користувача придатний."
        },
        {
          "en": "The discount covers the first six months and excludes spot trading; it is not a cash bonus.",
          "zh-Hans": "折扣限前六个月且排除现货交易，不是现金赠金。",
          "zh-Hant": "折扣限前六個月且排除現貨交易，不是現金贈金。",
          "ja": "割引は最初の 6 か月間が対象で、現物取引は除外されます。現金ボーナスではありません。",
          "ko": "할인은 처음 6개월 동안 적용되며 현물 거래는 제외됩니다. 현금 보너스가 아닙니다.",
          "tr": "İndirim ilk altı ayı kapsar ve spot işlemi hariç tutar; nakit bonus değildir.",
          "ar": "يغطي الخصم الأشهر الستة الأولى ويستبعد التداول الفوري؛ وليس مكافأة نقدية.",
          "es": "El descuento cubre los primeros seis meses y excluye el trading spot; no es un bono en efectivo.",
          "pt-BR": "O desconto cobre os primeiros seis meses e exclui negociação à vista; não é bônus em dinheiro.",
          "fr": "La remise couvre les six premiers mois et exclut le trading au comptant ; ce n'est pas un bonus en espèces.",
          "de": "Der Rabatt gilt für die ersten sechs Monate und schließt Spot-Handel aus; er ist kein Bargeldbonus.",
          "ru": "Скидка действует первые шесть месяцев и исключает спотовую торговлю; это не денежный бонус.",
          "id": "Diskon berlaku untuk enam bulan pertama dan mengecualikan perdagangan spot; ini bukan bonus tunai.",
          "vi": "Khoản giảm giá áp dụng trong sáu tháng đầu và không bao gồm giao dịch spot; đây không phải tiền thưởng bằng tiền mặt.",
          "it": "Lo sconto copre i primi sei mesi ed esclude il trading spot; non è un bonus in denaro.",
          // l10n: needs native review
          "ur": "رعایت پہلے چھ ماہ کا احاطہ کرتی ہے اور اسپاٹ ٹریڈنگ کو خارج کرتی ہے؛ یہ نقد بونس نہیں۔",
          // l10n: needs native review
          "uk": "Знижка охоплює перші шість місяців і виключає спотову торгівлю; це не грошовий бонус."
        },
        {
          "en": "New affiliate creation stops on 9 September 2026; the document ends new-user onboarding through legacy links on 1 January 2027.",
          "zh-Hans": "2026 年 9 月 9 日停止创建新 affiliate；文档说明 2027 年 1 月 1 日起旧链接不再用于新用户归因开户。",
          "zh-Hant": "2026 年 9 月 9 日停止建立新 affiliate；文件說明 2027 年 1 月 1 日起舊連結不再用於新用戶歸因開戶。",
          "ja": "新しいアフィリエイトの作成は 2026 年 9 月 9 日に停止されます。この文書では、レガシー リンクを介した新規ユーザーのオンボーディングは 2027 年 1 月 1 日に終了します。",
          "ko": "새로운 제휴 생성은 2026년 9월 9일에 중단됩니다. 이 문서는 2027년 1월 1일에 레거시 링크를 통한 신규 사용자 온보딩을 종료합니다.",
          "tr": "Yeni satış ortağı oluşturma 9 Eylül 2026'da sona erecek; belge, 1 Ocak 2027'de eski bağlantılar aracılığıyla yeni kullanıcıların katılımını sona erdiriyor.",
          "ar": "يتوقف إنشاء الشركة التابعة الجديدة في 9 سبتمبر 2026؛ تنتهي الوثيقة من إعداد المستخدم الجديد من خلال الروابط القديمة في 1 يناير 2027.",
          "es": "La creación de nuevos afiliados finaliza el 9 de septiembre de 2026; El documento finaliza la incorporación de nuevos usuarios a través de enlaces heredados el 1 de enero de 2027.",
          "pt-BR": "A criação de novos afiliados termina em 9 de setembro de 2026; o documento encerra a integração de novos usuários por meio de links legados em 1º de janeiro de 2027.",
          "fr": "La création de nouveaux affiliés s'arrête le 9 septembre 2026 ; le document met fin à l’intégration des nouveaux utilisateurs via les liens existants le 1er janvier 2027.",
          "de": "Die Erstellung neuer Partner endet am 9. September 2026; Das Dokument beendet das Onboarding neuer Benutzer über alte Links am 1. Januar 2027.",
          "ru": "Создание новых партнеров прекратится 9 сентября 2026 г.; документ завершает регистрацию новых пользователей по устаревшим ссылкам 1 января 2027 года.",
          "id": "Pembuatan afiliasi baru dihentikan pada 9 September 2026; dokumen tersebut mengakhiri orientasi pengguna baru melalui tautan lama pada 1 Januari 2027.",
          "vi": "Quá trình tạo đơn vị liên kết mới sẽ dừng vào ngày 9 tháng 9 năm 2026; tài liệu này sẽ kết thúc quá trình giới thiệu người dùng mới thông qua các đường liên kết cũ vào ngày 1 tháng 1 năm 2027.",
          "it": "La creazione di nuovi affiliati termina il 9 settembre 2026; il documento termina l'onboarding di nuovi utenti tramite collegamenti legacy il 1° gennaio 2027.",
          // l10n: needs native review
          "ur": "نئے افیلیئٹ بنانا 9 ستمبر 2026 کو رک جائے گا؛ دستاویز کے مطابق پرانے لنکس کے ذریعے نئے صارفین کی آن بورڈنگ 1 جنوری 2027 کو ختم ہو جائے گی۔",
          // l10n: needs native review
          "uk": "Створення нових афіліатів зупиняється 9 вересня 2026 року; документ припиняє онбординг нових користувачів через застарілі посилання 1 січня 2027 року."
        }
      ]
    },
    "sources": {
      "deribit-affiliate-migration": {
        "summary": {
          "en": "Updated 7 August 2026. Migration dates are stated without a timezone; no precise UTC cutoff is invented.",
          "zh-Hans": "更新于 2026 年 8 月 7 日。迁移日期未标时区，不虚构精确 UTC 截止时刻。",
          "zh-Hant": "更新於 2026 年 8 月 7 日。遷移日期未標時區，不虛構精確 UTC 截止時刻。",
          "ja": "2026 年 8 月 7 日更新。移行日はタイムゾーンなしで記載されています。正確な UTC カットオフは発明されていません。",
          "ko": "2026년 8월 7일에 업데이트되었습니다. 마이그레이션 날짜는 시간대 없이 명시됩니다. 정확한 UTC 컷오프는 발명되지 않았습니다.",
          "tr": "7 Ağustos 2026'da güncellendi. Taşıma tarihleri, saat dilimi olmadan belirtiliyor; kesin bir UTC sınırı icat edilmedi.",
          "ar": "تم التحديث في 7 أغسطس 2026. ذُكرت تواريخ الترحيل بدون منطقة زمنية؛ ولم يُفترض أي موعد نهائي دقيق بتوقيت UTC.",
          "es": "Actualizado el 7 de agosto de 2026. Las fechas de migración se indican sin zona horaria; no se inventa ningún límite UTC preciso.",
          "pt-BR": "Atualizado em 7 de agosto de 2026. As datas de migração são indicadas sem fuso horário; nenhum corte UTC preciso foi inventado.",
          "fr": "Mis à jour le 7 août 2026. Les dates de migration sont indiquées sans fuseau horaire ; aucune coupure UTC précise n'est inventée.",
          "de": "Aktualisiert am 7. August 2026. Migrationsdaten werden ohne Zeitzone angegeben; Es wird kein präziser UTC-Grenzwert erfunden.",
          "ru": "Обновлено 7 августа 2026 г. Даты миграции указаны без часового пояса; точное время отсечки по UTC произвольно не задавалось.",
          "id": "Diperbarui 7 Agustus 2026. Tanggal migrasi dinyatakan tanpa zona waktu; tidak ada batas waktu UTC pasti yang dibuat-buat.",
          "vi": "Cập nhật ngày 7 tháng 8 năm 2026. Ngày chuyển đổi được nêu không kèm múi giờ; không tự ý đặt ra mốc chốt UTC cụ thể nào.",
          "it": "Aggiornato il 7 agosto 2026. Le date di migrazione sono indicate senza fuso orario; non è stato inventato alcun limite UTC preciso.",
          // l10n: needs native review
          "ur": "7 اگست 2026 کو اپ ڈیٹ۔ منتقلی کی تاریخیں بغیر ٹائم زون کے درج ہیں؛ کوئی من گھڑت UTC کٹ آف شامل نہیں کیا گیا۔",
          // l10n: needs native review
          "uk": "Оновлено 7 серпня 2026 року. Міграція дати зазначені без часовий пояс; точний UTC крайній строк не вигадується."
        }
      }
    },
    "evidenceRequirements": {
      "regions": {
        "en": "Confirm the account is under DRB Panama, not Deribit FZE, and that the user's region is eligible.",
        "zh-Hans": "确认账户属于 DRB Panama 而非 Deribit FZE，并核对用户地区资格。",
        "zh-Hant": "確認帳戶屬於 DRB Panama 而非 Deribit FZE，並核對用戶地區資格。",
        "ja": "アカウントが Deribit FZE ではなく DRB Panama の下にあり、ユーザーの地域が対象であることを確認してください。",
        "ko": "계정이 Deribit FZE가 아닌 DRB 파나마에 속해 있는지, 사용자의 지역이 적격인지 확인하세요.",
        "tr": "Hesabın Deribit FZE değil DRB Panama kapsamında olduğunu ve kullanıcının bölgesinin uygun olduğunu doğrulayın.",
        "ar": "تأكد من أن الحساب تابع لـ DRB Pennsylvania، وليس Deribit FZE، وأن منطقة المستخدم مؤهلة.",
        "es": "Confirme que la cuenta esté bajo DRB Panamá, no Deribit FZE, y que la región del usuario sea elegible.",
        "pt-BR": "Confirme se a conta está no DRB Panamá, não no Deribit FZE, e se a região do usuário é elegível.",
        "fr": "Confirmez que le compte est sous DRB Panama, et non Deribit FZE, et que la région de l'utilisateur est éligible.",
        "de": "Bestätigen Sie, dass das Konto DRB Panama und nicht Deribit FZE unterliegt und dass die Region des Benutzers berechtigt ist.",
        "ru": "Убедитесь, что учетная запись находится под управлением DRB Panama, а не Deribit FZE, и что регион пользователя соответствует критериям.",
        "id": "Konfirmasikan bahwa akun tersebut berada di bawah DRB Panama, bukan Deribit FZE, dan bahwa wilayah pengguna memenuhi syarat.",
        "vi": "Xác nhận tài khoản thuộc DRB Panama chứ không phải Deribit FZE và khu vực của người dùng đủ điều kiện.",
        "it": "Verifica che l'account sia sotto DRB Panama, non Deribit FZE, e che la regione dell'utente sia idonea.",
        // l10n: needs native review
        "ur": "تصدیق کریں کہ اکاؤنٹ DRB Panama کے تحت ہے، Deribit FZE کے تحت نہیں، اور صارف کا علاقہ اہل ہے۔",
        // l10n: needs native review
        "uk": "Підтвердьте, що акаунт належить DRB Panama, а не Deribit FZE, і що регіон користувача придатний."
      },
      "eligibility": {
        "en": "Confirm the account is under DRB Panama, not Deribit FZE, and that the user's region is eligible.",
        "zh-Hans": "确认账户属于 DRB Panama 而非 Deribit FZE，并核对用户地区资格。",
        "zh-Hant": "確認帳戶屬於 DRB Panama 而非 Deribit FZE，並核對用戶地區資格。",
        "ja": "アカウントが Deribit FZE ではなく DRB Panama の下にあり、ユーザーの地域が対象であることを確認してください。",
        "ko": "계정이 Deribit FZE가 아닌 DRB 파나마에 속해 있는지, 사용자의 지역이 적격인지 확인하세요.",
        "tr": "Hesabın Deribit FZE değil DRB Panama kapsamında olduğunu ve kullanıcının bölgesinin uygun olduğunu doğrulayın.",
        "ar": "تأكد من أن الحساب تابع لـ DRB Pennsylvania، وليس Deribit FZE، وأن منطقة المستخدم مؤهلة.",
        "es": "Confirme que la cuenta esté bajo DRB Panamá, no Deribit FZE, y que la región del usuario sea elegible.",
        "pt-BR": "Confirme se a conta está no DRB Panamá, não no Deribit FZE, e se a região do usuário é elegível.",
        "fr": "Confirmez que le compte est sous DRB Panama, et non Deribit FZE, et que la région de l'utilisateur est éligible.",
        "de": "Bestätigen Sie, dass das Konto DRB Panama und nicht Deribit FZE unterliegt und dass die Region des Benutzers berechtigt ist.",
        "ru": "Убедитесь, что учетная запись находится под управлением DRB Panama, а не Deribit FZE, и что регион пользователя соответствует критериям.",
        "id": "Konfirmasikan bahwa akun tersebut berada di bawah DRB Panama, bukan Deribit FZE, dan bahwa wilayah pengguna memenuhi syarat.",
        "vi": "Xác nhận tài khoản thuộc DRB Panama chứ không phải Deribit FZE và khu vực của người dùng đủ điều kiện.",
        "it": "Verifica che l'account sia sotto DRB Panama, non Deribit FZE, e che la regione dell'utente sia idonea.",
        // l10n: needs native review
        "ur": "تصدیق کریں کہ اکاؤنٹ DRB Panama کے تحت ہے، Deribit FZE کے تحت نہیں، اور صارف کا ریجن اہل ہے۔",
        // l10n: needs native review
        "uk": "Підтвердьте, що акаунт перебуває під DRB Panama, а не Deribit FZE, і що регіон користувача придатний."
      },
      "trading": {
        "en": "The discount covers the first six months and excludes spot trading; it is not a cash bonus.",
        "zh-Hans": "折扣限前六个月且排除现货交易，不是现金赠金。",
        "zh-Hant": "折扣限前六個月且排除現貨交易，不是現金贈金。",
        "ja": "割引は最初の 6 か月間が対象で、現物取引は除外されます。現金ボーナスではありません。",
        "ko": "할인은 처음 6개월 동안 적용되며 현물 거래는 제외됩니다. 현금 보너스가 아닙니다.",
        "tr": "İndirim ilk altı ayı kapsar ve spot işlemi hariç tutar; nakit bonus değildir.",
        "ar": "يغطي الخصم الأشهر الستة الأولى ويستبعد التداول الفوري؛ وليس مكافأة نقدية.",
        "es": "El descuento cubre los primeros seis meses y excluye el trading spot; no es un bono en efectivo.",
        "pt-BR": "O desconto cobre os primeiros seis meses e exclui negociação à vista; não é bônus em dinheiro.",
        "fr": "La remise couvre les six premiers mois et exclut le trading au comptant ; ce n'est pas un bonus en espèces.",
        "de": "Der Rabatt gilt für die ersten sechs Monate und schließt Spot-Handel aus; er ist kein Bargeldbonus.",
        "ru": "Скидка действует первые шесть месяцев и исключает спотовую торговлю; это не денежный бонус.",
        "id": "Diskon berlaku untuk enam bulan pertama dan mengecualikan perdagangan spot; ini bukan bonus tunai.",
        "vi": "Khoản giảm giá áp dụng trong sáu tháng đầu và không bao gồm giao dịch spot; đây không phải tiền thưởng bằng tiền mặt.",
        "it": "Lo sconto copre i primi sei mesi ed esclude il trading spot; non è un bonus in denaro.",
        // l10n: needs native review
        "ur": "رعایت پہلے چھ ماہ کا احاطہ کرتی ہے اور اسپاٹ ٹریڈنگ کو خارج کرتی ہے؛ یہ نقد بونس نہیں۔",
        // l10n: needs native review
        "uk": "Знижка охоплює перші шість місяців і виключає спот торгівля; це не готівка бонус."
      },
      "rewardType": {
        "en": "Discount on specified trading fees",
        "zh-Hans": "指定交易手续费折扣",
        "zh-Hant": "指定交易手續費折扣",
        "ja": "指定取引手数料の割引",
        "ko": "특정 거래 수수료 할인",
        "tr": "Belirtilen işlem ücretlerinde indirim",
        "ar": "خصم على رسوم التداول المحددة",
        "es": "Descuento en tarifas comerciales específicas",
        "pt-BR": "Desconto em taxas de negociação específicas",
        "fr": "Remise sur les frais de négociation spécifiés",
        "de": "Rabatt auf bestimmte Handelsgebühren",
        "ru": "Скидка на указанные торговые комиссии",
        "id": "Diskon biaya perdagangan tertentu",
        "vi": "Giảm phí giao dịch được chỉ định",
        "it": "Sconto sulle commissioni di negoziazione specificate",
        // l10n: needs native review
        "ur": "مخصوص ٹریڈنگ فیس پر رعایت۔",
        // l10n: needs native review
        "uk": "Знижка на визначені торгові комісії."
      },
      "maximumConditions": {
        "en": "The discount covers the first six months and excludes spot trading; it is not a cash bonus.",
        "zh-Hans": "折扣限前六个月且排除现货交易，不是现金赠金。",
        "zh-Hant": "折扣限前六個月且排除現貨交易，不是現金贈金。",
        "ja": "割引は最初の 6 か月間が対象で、現物取引は除外されます。現金ボーナスではありません。",
        "ko": "할인은 처음 6개월 동안 적용되며 현물 거래는 제외됩니다. 현금 보너스가 아닙니다.",
        "tr": "İndirim ilk altı ayı kapsar ve spot işlemi hariç tutar; nakit bonus değildir.",
        "ar": "يغطي الخصم الأشهر الستة الأولى ويستبعد التداول الفوري؛ وليس مكافأة نقدية.",
        "es": "El descuento cubre los primeros seis meses y excluye el trading spot; no es un bono en efectivo.",
        "pt-BR": "O desconto cobre os primeiros seis meses e exclui negociação à vista; não é bônus em dinheiro.",
        "fr": "La remise couvre les six premiers mois et exclut le trading au comptant ; ce n'est pas un bonus en espèces.",
        "de": "Der Rabatt gilt für die ersten sechs Monate und schließt Spot-Handel aus; er ist kein Bargeldbonus.",
        "ru": "Скидка действует первые шесть месяцев и исключает спотовую торговлю; это не денежный бонус.",
        "id": "Diskon berlaku untuk enam bulan pertama dan mengecualikan perdagangan spot; ini bukan bonus tunai.",
        "vi": "Khoản giảm giá áp dụng trong sáu tháng đầu và không bao gồm giao dịch spot; đây không phải tiền thưởng bằng tiền mặt.",
        "it": "Lo sconto copre i primi sei mesi ed esclude il trading spot; non è un bonus in denaro.",
        // l10n: needs native review
        "ur": "رعایت پہلے چھ ماہ کا احاطہ کرتی ہے اور اسپاٹ ٹریڈنگ کو خارج کرتی ہے؛ یہ نقد بونس نہیں۔",
        // l10n: needs native review
        "uk": "Знижка охоплює перші шість місяців і виключає спотову торгівлю; це не грошовий бонус."
      },
      "limitations": {
        "en": "New affiliate creation stops on 9 September 2026; the document ends new-user onboarding through legacy links on 1 January 2027.",
        "zh-Hans": "2026 年 9 月 9 日停止创建新 affiliate；文档说明 2027 年 1 月 1 日起旧链接不再用于新用户归因开户。",
        "zh-Hant": "2026 年 9 月 9 日停止建立新 affiliate；文件說明 2027 年 1 月 1 日起舊連結不再用於新用戶歸因開戶。",
        "ja": "新しいアフィリエイトの作成は 2026 年 9 月 9 日に停止されます。この文書では、レガシー リンクを介した新規ユーザーのオンボーディングは 2027 年 1 月 1 日に終了します。",
        "ko": "새로운 제휴 생성은 2026년 9월 9일에 중단됩니다. 이 문서는 2027년 1월 1일에 레거시 링크를 통한 신규 사용자 온보딩을 종료합니다.",
        "tr": "Yeni satış ortağı oluşturma 9 Eylül 2026'da sona erecek; belge, 1 Ocak 2027'de eski bağlantılar aracılığıyla yeni kullanıcıların katılımını sona erdiriyor.",
        "ar": "يتوقف إنشاء الشركة التابعة الجديدة في 9 سبتمبر 2026؛ تنتهي الوثيقة من إعداد المستخدم الجديد من خلال الروابط القديمة في 1 يناير 2027.",
        "es": "La creación de nuevos afiliados finaliza el 9 de septiembre de 2026; El documento finaliza la incorporación de nuevos usuarios a través de enlaces heredados el 1 de enero de 2027.",
        "pt-BR": "A criação de novos afiliados termina em 9 de setembro de 2026; o documento encerra a integração de novos usuários por meio de links legados em 1º de janeiro de 2027.",
        "fr": "La création de nouveaux affiliés s'arrête le 9 septembre 2026 ; le document met fin à l’intégration des nouveaux utilisateurs via les liens existants le 1er janvier 2027.",
        "de": "Die Erstellung neuer Partner endet am 9. September 2026; Das Dokument beendet das Onboarding neuer Benutzer über alte Links am 1. Januar 2027.",
        "ru": "Создание новых партнеров прекратится 9 сентября 2026 г.; документ завершает регистрацию новых пользователей по устаревшим ссылкам 1 января 2027 года.",
        "id": "Pembuatan afiliasi baru dihentikan pada 9 September 2026; dokumen tersebut mengakhiri orientasi pengguna baru melalui tautan lama pada 1 Januari 2027.",
        "vi": "Quá trình tạo đơn vị liên kết mới sẽ dừng vào ngày 9 tháng 9 năm 2026; tài liệu này sẽ kết thúc quá trình giới thiệu người dùng mới thông qua các đường liên kết cũ vào ngày 1 tháng 1 năm 2027.",
        "it": "La creazione di nuovi affiliati termina il 9 settembre 2026; il documento termina l'onboarding di nuovi utenti tramite collegamenti legacy il 1° gennaio 2027.",
        // l10n: needs native review
        "ur": "نئی افیلی ایٹ بنانا 9 ستمبر 2026 کو رکتی ہے؛ دستاویز پرانے لنکس کے ذریعے نئے صارف کی شمولیت کو 1 جنوری 2027 کو ختم کرتی ہے۔",
        // l10n: needs native review
        "uk": "Створення нових афіліатів припиняється 9 вересня 2026 року; документ припиняє онбординг нових користувачів через застарілі посилання 1 січня 2027 року."
      },
      "publishedDate": {
        "en": "2026-08-07 16:12",
        "zh-Hans": "2026-08-07 16:12",
        "zh-Hant": "2026-08-07 16:12",
        "ja": "2026-08-07 16:12",
        "ko": "2026-08-07 16:12",
        "tr": "2026-08-07 16:12",
        "ar": "2026-08-07 16:12",
        "es": "2026-08-07 16:12",
        "pt-BR": "07/08/2026 16:12",
        "fr": "2026-08-07 16:12",
        "de": "07.08.2026 16:12",
        "ru": "2026-08-07 16:12",
        "id": "07-08-2026 16:12",
        "vi": "2026-08-07 16:12",
        "it": "2026-08-07 16:12",
        // l10n: needs native review
        "ur": "2026-08-07 16:12",
        // l10n: needs native review
        "uk": "2026-08-07 16:12"
      },
      "datePrecision": {
        "en": "Source date retained as displayed; no missing timezone is inferred.",
        "zh-Hans": "保留来源显示日期，不推断缺失时区。",
        "zh-Hant": "保留來源顯示日期，不推斷缺失時區。",
        "ja": "ソースの日付は表示どおりに保持されます。欠落しているタイムゾーンは推論されません。",
        "ko": "소스 날짜는 표시된 대로 유지됩니다. 누락된 시간대는 유추되지 않습니다.",
        "tr": "Kaynak tarihi görüntülendiği şekilde tutuldu; eksik bir saat diliminin olmadığı anlaşılmaktadır.",
        "ar": "تم الاحتفاظ بتاريخ المصدر كما هو معروض؛ لا يتم استنتاج أي منطقة زمنية مفقودة.",
        "es": "La fecha de origen se conserva tal como se muestra; no se infiere ninguna zona horaria faltante.",
        "pt-BR": "Data de origem mantida conforme exibida; nenhum fuso horário ausente é inferido.",
        "fr": "Date source conservée telle qu'affichée ; aucun fuseau horaire manquant n’est déduit.",
        "de": "Quelldatum wie angezeigt beibehalten; Es wird keine fehlende Zeitzone abgeleitet.",
        "ru": "Исходная дата сохраняется в том виде, в каком она отображается; отсутствие отсутствующего часового пояса не предполагается.",
        "id": "Tanggal sumber dipertahankan seperti yang ditampilkan; tidak ada zona waktu yang hilang yang disimpulkan.",
        "vi": "Ngày nguồn được giữ lại như được hiển thị; không có múi giờ bị thiếu được suy ra.",
        "it": "Data di origine mantenuta come visualizzata; non si deduce alcun fuso orario mancante.",
        // l10n: needs native review
        "ur": "ذریعہ تاریخ جوں کی توں دکھائی گئی برقرار ہے؛ غائب ٹائم زون اخذ نہیں کیا گیا۔",
        // l10n: needs native review
        "uk": "Дату джерела збережено як показано; відсутній часовий пояс не виводиться."
      },
      "gaps": [
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ذریعہ لاگو شناختی تصدیق کی شرط ثابت نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; null не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مہم کی کوئی قطعی مدت تصدیق شدہ نہیں ہے؛ صرف پڑھنے کے قابل صفحہ پیشکش فعال ہونے کو ثابت نہیں کر سکتا۔",
          // l10n: needs native review
          "uk": "Повне абсолютне вікно кампанії не підтверджено; сама читабельна сторінка не може встановити, що пропозиція активна."
        }
      ]
    },
    "notices": [
      {
        "en": "Before enabling any commercial link, recheck the migration and account entity. A readable old affiliate page is not proof of perpetual attribution.",
        "zh-Hans": "启用任何商业链接前须再次核对迁移与账户实体；旧邀请页仍可打开，不代表归因长期有效。",
        "zh-Hant": "啟用任何商業連結前須再次核對遷移與帳戶實體；舊邀請頁仍可開啟，不代表歸因長期有效。",
        "ja": "商用リンクを有効にする前に、移行とアカウント主体を再確認してください。読み取れる古いアフィリエイトページは、長期的な帰属の証明ではありません。",
        "ko": "상업용 링크를 활성화하기 전에 마이그레이션과 계정 주체를 다시 확인하세요. 읽을 수 있는 오래된 제휴 페이지는 장기 귀속의 증거가 아닙니다.",
        "tr": "Herhangi bir ticari bağlantıyı etkinleştirmeden önce taşıma ve hesap varlığını yeniden kontrol edin. Okunabilir eski bir ortaklık sayfası, uzun vadeli atıfın kanıtı değildir.",
        "ar": "قبل تمكين أي رابط تجاري، أعد التحقق من الترحيل وكيان الحساب. الصفحة التابعة القديمة القابلة للقراءة ليست دليلًا على استمرار الإسناد على المدى الطويل.",
        "es": "Antes de habilitar cualquier enlace comercial, vuelva a comprobar la migración y la entidad de la cuenta. Una página antigua de afiliado legible no prueba atribución a largo plazo.",
        "pt-BR": "Antes de habilitar qualquer link comercial, verifique novamente a migração e a entidade da conta. Uma página antiga de afiliado legível não prova atribuição de longo prazo.",
        "fr": "Avant d'activer un lien commercial, revérifiez la migration et l'entité du compte. Une ancienne page d'affiliation lisible ne prouve pas une attribution à long terme.",
        "de": "Bevor Sie einen kommerziellen Link aktivieren, prüfen Sie Migration und Kontoeinheit erneut. Eine lesbare alte Affiliate-Seite belegt keine langfristige Zuordnung.",
        "ru": "Перед включением любой коммерческой ссылки повторно проверьте миграцию и сущность аккаунта. Читаемая старая партнерская страница не доказывает долгосрочную атрибуцию.",
        "id": "Sebelum mengaktifkan tautan komersial apa pun, periksa kembali migrasi dan entitas akun. Halaman afiliasi lama yang dapat dibaca bukan bukti atribusi jangka panjang.",
        "vi": "Trước khi bật bất kỳ liên kết thương mại nào, hãy kiểm tra lại việc di chuyển và thực thể tài khoản. Một trang liên kết cũ có thể đọc được không chứng minh ghi nhận dài hạn.",
        "it": "Prima di abilitare qualsiasi link commerciale, ricontrolla la migrazione e l'entità dell'account. Una vecchia pagina affiliata leggibile non prova l'attribuzione a lungo termine.",
        // l10n: needs native review
        "ur": "کوئی کمرشل لنک فعال کرنے سے پہلے مائیگریشن اور اکاؤنٹ ادارہ دوبارہ چیک کریں۔ پڑھنے کے قابل پرانا افیلی ایٹ صفحہ دائمی انتساب کا ثبوت نہیں۔",
        // l10n: needs native review
        "uk": "Перед увімкненням будь-якого комерційного посилання повторно перевірте міграцію й юридичну юридична особа акаунта. Читабельна стара афіліат-сторінка не доводить безстрокову атрибуцію."
      }
    ]
  },
  "uniswap": {
    "summary": {
      "en": "Uniswap v4 can host permissioned pools: issuer allowlists can apply to swaps and liquidity separately, unlike unrestricted pools.",
      "zh-Hans": "Uniswap v4 可承载许可型池：发行方能分别控制交易与提供流动性的白名单，并非所有池都无条件开放。",
      "zh-Hant": "Uniswap v4 可承載許可型池：發行方能分別控制交易與提供流動性的白名單，並非所有池都無條件開放。",
      "ja": "Uniswap v4 は、許可されたプールをホストできます。制限のないプールとは異なり、発行者の許可リストはスワップと流動性に個別に適用できます。",
      "ko": "Uniswap v4는 허가된 풀을 호스팅할 수 있습니다. 발급자 허용 목록은 무제한 풀과 달리 스왑 및 유동성에 별도로 적용될 수 있습니다.",
      "tr": "Uniswap v4, izin verilen havuzları barındırabilir: ihraççının izin verilenler listeleri, kısıtlanmamış havuzların aksine takaslara ve likiditeye ayrı ayrı uygulanabilir.",
      "ar": "يمكن لـ Uniswap v4 استضافة مجموعات مرخصة: يمكن تطبيق القوائم المسموح بها لجهة الإصدار على المقايضة والسيولة بشكل منفصل، على عكس المجموعات غير المقيدة.",
      "es": "Uniswap v4 puede albergar grupos autorizados: las listas permitidas de emisores pueden aplicarse a los swaps y la liquidez por separado, a diferencia de los grupos no restringidos.",
      "pt-BR": "O Uniswap v4 pode hospedar pools autorizados: listas de permissões de emissores podem ser aplicadas a swaps e liquidez separadamente, ao contrário de pools irrestritos.",
      "fr": "Uniswap v4 peut héberger des pools autorisés : les listes autorisées des émetteurs peuvent s'appliquer séparément aux swaps et aux liquidités, contrairement aux pools sans restriction.",
      "de": "Uniswap v4 kann zugelassene Pools hosten: Emittenten-Zulassungslisten können im Gegensatz zu uneingeschränkten Pools separat für Swaps und Liquidität gelten.",
      "ru": "Uniswap v4 может размещать разрешенные пулы: белые списки эмитентов могут применяться к свопам и ликвидности отдельно, в отличие от неограниченных пулов.",
      "id": "Uniswap v4 dapat menampung pool berizin: whitelist penerbit dapat berlaku untuk swap dan likuiditas secara terpisah, tidak seperti pool tanpa batas.",
      "vi": "Uniswap v4 có thể lưu trữ các nhóm được cấp phép: danh sách cho phép của nhà phát hành có thể áp dụng riêng cho các giao dịch hoán đổi và thanh khoản, không giống như các nhóm không bị hạn chế.",
      "it": "Uniswap v4 può ospitare pool autorizzati: le liste consentite degli emittenti possono applicarsi separatamente agli swap e alla liquidità, a differenza dei pool senza restrizioni.",
      // l10n: needs native review
      "ur": "Uniswap v4 اجازت یافتہ پولز ہوسٹ کر سکتا ہے: جاری کنندہ اجازت فہرستیں سواپس اور لیکویڈیٹی پر الگ الگ لاگو ہو سکتی ہیں، غیر محدود پولز کے برعکس۔",
      // l10n: needs native review
      "uk": "Uniswap v4 може розміщувати пули з дозволами: списки дозволених адрес від емітента можуть окремо застосовуватися до свопів і ліквідності, на відміну від необмежених пулів."
    },
    "signupReward": {
      "summary": {
        "en": "This is a pool-access product notice, not a centralized-exchange signup reward.",
        "zh-Hans": "这是流动性池准入机制的产品说明，不是中心化交易所式注册奖励。",
        "zh-Hant": "這是流動性池准入機制的產品說明，不是中心化交易所式註冊獎勵。",
        "ja": "これはプールアクセス製品に関する通知であり、集中取引所のサインアップ報酬ではありません。",
        "ko": "이는 중앙화된 거래소 가입 보상이 아닌 풀 액세스 제품 공지입니다.",
        "tr": "Bu bir havuz erişim ürünü bildirimidir, merkezi borsa kayıt ödülü değildir.",
        "ar": "هذا إشعار منتج للوصول إلى المجمع، وليس مكافأة تسجيل في البورصة المركزية.",
        "es": "Este es un aviso de producto de acceso al grupo, no una recompensa de registro de intercambio centralizado.",
        "pt-BR": "Este é um aviso de produto de acesso ao pool, não uma recompensa de inscrição em exchange centralizada.",
        "fr": "Il s'agit d'un avis de produit d'accès au pool, et non d'une récompense d'inscription à un échange centralisé.",
        "de": "Hierbei handelt es sich um eine Produktmitteilung für den Poolzugang, nicht um eine Anmeldeprämie für eine zentralisierte Börse.",
        "ru": "Это уведомление о доступе к пулу продуктов, а не вознаграждение за регистрацию на централизованной бирже.",
        "id": "Ini adalah pemberitahuan produk akses kumpulan, bukan hadiah pendaftaran pertukaran terpusat.",
        "vi": "Đây là thông báo về sản phẩm truy cập nhóm, không phải phần thưởng đăng ký trao đổi tập trung.",
        "it": "Questo è un avviso sul prodotto con accesso al pool, non un premio per l'iscrizione a uno scambio centralizzato.",
        // l10n: needs native review
        "ur": "یہ پول-رسائی مصنوعات نوٹس ہے، مرکزی ایکسچینج سائن اپ انعام نہیں۔",
        // l10n: needs native review
        "uk": "Це повідомлення про продукт доступу до пулу, а не централізованої біржі реєстрацію винагорода."
      },
      "conditions": [
        {
          "en": "Identify whether the specific pool uses permissioned access.",
          "zh-Hans": "先识别目标池是否采用许可准入。",
          "zh-Hant": "先識別目標池是否採用許可准入。",
          "ja": "特定のプールが許可されたアクセスを使用しているかどうかを特定します。",
          "ko": "특정 풀이 허가된 액세스를 사용하는지 식별합니다.",
          "tr": "Belirli bir havuzun izinli erişim kullanıp kullanmadığını belirleyin.",
          "ar": "تحديد ما إذا كان التجمع المحدد يستخدم الوصول المصرح به.",
          "es": "Identifique si el grupo específico utiliza acceso autorizado.",
          "pt-BR": "Identifique se o pool específico usa acesso permitido.",
          "fr": "Identifiez si le pool spécifique utilise un accès autorisé.",
          "de": "Identifizieren Sie, ob der spezifische Pool einen berechtigten Zugriff verwendet.",
          "ru": "Определите, использует ли конкретный пул разрешенный доступ.",
          "id": "Identifikasi apakah pool tertentu menggunakan akses berizin.",
          "vi": "Xác định xem nhóm cụ thể có sử dụng quyền truy cập được phép hay không.",
          "it": "Identificare se il pool specifico utilizza l'accesso autorizzato.",
          // l10n: needs native review
          "ur": "شناخت کریں کہ مخصوص پول اجازت یافتہ رسائی استعمال کرتا ہے یا نہیں۔",
          // l10n: needs native review
          "uk": "Визначте, чи конкретний пул використовує доступ за дозволом."
        },
        {
          "en": "Check the issuer's wallet eligibility separately for swapping and liquidity provision.",
          "zh-Hans": "分别核对发行方对交易和提供流动性的钱包资格要求。",
          "zh-Hant": "分別核對發行方對交易和提供流動性的錢包資格要求。",
          "ja": "スワッピングと流動性の提供については、発行者のウォレットの適格性を個別に確認してください。",
          "ko": "스왑 및 유동성 제공을 위해서는 발행자의 지갑 적격성을 별도로 확인하세요.",
          "tr": "Takas ve likidite sağlama için ihraççının cüzdan uygunluğunu ayrı ayrı kontrol edin.",
          "ar": "تحقق من أهلية محفظة جهة الإصدار بشكل منفصل للمبادلة وتوفير السيولة.",
          "es": "Verifique la elegibilidad de la billetera del emisor por separado para el intercambio y la provisión de liquidez.",
          "pt-BR": "Verifique separadamente a elegibilidade da carteira do emissor para swap e provisão de liquidez.",
          "fr": "Vérifiez séparément l'éligibilité du portefeuille de l'émetteur pour l'échange et l'apport de liquidités.",
          "de": "Prüfen Sie die Wallet-Berechtigung des Emittenten separat für Swap und Liquiditätsbereitstellung.",
          "ru": "Отдельно проверьте соответствие кошелька эмитента требованиям свопа и предоставления ликвидности.",
          "id": "Periksa kelayakan dompet penerbit secara terpisah untuk pertukaran dan penyediaan likuiditas.",
          "vi": "Kiểm tra riêng tính đủ điều kiện của ví của nhà phát hành đối với việc cung cấp hoán đổi và thanh khoản.",
          "it": "Controlla separatamente l'idoneità del portafoglio dell'emittente per lo swap e la fornitura di liquidità.",
          // l10n: needs native review
          "ur": "سواپنگ اور لیکویڈیٹی فراہمی کے لیے جاری کنندہ کی والیٹ اہلیت الگ الگ چیک کریں۔",
          // l10n: needs native review
          "uk": "Окремо перевірте придатність гаманця емітент для обмін і надання ліквідності."
        },
        {
          "en": "Review issuer controls and the risk that permission can be paused or withdrawn.",
          "zh-Hans": "查看发行方控制权限，以及许可可能暂停或撤回的风险。",
          "zh-Hant": "查看發行方控制權限，以及許可可能暫停或撤回的風險。",
          "ja": "発行者の管理と、許可が一時停止または取り消される可能性があるリスクを確認します。",
          "ko": "발급기관 제어 및 권한이 일시 중지되거나 철회될 수 있는 위험을 검토하세요.",
          "tr": "Veren kuruluş kontrollerini ve iznin duraklatılması veya geri çekilmesi riskini gözden geçirin.",
          "ar": "قم بمراجعة ضوابط جهة الإصدار ومخاطر إمكانية إيقاف الإذن مؤقتًا أو سحبه.",
          "es": "Revise los controles del emisor y el riesgo de que el permiso pueda suspenderse o retirarse.",
          "pt-BR": "Revise os controles do emissor e o risco de a permissão ser pausada ou retirada.",
          "fr": "Examinez les contrôles des émetteurs et le risque que l’autorisation puisse être suspendue ou retirée.",
          "de": "Überprüfen Sie die Kontrollen des Ausstellers und das Risiko, dass die Genehmigung ausgesetzt oder entzogen werden kann.",
          "ru": "Проверьте меры контроля эмитента и риск того, что разрешение может быть приостановлено или отозвано.",
          "id": "Tinjau kontrol penerbit dan risiko bahwa izin dapat dijeda atau dicabut.",
          "vi": "Xem xét các biện pháp kiểm soát của nhà phát hành và nguy cơ quyền có thể bị tạm dừng hoặc thu hồi.",
          "it": "Esamina i controlli dell'emittente e il rischio che l'autorizzazione possa essere sospesa o revocata.",
          // l10n: needs native review
          "ur": "جاری کنندہ کنٹرولز اور یہ خطرہ دیکھیں کہ اجازت روکی یا واپس لی ہو سکتی ہے۔",
          // l10n: needs native review
          "uk": "Перегляньте контролі емітента і ризик, що дозвіл може бути призупинено або відкликано."
        }
      ]
    },
    "sources": {
      "uniswap-v4-permissioned": {
        "summary": {
          "en": "Official product article dated 24 August 2026. Permissioned-pool features do not describe every Uniswap pool.",
          "zh-Hans": "官方产品文章日期为 2026 年 8 月 24 日，许可型池的特征不代表所有 Uniswap 池。",
          "zh-Hant": "官方產品文章日期為 2026 年 8 月 24 日，許可型池的特徵不代表所有 Uniswap 池。",
          "ja": "2026 年 8 月 24 日付の公式製品記事。許可プールの機能は、すべての Uniswap プールについて説明しているわけではありません。",
          "ko": "2026년 8월 24일자 공식 제품 기사. 허가형 풀 기능이 모든 Uniswap 풀을 설명하지는 않습니다.",
          "tr": "24 Ağustos 2026 tarihli resmi ürün makalesi. İzin verilen havuz özellikleri her Uniswap havuzunu açıklamaz.",
          "ar": "مقالة المنتج الرسمية بتاريخ 24 أغسطس 2026. لا تصف ميزات التجمع المسموح به كل تجمع Uniswap.",
          "es": "Artículo oficial del producto con fecha del 24 de agosto de 2026. Las características de los grupos autorizados no describen todos los grupos de Uniswap.",
          "pt-BR": "Artigo oficial do produto datado de 24 de agosto de 2026. Os recursos do pool permitido não descrevem todos os pools Uniswap.",
          "fr": "Article officiel du produit daté du 24 août 2026. Les fonctionnalités des pools autorisés ne décrivent pas tous les pools Uniswap.",
          "de": "Offizieller Produktartikel vom 24. August 2026. Permissioned-Pool-Funktionen beschreiben nicht jeden Uniswap-Pool.",
          "ru": "Официальная статья о продукте от 24 августа 2026 г. Функции разрешенного пула описывают не каждый пул Uniswap.",
          "id": "Artikel produk resmi tertanggal 24 Agustus 2026. Fitur pool berizin tidak mencakup semua pool Uniswap.",
          "vi": "Bài viết chính thức về sản phẩm ngày 24 tháng 8 năm 2026. Các tính năng của nhóm được cấp phép không mô tả mọi nhóm Uniswap.",
          "it": "Articolo ufficiale del prodotto datato 24 agosto 2026. Le funzionalità dei pool autorizzati non descrivono tutti i pool Uniswap.",
          // l10n: needs native review
          "ur": "سرکاری مصنوعات مضمون کی تاریخ 24 اگست 2026 ہے۔ اجازت یافتہ پول خصوصیات ہر Uniswap پول کو بیان نہیں کرتے۔",
          // l10n: needs native review
          "uk": "Офіційна продуктова стаття датована 24 серпня 2026 року. функції з дозволом пул не описують кожен Uniswap пул."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "Check the issuer's wallet eligibility separately for swapping and liquidity provision.",
        "zh-Hans": "分别核对发行方对交易和提供流动性的钱包资格要求。",
        "zh-Hant": "分別核對發行方對交易和提供流動性的錢包資格要求。",
        "ja": "スワッピングと流動性の提供については、発行者のウォレットの適格性を個別に確認してください。",
        "ko": "스왑 및 유동성 제공을 위해서는 발행자의 지갑 적격성을 별도로 확인하세요.",
        "tr": "Takas ve likidite sağlama için ihraççının cüzdan uygunluğunu ayrı ayrı kontrol edin.",
        "ar": "تحقق من أهلية محفظة جهة الإصدار بشكل منفصل للمبادلة وتوفير السيولة.",
        "es": "Verifique la elegibilidad de la billetera del emisor por separado para el intercambio y la provisión de liquidez.",
        "pt-BR": "Verifique separadamente a elegibilidade da carteira do emissor para swap e provisão de liquidez.",
        "fr": "Vérifiez séparément l'éligibilité du portefeuille de l'émetteur pour l'échange et l'apport de liquidités.",
        "de": "Prüfen Sie die Wallet-Berechtigung des Emittenten separat für Swap und Liquiditätsbereitstellung.",
        "ru": "Отдельно проверьте соответствие кошелька эмитента требованиям свопа и предоставления ликвидности.",
        "id": "Periksa kelayakan dompet penerbit secara terpisah untuk pertukaran dan penyediaan likuiditas.",
        "vi": "Kiểm tra riêng tính đủ điều kiện của ví của nhà phát hành đối với việc cung cấp hoán đổi và thanh khoản.",
        "it": "Controlla separatamente l'idoneità del portafoglio dell'emittente per lo swap e la fornitura di liquidità.",
        // l10n: needs native review
        "ur": "سواپنگ اور لیکویڈیٹی فراہمی کے لیے جاری کنندہ کی والیٹ اہلیت الگ سے چیک کریں۔",
        // l10n: needs native review
        "uk": "Перевірте придатність гаманця емітента окремо для свопу і надання ліквідності."
      },
      "trading": {
        "en": "Identify whether the specific pool uses permissioned access.",
        "zh-Hans": "先识别目标池是否采用许可准入。",
        "zh-Hant": "先識別目標池是否採用許可准入。",
        "ja": "特定のプールが許可されたアクセスを使用しているかどうかを特定します。",
        "ko": "특정 풀이 허가된 액세스를 사용하는지 식별합니다.",
        "tr": "Belirli bir havuzun izinli erişim kullanıp kullanmadığını belirleyin.",
        "ar": "تحديد ما إذا كان التجمع المحدد يستخدم الوصول المصرح به.",
        "es": "Identifique si el grupo específico utiliza acceso autorizado.",
        "pt-BR": "Identifique se o pool específico usa acesso permitido.",
        "fr": "Identifiez si le pool spécifique utilise un accès autorisé.",
        "de": "Identifizieren Sie, ob der spezifische Pool einen berechtigten Zugriff verwendet.",
        "ru": "Определите, использует ли конкретный пул разрешенный доступ.",
        "id": "Identifikasi apakah pool tertentu menggunakan akses berizin.",
        "vi": "Xác định xem nhóm cụ thể có sử dụng quyền truy cập được phép hay không.",
        "it": "Identificare se il pool specifico utilizza l'accesso autorizzato.",
        // l10n: needs native review
        "ur": "شناخت کریں کہ مخصوص پول اجازت یافتہ رسائی استعمال کرتا ہے یا نہیں۔",
        // l10n: needs native review
        "uk": "Визначте, чи конкретний пул використовує з дозволами доступ."
      },
      "rewardType": {
        "en": "Pool-access product rules; no signup reward established",
        "zh-Hans": "池准入产品规则，未证明注册奖励",
        "zh-Hant": "池准入產品規則，未證明註冊獎勵",
        "ja": "プールアクセス製品ルール。サインアップ報酬が設定されていません",
        "ko": "풀 액세스 제품 규칙 가입 보상이 설정되지 않았습니다.",
        "tr": "Havuz erişimi ürün kuralları; kayıt ödülü belirlenmedi",
        "ar": "قواعد المنتج الخاصة بالوصول إلى حمام السباحة؛ لم يتم تحديد مكافأة الاشتراك",
        "es": "Reglas de productos de acceso a la piscina; no se ha establecido ninguna recompensa de registro",
        "pt-BR": "Regras de produtos de acesso ao pool; nenhuma recompensa de inscrição estabelecida",
        "fr": "Règles relatives aux produits d'accès au pool ; aucune récompense d'inscription établie",
        "de": "Produktregeln für den Zugang zum Pool; Es wurde keine Anmeldeprämie festgelegt",
        "ru": "Правила продукта для доступа к пулу; вознаграждение за регистрацию не установлено",
        "id": "Aturan produk akses kolam renang; tidak ada hadiah pendaftaran yang ditetapkan",
        "vi": "Quy tắc sản phẩm truy cập vào nhóm; không có phần thưởng đăng ký nào được thiết lập",
        "it": "Regole del prodotto per l'accesso alla piscina; nessuna ricompensa di iscrizione stabilita",
        // l10n: needs native review
        "ur": "پول رسائی پروڈکٹ قواعد؛ کوئی سائن اپ انعام قائم نہیں",
        // l10n: needs native review
        "uk": "Правила продукту доступу до пулу продукт правила; реєстрація винагорода не встановлено"
      },
      "limitations": {
        "en": "Review issuer controls and the risk that permission can be paused or withdrawn.",
        "zh-Hans": "查看发行方控制权限，以及许可可能暂停或撤回的风险。",
        "zh-Hant": "查看發行方控制權限，以及許可可能暫停或撤回的風險。",
        "ja": "発行者の管理と、許可が一時停止または取り消される可能性があるリスクを確認します。",
        "ko": "발급기관 제어 및 권한이 일시 중지되거나 철회될 수 있는 위험을 검토하세요.",
        "tr": "Veren kuruluş kontrollerini ve iznin duraklatılması veya geri çekilmesi riskini gözden geçirin.",
        "ar": "قم بمراجعة ضوابط جهة الإصدار ومخاطر إمكانية إيقاف الإذن مؤقتًا أو سحبه.",
        "es": "Revise los controles del emisor y el riesgo de que el permiso pueda suspenderse o retirarse.",
        "pt-BR": "Revise os controles do emissor e o risco de a permissão ser pausada ou retirada.",
        "fr": "Examinez les contrôles des émetteurs et le risque que l’autorisation puisse être suspendue ou retirée.",
        "de": "Überprüfen Sie die Kontrollen des Ausstellers und das Risiko, dass die Genehmigung ausgesetzt oder entzogen werden kann.",
        "ru": "Проверьте меры контроля эмитента и риск того, что разрешение может быть приостановлено или отозвано.",
        "id": "Tinjau kontrol penerbit dan risiko bahwa izin dapat dijeda atau dicabut.",
        "vi": "Xem xét các biện pháp kiểm soát của nhà phát hành và nguy cơ quyền có thể bị tạm dừng hoặc thu hồi.",
        "it": "Esamina i controlli dell'emittente e il rischio che l'autorizzazione possa essere sospesa o revocata.",
        // l10n: needs native review
        "ur": "جاری کنندہ کنٹرولز اور یہ خطرہ دیکھیں کہ اجازت روکی یا واپس لی ہو سکتی ہے۔",
        // l10n: needs native review
        "uk": "Перегляньте емітента контролі і ризик того, що дозвіл може бути призупинено або відкликано."
      },
      "publishedDate": {
        "en": "2026-08-24",
        "zh-Hans": "2026-08-24",
        "zh-Hant": "2026-08-24",
        "ja": "2026-08-24",
        "ko": "2026-08-24",
        "tr": "2026-08-24",
        "ar": "2026-08-24",
        "es": "2026-08-24",
        "pt-BR": "24/08/2026",
        "fr": "2026-08-24",
        "de": "24.08.2026",
        "ru": "2026-08-24",
        "id": "24-08-2026",
        "vi": "24-08-2026",
        "it": "2026-08-24",
        // l10n: needs native review
        "ur": "2026-08-24",
        // l10n: needs native review
        "uk": "2026-08-24"
      },
      "datePrecision": {
        "en": "Source date retained as displayed; no missing timezone is inferred.",
        "zh-Hans": "保留来源显示日期，不推断缺失时区。",
        "zh-Hant": "保留來源顯示日期，不推斷缺失時區。",
        "ja": "ソースの日付は表示どおりに保持されます。欠落しているタイムゾーンは推論されません。",
        "ko": "소스 날짜는 표시된 대로 유지됩니다. 누락된 시간대는 유추되지 않습니다.",
        "tr": "Kaynak tarihi görüntülendiği şekilde tutuldu; eksik bir saat diliminin olmadığı anlaşılmaktadır.",
        "ar": "تم الاحتفاظ بتاريخ المصدر كما هو معروض؛ لا يتم استنتاج أي منطقة زمنية مفقودة.",
        "es": "La fecha de origen se conserva tal como se muestra; no se infiere ninguna zona horaria faltante.",
        "pt-BR": "Data de origem mantida conforme exibida; nenhum fuso horário ausente é inferido.",
        "fr": "Date source conservée telle qu'affichée ; aucun fuseau horaire manquant n’est déduit.",
        "de": "Quelldatum wie angezeigt beibehalten; Es wird keine fehlende Zeitzone abgeleitet.",
        "ru": "Исходная дата сохраняется в том виде, в каком она отображается; отсутствие отсутствующего часового пояса не предполагается.",
        "id": "Tanggal sumber dipertahankan seperti yang ditampilkan; tidak ada zona waktu yang hilang yang disimpulkan.",
        "vi": "Ngày nguồn được giữ lại như được hiển thị; không có múi giờ bị thiếu được suy ra.",
        "it": "Data di origine mantenuta come visualizzata; non si deduce alcun fuso orario mancante.",
        // l10n: needs native review
        "ur": "ماخذ تاریخ جیسے دکھائی گئی ویسے رکھی گئی؛ غائب وقت زون اخذ نہیں کیا گیا۔",
        // l10n: needs native review
        "uk": "Дату джерела збережено так, як показано; відсутній часовий пояс не виводиться."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/ریجن اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Для цієї конкретної пропозиції не встановлено повний список придатності країн/регіонів."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ماخذ قابل اطلاق شناختی تصدیق کا تقاضا قائم نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; порожнє значення не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        }
      ]
    }
  },
  "pancakeswap": {
    "summary": {
      "en": "The reviewed PancakeSwap event is a wallet trading competition with random winners, not a guaranteed account-opening reward.",
      "zh-Hans": "本次读到的 PancakeSwap 活动是钱包交易竞赛，采用抽奖，不是保证领取的开户奖励。",
      "zh-Hant": "本次讀到的 PancakeSwap 活動是錢包交易競賽，採用抽獎，不是保證領取的開戶獎勵。",
      "ja": "レビューした PancakeSwap イベントは、ランダムな勝者によるウォレット取引コンテストであり、口座開設報酬が保証されるものではありません。",
      "ko": "검토된 PancakeSwap 이벤트는 계좌 개설 보상이 보장되는 것이 아니라 무작위 우승자가 참여하는 지갑 거래 대회입니다.",
      "tr": "İncelenen PancakeSwap etkinliği, garantili bir hesap açma ödülü değil, rastgele kazananların olduğu bir cüzdan ticaret yarışmasıdır.",
      "ar": "إن حدث PancakeSwap الذي تمت مراجعته هو عبارة عن مسابقة تداول للمحفظة مع فائزين عشوائيين، وليس مكافأة مضمونة لفتح الحساب.",
      "es": "El evento PancakeSwap analizado es una competencia de comercio de billeteras con ganadores aleatorios, no una recompensa garantizada por abrir una cuenta.",
      "pt-BR": "O evento PancakeSwap analisado é uma competição de negociação de carteira com vencedores aleatórios, não uma recompensa garantida de abertura de conta.",
      "fr": "L'événement PancakeSwap examiné est un concours de trading de portefeuille avec des gagnants aléatoires, et non une récompense garantie pour l'ouverture de compte.",
      "de": "Bei der besprochenen PancakeSwap-Veranstaltung handelt es sich um einen Wallet-Handelswettbewerb mit zufälligen Gewinnern und nicht um eine garantierte Belohnung für die Kontoeröffnung.",
      "ru": "Рассматриваемое событие PancakeSwap — это соревнование по торговле кошельками со случайными победителями, а не гарантированное вознаграждение за открытие счета.",
      "id": "Acara PancakeSwap yang diulas adalah kompetisi perdagangan dompet dengan pemenang acak, bukan jaminan hadiah pembukaan akun.",
      "vi": "Sự kiện PancakeSwap được đánh giá là một cuộc thi giao dịch ví với những người chiến thắng ngẫu nhiên, không phải là phần thưởng mở tài khoản được đảm bảo.",
      "it": "L'evento PancakeSwap recensito è una competizione di trading di portafogli con vincitori casuali, non un premio garantito per l'apertura di un conto.",
      // l10n: needs native review
      "ur": "جائزہ شدہ PancakeSwap ایونٹ والیٹ ٹریڈنگ مقابلہ ہے جس میں بےترتیب فاتحین ہیں، ضمانت شدہ اکاؤنٹ-کھولنے کا انعام نہیں۔",
      // l10n: needs native review
      "uk": "Перевірена подія PancakeSwap є гаманець торгівля змагання з випадковий переможці, а не гарантований акаунт-відкриття винагорода."
    },
    "signupReward": {
      "summary": {
        "en": "The TMX competition has a stated pool of 833,333 TMX and ends 9 September at noon SGT. The pool is not a per-person prize, and unresolved TBD wording remains in the rules.",
        "zh-Hans": "TMX 竞赛标示总奖池 833,333 TMX，于 9 月 9 日新加坡时间中午截止。总奖池不是人均奖额，且规则仍有未填妥的 TBD 文案。",
        "zh-Hant": "TMX 競賽標示總獎池 833,333 TMX，於 9 月 9 日新加坡時間中午截止。總獎池不是人均獎額，且規則仍有未填妥的 TBD 文案。",
        "ja": "TMX コンテストには 833,333 TMX の規定プールがあり、9 月 9 日正午 (SGT) に終了します。このプールは 1 人あたりの賞品ではなく、ルールには未解決の未定の文言が残っています。",
        "ko": "TMX 대회에는 833,333 TMX의 풀이 명시되어 있으며 9월 9일 정오(SGT)에 종료됩니다. 수영장은 1인당 상금이 아니며, 해결되지 않은 미정 문구가 규칙에 남아 있습니다.",
        "tr": "TMX yarışmasının belirtilen 833.333 TMX havuzu var ve 9 Eylül öğlen SGT'de sona erecek. Havuz kişi başı bir ödül değildir ve çözülmemiş TBD ibaresi kurallarda kalır.",
        "ar": "تضم مسابقة TMX مجموعًا محددًا يبلغ 833,333 TMX وتنتهي في 9 سبتمبر عند الظهر بتوقيت سنغافورة. المجموعة ليست جائزة لكل شخص، وتبقى صياغة TBD التي لم يتم حلها في القواعد.",
        "es": "La competencia TMX tiene un grupo declarado de 833,333 TMX y finaliza el 9 de septiembre al mediodía SGT. El premio acumulado no es un premio por persona y la redacción por determinar aún no está resuelta en las reglas.",
        "pt-BR": "A competição TMX tem um pool declarado de 833.333 TMX e termina em 9 de setembro ao meio-dia SGT. O prêmio não é um prêmio por pessoa e o texto não resolvido do TBD permanece nas regras.",
        "fr": "Le concours TMX compte un pool déclaré de 833 333 TMX et se termine le 9 septembre à midi SGT. La cagnotte n'est pas un prix par personne, et le libellé non résolu à déterminer reste dans les règles.",
        "de": "Der TMX-Wettbewerb hat einen angegebenen Pool von 833.333 TMX und endet am 9. September um 12:00 Uhr SGT. Bei dem Pool handelt es sich nicht um einen Preis pro Person, und ungeklärte Formulierungen bleiben in den Regeln enthalten.",
        "ru": "Заявленный пул соревнований TMX составляет 833 333 TMX, и они завершатся 9 сентября в полдень по сингапурскому времени. Пул не является призом для каждого человека, и неразрешенная формулировка TBD остается в правилах.",
        "id": "Kompetisi TMX mempunyai jumlah 833,333 TMX dan berakhir pada 9 September siang SGT. Kumpulan ini bukan hadiah per orang, dan kata-kata TBD yang belum terselesaikan tetap ada dalam aturan.",
        "vi": "Cuộc thi TMX có tổng số tiền được công bố là 833.333 TMX và kết thúc vào trưa ngày 9 tháng 9 theo giờ SGT. Tổng giải thưởng không phải là giải thưởng dành cho mỗi người và cách diễn đạt TBD chưa được giải quyết vẫn nằm trong quy tắc.",
        "it": "La competizione TMX ha un pool dichiarato di 833.333 TMX e termina il 9 settembre a mezzogiorno SGT. Il montepremi non è un premio per persona e la formulazione da definire irrisolta rimane nelle regole.",
        // l10n: needs native review
        "ur": "TMX مقابلے کا اعلان کردہ پول 833,333 TMX ہے اور یہ 9 ستمبر کو دوپہر SGT پر ختم ہوتا ہے۔ یہ پول فی فرد انعام نہیں، اور قواعد میں غیر حل شدہ TBD عبارت باقی ہے۔",
        // l10n: needs native review
        "uk": "Конкурс TMX має заявлений пул 833,333 TMX і завершується 9 вересня опівдні SGT. Пул не є призом на одну особу, а в правилах лишається невирішене формулювання TBD."
      },
      "conditions": [
        {
          "en": "The entry tier requires at least $500 of eligible TMX volume on BNB Chain through PancakeSwap web or mobile.",
          "zh-Hans": "入门档要求通过 PancakeSwap 网页或移动端，在 BNB Chain 完成至少 $500 的合资格 TMX 交易量。",
          "zh-Hant": "入門檔要求透過 PancakeSwap 網頁或行動端，在 BNB Chain 完成至少 $500 的合資格 TMX 交易量。",
          "ja": "エントリー層には、PancakeSwap ウェブまたはモバイルを介した BNB チェーン上の対象となる TMX ボリュームが少なくとも 500 ドル必要です。",
          "ko": "진입 단계에는 PancakeSwap 웹 또는 모바일을 통해 BNB 체인에 최소 $500의 적격 TMX 볼륨이 필요합니다.",
          "tr": "Giriş seviyesi, PancakeSwap web veya mobil aracılığıyla BNB Chain'de en az 500 ABD doları tutarında uygun TMX hacmi gerektirir.",
          "ar": "تتطلب فئة الدخول ما لا يقل عن 500 دولار من حجم تداول TMX المؤهل على BNB Chain عبر موقع PancakeSwap أو تطبيق الهاتف المحمول.",
          "es": "El nivel de entrada requiere al menos $500 de volumen TMX elegible en BNB Chain a través de PancakeSwap web o móvil.",
          "pt-BR": "O nível de entrada requer pelo menos US$ 500 de volume TMX elegível na Rede BNB por meio do PancakeSwap web ou celular.",
          "fr": "Le niveau d'entrée nécessite au moins 500 $ de volume TMX éligible sur BNB Chain via PancakeSwap Web ou mobile.",
          "de": "Für die Einstiegsstufe ist ein berechtigtes TMX-Volumen von mindestens 500 US-Dollar auf der BNB-Kette über das PancakeSwap-Web oder Mobilgerät erforderlich.",
          "ru": "Для начального уровня требуется не менее 500 долларов США соответствующего объема TMX в сети BNB через веб-сайт PancakeSwap или мобильный телефон.",
          "id": "Tingkat entri memerlukan setidaknya $500 volume TMX yang memenuhi syarat di BNB Chain melalui web atau seluler PancakeSwap.",
          "vi": "Cấp đầu vào yêu cầu ít nhất 500 USD khối lượng TMX đủ điều kiện trên Chuỗi BNB thông qua trang web hoặc thiết bị di động PancakeSwap.",
          "it": "Il livello di ingresso richiede almeno $500 di volume TMX idoneo su BNB Chain tramite PancakeSwap web o mobile.",
          // l10n: needs native review
          "ur": "ابتدائی درجہ کے لیے PancakeSwap ویب یا موبائل کے ذریعے BNB Chain پر کم از کم $500 اہل TMX حجم چاہیے۔",
          // l10n: needs native review
          "uk": "Початковий рівень вимагає щонайменше $500 придатного обсягу TMX на BNB Chain через веб або мобільний застосунок PancakeSwap."
        },
        {
          "en": "External-aggregator volume is excluded; one wallet can win only one prize and selection is random.",
          "zh-Hans": "外部聚合器交易量不计入；每个钱包最多获得一份奖品，获奖者随机选出。",
          "zh-Hant": "外部聚合器交易量不計入；每個錢包最多獲得一份獎品，得獎者隨機選出。",
          "ja": "外部アグリゲーターのボリュームは除外されます。 1 つのウォレットで獲得できる賞品は 1 つだけで、選択はランダムです。",
          "ko": "외부 집계 볼륨은 제외됩니다. 하나의 지갑은 하나의 상품만 획득할 수 있으며 선택은 무작위입니다.",
          "tr": "Harici toplayıcı hacmi hariçtir; bir cüzdan yalnızca bir ödül kazanabilir ve seçim rastgeledir.",
          "ar": "تم استبعاد حجم المجمع الخارجي؛ يمكن لمحفظة واحدة أن تفوز بجائزة واحدة فقط ويكون الاختيار عشوائيًا.",
          "es": "Se excluye el volumen del agregador externo; una billetera puede ganar solo un premio y la selección es aleatoria.",
          "pt-BR": "O volume do agregador externo está excluído; uma carteira pode ganhar apenas um prêmio e a seleção é aleatória.",
          "fr": "Le volume de l'agrégateur externe est exclu ; un portefeuille ne peut gagner qu'un seul prix et la sélection est aléatoire.",
          "de": "Externes Aggregator-Volumen ist ausgeschlossen; Eine Brieftasche kann nur einen Preis gewinnen und die Auswahl erfolgt zufällig.",
          "ru": "Объем внешнего агрегатора исключен; один кошелек может выиграть только один приз, выбор которого является случайным.",
          "id": "Volume agregator eksternal tidak termasuk; satu dompet hanya dapat memenangkan satu hadiah dan pemilihannya acak.",
          "vi": "Khối lượng tổng hợp bên ngoài được loại trừ; một ví chỉ có thể giành được một giải thưởng và việc lựa chọn là ngẫu nhiên.",
          "it": "Il volume dell'aggregatore esterno è escluso; un portafoglio può vincere un solo premio e la selezione è casuale.",
          // l10n: needs native review
          "ur": "بیرونی ایگریگیٹر کا حجم خارج ہے؛ ایک والیٹ صرف ایک انعام جیت سکتا ہے اور انتخاب بے ترتیب ہے۔",
          // l10n: needs native review
          "uk": "Обсяг через зовнішній агрегатор виключено; один гаманець може виграти лише один приз, а відбір є випадковим."
        },
        {
          "en": "The source retains TBD placeholders in asset-related clauses. Resolve those terms before treating the event as participation-ready.",
          "zh-Hans": "来源在资产相关条款中仍保留 TBD 占位符；这些条款澄清前，不将活动视为可直接推荐参与。",
          "zh-Hant": "來源在資產相關條款中仍保留 TBD 佔位符；這些條款澄清前，不將活動視為可直接推薦參與。",
          "ja": "ソースでは、資産関連の条項に TBD プレースホルダーが保持されます。イベントを参加可能なものとして扱う前に、これらの条件を解決してください。",
          "ko": "소스는 자산 관련 조항에 TBD 자리 표시자를 유지합니다. 이벤트를 참여할 준비가 된 것으로 처리하기 전에 해당 조건을 해결하세요.",
          "tr": "Kaynak, varlıkla ilgili maddelerde TBD yer tutucularını korur. Etkinliği katılıma hazır olarak değerlendirmeden önce bu şartları çözün.",
          "ar": "يحتفظ المصدر بالعناصر النائبة TBD في البنود المتعلقة بالأصول. قم بحل هذه الشروط قبل التعامل مع الحدث باعتباره جاهزًا للمشاركة.",
          "es": "La fuente conserva marcadores de posición por determinar en las cláusulas relacionadas con activos. Resuelva esos términos antes de considerar el evento como listo para participar.",
          "pt-BR": "A fonte mantém espaços reservados a definir em cláusulas relacionadas a ativos. Resolva esses termos antes de tratar o evento como pronto para participação.",
          "fr": "La source conserve des espaces réservés à déterminer dans les clauses liées aux actifs. Résolvez ces conditions avant de traiter l’événement comme étant prêt à participer.",
          "de": "Die Quelle behält TBD-Platzhalter in objektbezogenen Klauseln bei. Klären Sie diese Bedingungen, bevor Sie die Veranstaltung als teilnahmebereit betrachten.",
          "ru": "Источник сохраняет заполнители TBD в статьях, связанных с активами. Определите эти условия, прежде чем считать мероприятие готовым к участию.",
          "id": "Sumber tersebut mempertahankan placeholder TBD dalam klausul terkait aset. Selesaikan persyaratan tersebut sebelum menganggap acara tersebut siap untuk berpartisipasi.",
          "vi": "Nguồn giữ lại phần giữ chỗ TBD trong các điều khoản liên quan đến nội dung. Hãy giải quyết các điều khoản đó trước khi coi sự kiện là sẵn sàng để tham gia.",
          "it": "La fonte conserva i segnaposto da definire nelle clausole relative alle risorse. Risolvi tali termini prima di considerare l'evento come pronto per la partecipazione.",
          // l10n: needs native review
          "ur": "ماخذ اثاثہ سے متعلق شقوں میں TBD جگہ گیر الفاظ رکھتا ہے۔ ایونٹ کو شرکت-تیار سمجھنے سے پہلے یہ شرائط حل کریں۔",
          // l10n: needs native review
          "uk": "Джерело зберігає заповнювачі TBD у пунктах, пов’язаних з активами. Вирішіть ці умови перед тим, як вважати подію готовою до участі."
        }
      ]
    },
    "sources": {
      "pancakeswap-tmx-competition": {
        "summary": {
          "en": "Dated official contest rules, with explicit Singapore time and incomplete TBD wording. This snapshot is research, not an approved live offer.",
          "zh-Hans": "官方竞赛规则列有新加坡时区，但包含不完整 TBD 文案；此快照属于研究，不是已审核上线优惠。",
          "zh-Hant": "官方競賽規則列有新加坡時區，但包含不完整 TBD 文案；此快照屬於研究，不是已審核上線優惠。",
          "ja": "明確なシンガポール時間と不完全な未定の文言を含む日付付きの公式コンテスト規則。このスナップショットは研究用であり、承認されたライブオファーではありません。",
          "ko": "명시적인 싱가포르 시간과 불완전한 TBD 문구가 포함된 날짜가 적힌 공식 콘테스트 규칙입니다. 이 스냅샷은 연구용이며 승인된 실시간 제안이 아닙니다.",
          "tr": "Açık Singapur saatine ve eksik TBD ifadelerine sahip, tarihli resmi yarışma kuralları. Bu anlık görüntü, onaylanmış bir canlı teklif değil, araştırmadır.",
          "ar": "قواعد المسابقة الرسمية مؤرخة، مع توقيت سنغافورة الصريح وصيغة غير كاملة سيتم تحديدها لاحقًا. هذه اللقطة هي بحث وليست عرضًا مباشرًا معتمدًا.",
          "es": "Reglas oficiales del concurso fechadas, con hora explícita de Singapur y redacción por determinar incompleta. Esta instantánea es una investigación, no una oferta en vivo aprobada.",
          "pt-BR": "Regras oficiais do concurso desatualizadas, com horário explícito de Cingapura e texto incompleto a ser definido. Este instantâneo é uma pesquisa, não uma oferta ao vivo aprovada.",
          "fr": "Règlement officiel du concours daté, avec heure de Singapour explicite et formulation incomplète à déterminer. Cet instantané est une recherche et non une offre en direct approuvée.",
          "de": "Datierte offizielle Wettbewerbsregeln mit expliziter Singapur-Zeit und unvollständigem TBD-Wortlaut. Bei diesem Schnappschuss handelt es sich um eine Recherche und nicht um ein genehmigtes Live-Angebot.",
          "ru": "Официальные правила конкурса датированы, с указанием времени в Сингапуре и неполной формулировкой, которая подлежит уточнению. Этот снимок представляет собой исследование, а не одобренное живое предложение.",
          "id": "Peraturan kontes resmi bertanggal, dengan waktu Singapura yang eksplisit dan kata-kata TBD yang tidak lengkap. Cuplikan ini adalah penelitian, bukan penawaran langsung yang disetujui.",
          "vi": "Thể lệ cuộc thi chính thức có ghi ngày tháng, với thời gian rõ ràng ở Singapore và cách diễn đạt TBD không đầy đủ. Ảnh chụp nhanh này là nghiên cứu, không phải là ưu đãi trực tiếp đã được phê duyệt.",
          "it": "Regole ufficiali del concorso datate, con ora esplicita di Singapore e formulazione da definire incompleta. Questa istantanea è una ricerca, non un'offerta live approvata.",
          // l10n: needs native review
          "ur": "تاریخ والے سرکاری مقابلہ قواعد، واضح سنگاپور وقت اور نامکمل TBD الفاظ کے ساتھ۔ یہ اسنیپ شاٹ تحقیق ہے، منظور شدہ فعال پیشکش نہیں۔",
          // l10n: needs native review
          "uk": "Датовані офіційні правила конкурсу з явним сінгапурським часом і неповними формулюваннями TBD. Цей знімок є дослідженням, а не схваленою активною пропозицією."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "The entry tier requires at least $500 of eligible TMX volume on BNB Chain through PancakeSwap web or mobile.",
        "zh-Hans": "入门档要求通过 PancakeSwap 网页或移动端，在 BNB Chain 完成至少 $500 的合资格 TMX 交易量。",
        "zh-Hant": "入門檔要求透過 PancakeSwap 網頁或行動端，在 BNB Chain 完成至少 $500 的合資格 TMX 交易量。",
        "ja": "エントリー層には、PancakeSwap ウェブまたはモバイルを介した BNB チェーン上の対象となる TMX ボリュームが少なくとも 500 ドル必要です。",
        "ko": "진입 단계에는 PancakeSwap 웹 또는 모바일을 통해 BNB 체인에 최소 $500의 적격 TMX 볼륨이 필요합니다.",
        "tr": "Giriş seviyesi, PancakeSwap web veya mobil aracılığıyla BNB Chain'de en az 500 ABD doları tutarında uygun TMX hacmi gerektirir.",
        "ar": "تتطلب فئة الدخول ما لا يقل عن 500 دولار من حجم تداول TMX المؤهل على BNB Chain عبر موقع PancakeSwap أو تطبيق الهاتف المحمول.",
        "es": "El nivel de entrada requiere al menos $500 de volumen TMX elegible en BNB Chain a través de PancakeSwap web o móvil.",
        "pt-BR": "O nível de entrada requer pelo menos US$ 500 de volume TMX elegível na Rede BNB por meio do PancakeSwap web ou celular.",
        "fr": "Le niveau d'entrée nécessite au moins 500 $ de volume TMX éligible sur BNB Chain via PancakeSwap Web ou mobile.",
        "de": "Für die Einstiegsstufe ist ein berechtigtes TMX-Volumen von mindestens 500 US-Dollar auf der BNB-Kette über das PancakeSwap-Web oder Mobilgerät erforderlich.",
        "ru": "Для начального уровня требуется не менее 500 долларов США соответствующего объема TMX в сети BNB через веб-сайт PancakeSwap или мобильный телефон.",
        "id": "Tingkat entri memerlukan setidaknya $500 volume TMX yang memenuhi syarat di BNB Chain melalui web atau seluler PancakeSwap.",
        "vi": "Cấp đầu vào yêu cầu ít nhất 500 USD khối lượng TMX đủ điều kiện trên Chuỗi BNB thông qua trang web hoặc thiết bị di động PancakeSwap.",
        "it": "Il livello di ingresso richiede almeno $500 di volume TMX idoneo su BNB Chain tramite PancakeSwap web o mobile.",
        // l10n: needs native review
        "ur": "داخلہ درجہ کے لیے BNB Chain پر PancakeSwap ویب یا موبائل کے ذریعے کم از کم $500 اہل TMX حجم چاہیے۔",
        // l10n: needs native review
        "uk": "Вхідний рівень потребує щонайменше $500 придатного обсягу TMX на BNB Chain через веб або мобільний застосунок PancakeSwap."
      },
      "trading": {
        "en": "The entry tier requires at least $500 of eligible TMX volume on BNB Chain through PancakeSwap web or mobile.",
        "zh-Hans": "入门档要求通过 PancakeSwap 网页或移动端，在 BNB Chain 完成至少 $500 的合资格 TMX 交易量。",
        "zh-Hant": "入門檔要求透過 PancakeSwap 網頁或行動端，在 BNB Chain 完成至少 $500 的合資格 TMX 交易量。",
        "ja": "エントリー層には、PancakeSwap ウェブまたはモバイルを介した BNB チェーン上の対象となる TMX ボリュームが少なくとも 500 ドル必要です。",
        "ko": "진입 단계에는 PancakeSwap 웹 또는 모바일을 통해 BNB 체인에 최소 $500의 적격 TMX 볼륨이 필요합니다.",
        "tr": "Giriş seviyesi, PancakeSwap web veya mobil aracılığıyla BNB Chain'de en az 500 ABD doları tutarında uygun TMX hacmi gerektirir.",
        "ar": "تتطلب فئة الدخول ما لا يقل عن 500 دولار من حجم تداول TMX المؤهل على BNB Chain عبر موقع PancakeSwap أو تطبيق الهاتف المحمول.",
        "es": "El nivel de entrada requiere al menos $500 de volumen TMX elegible en BNB Chain a través de PancakeSwap web o móvil.",
        "pt-BR": "O nível de entrada requer pelo menos US$ 500 de volume TMX elegível na Rede BNB por meio do PancakeSwap web ou celular.",
        "fr": "Le niveau d'entrée nécessite au moins 500 $ de volume TMX éligible sur BNB Chain via PancakeSwap Web ou mobile.",
        "de": "Für die Einstiegsstufe ist ein berechtigtes TMX-Volumen von mindestens 500 US-Dollar auf der BNB-Kette über das PancakeSwap-Web oder Mobilgerät erforderlich.",
        "ru": "Для начального уровня требуется не менее 500 долларов США соответствующего объема TMX в сети BNB через веб-сайт PancakeSwap или мобильный телефон.",
        "id": "Tingkat entri memerlukan setidaknya $500 volume TMX yang memenuhi syarat di BNB Chain melalui web atau seluler PancakeSwap.",
        "vi": "Cấp đầu vào yêu cầu ít nhất 500 USD khối lượng TMX đủ điều kiện trên Chuỗi BNB thông qua trang web hoặc thiết bị di động PancakeSwap.",
        "it": "Il livello di ingresso richiede almeno $500 di volume TMX idoneo su BNB Chain tramite PancakeSwap web o mobile.",
        // l10n: needs native review
        "ur": "ابتدائی درجہ کے لیے PancakeSwap ویب یا موبائل کے ذریعے BNB Chain پر کم از کم $500 اہل TMX حجم چاہیے۔",
        // l10n: needs native review
        "uk": "Початковий рівень вимагає щонайменше $500 придатного обсягу TMX на BNB Chain через веб або мобільний застосунок PancakeSwap."
      },
      "rewardType": {
        "en": "Wallet trading draw; prize pool is not an individual award",
        "zh-Hans": "钱包交易抽奖，总奖池不是个人奖额",
        "zh-Hant": "錢包交易抽獎，總獎池不是個人獎額",
        "ja": "ウォレット取引の引き分け。賞金総額は個人の賞ではありません",
        "ko": "지갑 거래 추첨; 상금 풀은 개인 상이 아닙니다.",
        "tr": "Cüzdan alım satım çekilişi; Ödül havuzu bireysel bir ödül değildir",
        "ar": "سحب تداول المحفظة؛ مجموع الجوائز ليس جائزة فردية",
        "es": "Sorteo de comercio de billetera; El premio acumulado no es un premio individual.",
        "pt-BR": "Sorteio de negociação de carteira; o prêmio não é um prêmio individual",
        "fr": "Tirage au sort pour les échanges de portefeuille ; la cagnotte n'est pas une récompense individuelle",
        "de": "Verlosung für den Wallet-Handel; Der Preispool ist keine individuelle Auszeichnung",
        "ru": "Торговый розыгрыш кошелька; призовой фонд не является индивидуальной наградой",
        "id": "Penarikan perdagangan dompet; kumpulan hadiah bukanlah penghargaan individu",
        "vi": "Rút thăm giao dịch ví; tổng giải thưởng không phải là giải thưởng cá nhân",
        "it": "Estrazione del portafoglio; il montepremi non è un premio individuale",
        // l10n: needs native review
        "ur": "والیٹ ٹریڈنگ قرعہ؛ انعامی پول انفرادی انعام نہیں۔",
        // l10n: needs native review
        "uk": "Торговий розіграш гаманців; призовий пул не є індивідуальна винагорода."
      },
      "maximumConditions": {
        "en": "External-aggregator volume is excluded; one wallet can win only one prize and selection is random.",
        "zh-Hans": "外部聚合器交易量不计入；每个钱包最多获得一份奖品，获奖者随机选出。",
        "zh-Hant": "外部聚合器交易量不計入；每個錢包最多獲得一份獎品，得獎者隨機選出。",
        "ja": "外部アグリゲーターのボリュームは除外されます。 1 つのウォレットで獲得できる賞品は 1 つだけで、選択はランダムです。",
        "ko": "외부 집계 볼륨은 제외됩니다. 하나의 지갑은 하나의 상품만 획득할 수 있으며 선택은 무작위입니다.",
        "tr": "Harici toplayıcı hacmi hariçtir; bir cüzdan yalnızca bir ödül kazanabilir ve seçim rastgeledir.",
        "ar": "تم استبعاد حجم المجمع الخارجي؛ يمكن لمحفظة واحدة أن تفوز بجائزة واحدة فقط ويكون الاختيار عشوائيًا.",
        "es": "Se excluye el volumen del agregador externo; una billetera puede ganar solo un premio y la selección es aleatoria.",
        "pt-BR": "O volume do agregador externo está excluído; uma carteira pode ganhar apenas um prêmio e a seleção é aleatória.",
        "fr": "Le volume de l'agrégateur externe est exclu ; un portefeuille ne peut gagner qu'un seul prix et la sélection est aléatoire.",
        "de": "Externes Aggregator-Volumen ist ausgeschlossen; Eine Brieftasche kann nur einen Preis gewinnen und die Auswahl erfolgt zufällig.",
        "ru": "Объем внешнего агрегатора исключен; один кошелек может выиграть только один приз, выбор которого является случайным.",
        "id": "Volume agregator eksternal tidak termasuk; satu dompet hanya dapat memenangkan satu hadiah dan pemilihannya acak.",
        "vi": "Khối lượng tổng hợp bên ngoài được loại trừ; một ví chỉ có thể giành được một giải thưởng và việc lựa chọn là ngẫu nhiên.",
        "it": "Il volume dell'aggregatore esterno è escluso; un portafoglio può vincere un solo premio e la selezione è casuale.",
        // l10n: needs native review
        "ur": "بیرونی ایگریگیٹر والیوم خارج ہے؛ ایک والیٹ صرف ایک انعام جیت سکتا ہے اور انتخاب بے ترتیب ہے۔",
        // l10n: needs native review
        "uk": "Обсяг зовнішнього агрегатора виключено; один гаманець може виграти лише один приз, а відбір є випадкові."
      },
      "limitations": {
        "en": "The source retains TBD placeholders in asset-related clauses. Resolve those terms before treating the event as participation-ready.",
        "zh-Hans": "来源在资产相关条款中仍保留 TBD 占位符；这些条款澄清前，不将活动视为可直接推荐参与。",
        "zh-Hant": "來源在資產相關條款中仍保留 TBD 佔位符；這些條款澄清前，不將活動視為可直接推薦參與。",
        "ja": "ソースでは、資産関連の条項に TBD プレースホルダーが保持されます。イベントを参加可能なものとして扱う前に、これらの条件を解決してください。",
        "ko": "소스는 자산 관련 조항에 TBD 자리 표시자를 유지합니다. 이벤트를 참여할 준비가 된 것으로 처리하기 전에 해당 조건을 해결하세요.",
        "tr": "Kaynak, varlıkla ilgili maddelerde TBD yer tutucularını korur. Etkinliği katılıma hazır olarak değerlendirmeden önce bu şartları çözün.",
        "ar": "يحتفظ المصدر بالعناصر النائبة TBD في البنود المتعلقة بالأصول. قم بحل هذه الشروط قبل التعامل مع الحدث باعتباره جاهزًا للمشاركة.",
        "es": "La fuente conserva marcadores de posición por determinar en las cláusulas relacionadas con activos. Resuelva esos términos antes de considerar el evento como listo para participar.",
        "pt-BR": "A fonte mantém espaços reservados a definir em cláusulas relacionadas a ativos. Resolva esses termos antes de tratar o evento como pronto para participação.",
        "fr": "La source conserve des espaces réservés à déterminer dans les clauses liées aux actifs. Résolvez ces conditions avant de traiter l’événement comme étant prêt à participer.",
        "de": "Die Quelle behält TBD-Platzhalter in objektbezogenen Klauseln bei. Klären Sie diese Bedingungen, bevor Sie die Veranstaltung als teilnahmebereit betrachten.",
        "ru": "Источник сохраняет заполнители TBD в статьях, связанных с активами. Определите эти условия, прежде чем считать мероприятие готовым к участию.",
        "id": "Sumber tersebut mempertahankan placeholder TBD dalam klausul terkait aset. Selesaikan persyaratan tersebut sebelum menganggap acara tersebut siap untuk berpartisipasi.",
        "vi": "Nguồn giữ lại phần giữ chỗ TBD trong các điều khoản liên quan đến nội dung. Hãy giải quyết các điều khoản đó trước khi coi sự kiện là sẵn sàng để tham gia.",
        "it": "La fonte conserva i segnaposto da definire nelle clausole relative alle risorse. Risolvi tali termini prima di considerare l'evento come pronto per la partecipazione.",
        // l10n: needs native review
        "ur": "ذریعہ اثاثے سے متعلق شقوں میں TBD خالی جگہیں برقرار رکھتا ہے۔ ایونٹ کو شرکت کے لیے تیار سمجھنے سے پہلے ان شرائط کو حل کریں۔",
        // l10n: needs native review
        "uk": "Джерело зберігає TBD заповнювачі у положеннях, пов’язаних з актив. Вирішіть ці умови, перш ніж вважати подію готовою до участь."
      },
      "publishedDate": {
        "en": "2026-08-26",
        "zh-Hans": "2026-08-26",
        "zh-Hant": "2026-08-26",
        "ja": "2026-08-26",
        "ko": "2026-08-26",
        "tr": "2026-08-26",
        "ar": "2026-08-26",
        "es": "2026-08-26",
        "pt-BR": "2026-08-26",
        "fr": "2026-08-26",
        "de": "26.08.2026",
        "ru": "2026-08-26",
        "id": "26-08-2026",
        "vi": "26-08-2026",
        "it": "2026-08-26",
        // l10n: needs native review
        "ur": "2026-08-26",
        // l10n: needs native review
        "uk": "2026-08-26"
      },
      "datePrecision": {
        "en": "Source date retained as displayed; no missing timezone is inferred.",
        "zh-Hans": "保留来源显示日期，不推断缺失时区。",
        "zh-Hant": "保留來源顯示日期，不推斷缺失時區。",
        "ja": "ソースの日付は表示どおりに保持されます。欠落しているタイムゾーンは推論されません。",
        "ko": "소스 날짜는 표시된 대로 유지됩니다. 누락된 시간대는 유추되지 않습니다.",
        "tr": "Kaynak tarihi görüntülendiği şekilde tutuldu; eksik bir saat diliminin olmadığı anlaşılmaktadır.",
        "ar": "تم الاحتفاظ بتاريخ المصدر كما هو معروض؛ لا يتم استنتاج أي منطقة زمنية مفقودة.",
        "es": "La fecha de origen se conserva tal como se muestra; no se infiere ninguna zona horaria faltante.",
        "pt-BR": "Data de origem mantida conforme exibida; nenhum fuso horário ausente é inferido.",
        "fr": "Date source conservée telle qu'affichée ; aucun fuseau horaire manquant n’est déduit.",
        "de": "Quelldatum wie angezeigt beibehalten; Es wird keine fehlende Zeitzone abgeleitet.",
        "ru": "Исходная дата сохраняется в том виде, в каком она отображается; отсутствие отсутствующего часового пояса не предполагается.",
        "id": "Tanggal sumber dipertahankan seperti yang ditampilkan; tidak ada zona waktu yang hilang yang disimpulkan.",
        "vi": "Ngày nguồn được giữ lại như được hiển thị; không có múi giờ bị thiếu được suy ra.",
        "it": "Data di origine mantenuta come visualizzata; non si deduce alcun fuso orario mancante.",
        // l10n: needs native review
        "ur": "ذریعہ تاریخ جوں کی توں دکھائی گئی برقرار ہے؛ غائب ٹائم زون اخذ نہیں کیا گیا۔",
        // l10n: needs native review
        "uk": "Дату джерела збережено як показано; відсутній часовий пояс не виводиться."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ذریعہ لاگو شناختی تصدیق کی شرط ثابت نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; null не означає відсутність KYC."
        },
        {
          "en": "The source retains TBD placeholders in asset-related clauses. Resolve those terms before treating the event as participation-ready.",
          "zh-Hans": "来源在资产相关条款中仍保留 TBD 占位符；这些条款澄清前，不将活动视为可直接推荐参与。",
          "zh-Hant": "來源在資產相關條款中仍保留 TBD 佔位符；這些條款澄清前，不將活動視為可直接推薦參與。",
          "ja": "ソースでは、資産関連の条項に TBD プレースホルダーが保持されます。イベントを参加可能なものとして扱う前に、これらの条件を解決してください。",
          "ko": "소스는 자산 관련 조항에 TBD 자리 표시자를 유지합니다. 이벤트를 참여할 준비가 된 것으로 처리하기 전에 해당 조건을 해결하세요.",
          "tr": "Kaynak, varlıkla ilgili maddelerde TBD yer tutucularını korur. Etkinliği katılıma hazır olarak değerlendirmeden önce bu şartları çözün.",
          "ar": "يحتفظ المصدر بالعناصر النائبة TBD في البنود المتعلقة بالأصول. قم بحل هذه الشروط قبل التعامل مع الحدث باعتباره جاهزًا للمشاركة.",
          "es": "La fuente conserva marcadores de posición por determinar en las cláusulas relacionadas con activos. Resuelva esos términos antes de considerar el evento como listo para participar.",
          "pt-BR": "A fonte mantém espaços reservados a definir em cláusulas relacionadas a ativos. Resolva esses termos antes de tratar o evento como pronto para participação.",
          "fr": "La source conserve des espaces réservés à déterminer dans les clauses liées aux actifs. Résolvez ces conditions avant de traiter l’événement comme étant prêt à participer.",
          "de": "Die Quelle behält TBD-Platzhalter in objektbezogenen Klauseln bei. Klären Sie diese Bedingungen, bevor Sie die Veranstaltung als teilnahmebereit betrachten.",
          "ru": "Источник сохраняет заполнители TBD в статьях, связанных с активами. Определите эти условия, прежде чем считать мероприятие готовым к участию.",
          "id": "Sumber tersebut mempertahankan placeholder TBD dalam klausul terkait aset. Selesaikan persyaratan tersebut sebelum menganggap acara tersebut siap untuk berpartisipasi.",
          "vi": "Nguồn giữ lại phần giữ chỗ TBD trong các điều khoản liên quan đến nội dung. Hãy giải quyết các điều khoản đó trước khi coi sự kiện là sẵn sàng để tham gia.",
          "it": "La fonte conserva i segnaposto da definire nelle clausole relative alle risorse. Risolvi tali termini prima di considerare l'evento come pronto per la partecipazione.",
          // l10n: needs native review
          "ur": "ماخذ اثاثہ سے متعلق شقوں میں TBD جگہ گیر الفاظ رکھتا ہے۔ ایونٹ کو شرکت-تیار سمجھنے سے پہلے یہ شرائط حل کریں۔",
          // l10n: needs native review
          "uk": "Джерело зберігає заповнювачі TBD у пунктах, пов’язаних з активами. Вирішіть ці умови перед тим, як вважати подію готовою до участі."
        }
      ]
    }
  },
  "jupiter": {
    "summary": {
      "en": "The official support index was reachable, but this pass did not establish current Jupiter reward or listing terms.",
      "zh-Hans": "官方支持目录可访问，但本轮未核实 Jupiter 当前奖励或上币条款。",
      "zh-Hant": "官方支援目錄可存取，但本輪未核實 Jupiter 目前獎勵或上幣條款。",
      "ja": "公式サポートインデックスには到達可能でしたが、このパスでは現在の Jupiter 報酬やリスト条件が確立されませんでした。",
      "ko": "공식 지원 지수에 도달할 수 있었지만 이 패스는 현재 Jupiter 보상 또는 목록 조건을 설정하지 않았습니다.",
      "tr": "Resmi destek endeksine ulaşılabilirdi ancak bu geçiş mevcut Jüpiter ödülünü veya listeleme şartlarını oluşturmuyordu.",
      "ar": "كان الوصول إلى فهرس الدعم الرسمي ممكناً، لكن عملية الفحص هذه لم تحدد مكافأة Jupiter الحالية أو شروط الإدراج.",
      "es": "Se podía acceder al índice de soporte oficial, pero este pase no establecía los términos actuales de cotización o recompensa de Júpiter.",
      "pt-BR": "O índice de suporte oficial foi acessível, mas esta aprovação não estabeleceu a recompensa atual de Júpiter ou os termos de listagem.",
      "fr": "L'indice de support officiel était accessible, mais cette passe n'a pas établi les conditions actuelles de récompense ou d'inscription de Jupiter.",
      "de": "Der offizielle Support-Index war erreichbar, aber dieser Pass legte keine aktuellen Jupiter-Prämien- oder Listungsbedingungen fest.",
      "ru": "Раздел официальной поддержки был доступен, но данная проверка не выявила действующих условий вознаграждений или листинга Jupiter.",
      "id": "Pusat bantuan resmi dapat diakses, namun penelusuran ini tidak menemukan reward Jupiter atau syarat listing yang aktif saat ini.",
      "vi": "Có thể truy cập trang hỗ trợ chính thức, nhưng lượt rà soát này chưa xác định được điều khoản niêm yết hoặc phần thưởng Jupiter hiện tại.",
      "it": "L'indice di supporto ufficiale era raggiungibile, ma questo passaggio non ha stabilito l'attuale ricompensa di Giove o i termini di quotazione.",
      // l10n: needs native review
      "ur": "سرکاری سپورٹ اشاریہ قابل رسائی تھا، مگر اس دور نے موجودہ Jupiter انعام یا لسٹنگ شرائط ثابت نہیں کیے۔",
      // l10n: needs native review
      "uk": "Офіційний індекс підтримки був доступний, але ця перевірка не встановила поточну винагороду Jupiter або умови лістингу."
    },
    "signupReward": {
      "summary": {
        "en": "No amount, deadline or eligibility was verified; this does not mean no program exists.",
        "zh-Hans": "未核实金额、截止时间或资格，不代表平台没有相关计划。",
        "zh-Hant": "未核實金額、截止時間或資格，不代表平台沒有相關計畫。",
        "ja": "金額、期限、資格は確認されていません。これはプログラムが存在しないという意味ではありません。",
        "ko": "금액, 기한 또는 자격이 확인되지 않았습니다. 이는 프로그램이 존재하지 않는다는 의미는 아닙니다.",
        "tr": "Hiçbir miktar, son tarih veya uygunluk doğrulanmadı; bu hiçbir programın olmadığı anlamına gelmez.",
        "ar": "لم يتم التحقق من المبلغ أو الموعد النهائي أو الأهلية؛ هذا لا يعني عدم وجود برنامج.",
        "es": "No se verificó ningún monto, fecha límite o elegibilidad; Esto no significa que no exista ningún programa.",
        "pt-BR": "Nenhum valor, prazo ou elegibilidade foi verificado; isso não significa que não exista nenhum programa.",
        "fr": "Aucun montant, délai ou éligibilité n’a été vérifié ; cela ne veut pas dire qu'aucun programme n'existe.",
        "de": "Es wurde kein Betrag, keine Frist oder Berechtigung überprüft; Dies bedeutet nicht, dass kein Programm existiert.",
        "ru": "Никакая сумма, срок или право на участие не были проверены; это не означает, что программы не существует.",
        "id": "Tidak ada jumlah, batas waktu atau kelayakan yang diverifikasi; ini tidak berarti tidak ada program.",
        "vi": "Không có số tiền, thời hạn hoặc tính đủ điều kiện nào được xác minh; điều này không có nghĩa là không có chương trình nào tồn tại.",
        "it": "Nessun importo, scadenza o ammissibilità è stato verificato; questo non significa che non esista alcun programma.",
        // l10n: needs native review
        "ur": "کوئی رقم، آخری تاریخ یا اہلیت تصدیق نہیں ہوئی؛ اس کا مطلب یہ نہیں کہ کوئی پروگرام موجود نہیں۔",
        // l10n: needs native review
        "uk": "Жодної суми, дедлайну або відповідності критеріям не перевірено; це не означає, що програма не існує."
      }
    },
    "sources": {
      "jupiter-support": {
        "summary": {
          "en": "Support-index content only; not evidence of a specific promotion.",
          "zh-Hans": "仅核实支持目录内容，不作为具体促销的证据。",
          "zh-Hant": "僅核實支援目錄內容，不作為具體促銷的證據。",
          "ja": "サポートインデックスコンテンツのみ。特定の昇進の証拠ではありません。",
          "ko": "지원 색인 콘텐츠만 해당. 특정 프로모션의 증거가 아닙니다.",
          "tr": "Yalnızca destek dizini içeriği; belirli bir promosyonun kanıtı değildir.",
          "ar": "محتوى فهرس الدعم فقط؛ ليس دليلاً على ترقية معينة.",
          "es": "Contenido del índice de soporte únicamente; no es evidencia de una promoción específica.",
          "pt-BR": "Somente conteúdo do índice de suporte; não é evidência de uma promoção específica.",
          "fr": "Contenu de l'index de support uniquement ; pas la preuve d’une promotion spécifique.",
          "de": "Nur Support-Index-Inhalte; kein Beleg für eine konkrete Beförderung.",
          "ru": "Только контент индекса поддержки; не является свидетельством конкретной акции.",
          "id": "Hanya konten indeks dukungan; bukan bukti promosi tertentu.",
          "vi": "Chỉ nội dung chỉ mục hỗ trợ; không phải là bằng chứng về một chương trình khuyến mãi cụ thể.",
          "it": "Solo contenuto dell'indice di supporto; non prova di una promozione specifica.",
          // l10n: needs native review
          "ur": "صرف سپورٹ اشاریہ مواد؛ مخصوص پروموشن کا ثبوت نہیں۔",
          // l10n: needs native review
          "uk": "Лише вміст індексу підтримки; не доказ конкретної акцію."
        }
      },
      "jupiter-updates-shell": {
        "summary": {
          "en": "The available view rendered a site shell without readable update terms.",
          "zh-Hans": "当前读取结果只有站点外壳，未取得可读动态条款。",
          "zh-Hant": "目前讀取結果只有站點外殼，未取得可讀動態條款。",
          "ja": "利用可能なビューでは、判読可能な更新条件のないサイト シェルがレンダリングされました。",
          "ko": "사용 가능한 보기는 읽을 수 있는 업데이트 용어 없이 사이트 셸을 렌더링했습니다.",
          "tr": "Kullanılabilir görünüm, okunabilir güncelleme koşulları olmayan bir site kabuğu oluşturuyordu.",
          "ar": "عرض العرض المتوفر غلاف موقع بدون شروط تحديث قابلة للقراءة.",
          "es": "La vista disponible mostraba un shell del sitio sin términos de actualización legibles.",
          "pt-BR": "A visualização disponível renderizou um shell de site sem termos de atualização legíveis.",
          "fr": "La vue disponible a rendu un shell de site sans termes de mise à jour lisibles.",
          "de": "Die verfügbare Ansicht stellte eine Site-Shell ohne lesbare Update-Bedingungen dar.",
          "ru": "Доступное представление отображало оболочку сайта без читаемых условий обновления.",
          "id": "Tampilan yang tersedia menampilkan shell situs tanpa persyaratan pembaruan yang dapat dibaca.",
          "vi": "Chế độ xem có sẵn hiển thị giao diện trang web mà không có điều khoản cập nhật có thể đọc được.",
          "it": "La vista disponibile eseguiva il rendering della shell del sito senza termini di aggiornamento leggibili.",
          // l10n: needs native review
          "ur": "دستیاب منظر نے قابل مطالعہ اپ ڈیٹ شرائط کے بغیر سائٹ شیل رینڈر کیا۔",
          // l10n: needs native review
          "uk": "Доступний вигляд відрендерив оболонку сайту без читабельних умов оновлення."
        }
      }
    },
    "evidenceRequirements": {
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/ریجن اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Для цієї конкретної пропозиції не встановлено повний список придатності країн/регіонів."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ماخذ قابل اطلاق شناختی تصدیق کا تقاضا قائم نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; порожнє значення не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "No amount, deadline or eligibility was verified; this does not mean no program exists.",
          "zh-Hans": "未核实金额、截止时间或资格，不代表平台没有相关计划。",
          "zh-Hant": "未核實金額、截止時間或資格，不代表平台沒有相關計畫。",
          "ja": "金額、期限、資格は確認されていません。これはプログラムが存在しないという意味ではありません。",
          "ko": "금액, 기한 또는 자격이 확인되지 않았습니다. 이는 프로그램이 존재하지 않는다는 의미는 아닙니다.",
          "tr": "Hiçbir miktar, son tarih veya uygunluk doğrulanmadı; bu hiçbir programın olmadığı anlamına gelmez.",
          "ar": "لم يتم التحقق من المبلغ أو الموعد النهائي أو الأهلية؛ هذا لا يعني عدم وجود برنامج.",
          "es": "No se verificó ningún monto, fecha límite o elegibilidad; Esto no significa que no exista ningún programa.",
          "pt-BR": "Nenhum valor, prazo ou elegibilidade foi verificado; isso não significa que não exista nenhum programa.",
          "fr": "Aucun montant, délai ou éligibilité n’a été vérifié ; cela ne veut pas dire qu'aucun programme n'existe.",
          "de": "Es wurde kein Betrag, keine Frist oder Berechtigung überprüft; Dies bedeutet nicht, dass kein Programm existiert.",
          "ru": "Никакая сумма, срок или право на участие не были проверены; это не означает, что программы не существует.",
          "id": "Tidak ada jumlah, batas waktu atau kelayakan yang diverifikasi; ini tidak berarti tidak ada program.",
          "vi": "Không có số tiền, thời hạn hoặc tính đủ điều kiện nào được xác minh; điều này không có nghĩa là không có chương trình nào tồn tại.",
          "it": "Nessun importo, scadenza o ammissibilità è stato verificato; questo non significa che non esista alcun programma.",
          // l10n: needs native review
          "ur": "کوئی رقم، آخری تاریخ یا اہلیت تصدیق نہیں ہوئی؛ اس کا مطلب یہ نہیں کہ کوئی پروگرام موجود نہیں۔",
          // l10n: needs native review
          "uk": "Жодної суми, кінцевого строку чи відповідності критеріям не підтверджено; це не означає, що програма не існує."
        }
      ]
    }
  },
  "raydium": {
    "summary": {
      "en": "Raydium's documentation distinguishes AMM v4, CPMM, CLMM, farms and LaunchLab; these are separate product paths.",
      "zh-Hans": "Raydium 文档分别列出 AMM v4、CPMM、CLMM、农场与 LaunchLab，应按具体产品路径判断。",
      "zh-Hant": "Raydium 文件分別列出 AMM v4、CPMM、CLMM、農場與 LaunchLab，應按具體產品路徑判斷。",
      "ja": "Raydium のドキュメントでは、AMM v4、CPMM、CLMM、ファーム、および LaunchLab を区別しています。これらは別の製品パスです。",
      "ko": "Raydium의 문서는 AMM v4, CPMM, CLMM, 팜 및 LaunchLab을 구별합니다. 이는 별도의 제품 경로입니다.",
      "tr": "Raydium'un belgeleri AMM v4, CPMM, CLMM, çiftlikler ve LaunchLab'ı birbirinden ayırıyor; bunlar ayrı ürün yollarıdır.",
      "ar": "تميز وثائق Raydium بين AMM v4 وCPMM وCLMM والمزارع وLaunchLab؛ هذه مسارات منتج منفصلة.",
      "es": "La documentación de Raydium distingue AMM v4, CPMM, CLMM, granjas y LaunchLab; Estas son rutas de productos separadas.",
      "pt-BR": "A documentação do Raydium distingue AMM v4, CPMM, CLMM, farms e LaunchLab; esses são caminhos de produtos separados.",
      "fr": "La documentation de Raydium distingue AMM v4, CPMM, CLMM, les fermes et LaunchLab ; ce sont des chemins de produits distincts.",
      "de": "In der Dokumentation von Raydium wird zwischen AMM v4, CPMM, CLMM, Farms und LaunchLab unterschieden; Dies sind separate Produktpfade.",
      "ru": "В документации Raydium различаются AMM v4, CPMM, CLMM, фермы и LaunchLab; это отдельные пути продукта.",
      "id": "Dokumentasi Raydium membedakan AMM v4, CPMM, CLMM, farms dan LaunchLab; ini adalah jalur produk yang terpisah.",
      "vi": "Tài liệu của Raydium phân biệt AMM v4, CPMM, CLMM, trang trại và LaunchLab; đây là những đường dẫn sản phẩm riêng biệt.",
      "it": "La documentazione di Raydium distingue AMM v4, CPMM, CLMM, farms e LaunchLab; si tratta di percorsi di prodotto separati.",
      // l10n: needs native review
      "ur": "Raydium کی دستاویزات AMM v4، CPMM، CLMM، فارمز اور LaunchLab میں فرق کرتی ہے؛ یہ الگ مصنوعات کے راستے ہیں۔",
      // l10n: needs native review
      "uk": "Документація Raydium розрізняє AMM v4, CPMM, CLMM, ферми і LaunchLab; це окремі продуктові маршрути."
    },
    "signupReward": {
      "summary": {
        "en": "The readable product index does not establish a current farm rate, token giveaway or new-user reward.",
        "zh-Hans": "可读产品目录不能证明当前农场收益率、代币赠送或新用户奖励。",
        "zh-Hant": "可讀產品目錄不能證明目前農場收益率、代幣贈送或新用戶獎勵。",
        "ja": "読み取り可能な製品インデックスは、現在のファームレート、トークンの特典、または新規ユーザーの報酬を確立するものではありません。",
        "ko": "읽을 수 있는 제품 지수는 현재 농가 가격, 토큰 증정 또는 신규 사용자 보상을 설정하지 않습니다.",
        "tr": "Okunabilir ürün dizini güncel bir çiftlik ücreti, jeton hediye veya yeni kullanıcı ödülü sağlamaz.",
        "ar": "لا يحدد فهرس المنتج القابل للقراءة معدل المزرعة الحالي أو هبة الرمز المميز أو مكافأة المستخدم الجديد.",
        "es": "El índice de productos legible no establece una tasa agrícola actual, un obsequio de tokens o una recompensa para nuevos usuarios.",
        "pt-BR": "O índice de produtos legível não estabelece uma taxa de farm atual, distribuição de tokens ou recompensa para novos usuários.",
        "fr": "L'index lisible des produits n'établit pas de taux agricole actuel, de cadeaux symboliques ou de récompense pour les nouveaux utilisateurs.",
        "de": "Der lesbare Produktindex legt keinen aktuellen Farmpreis, keine Token-Verlosung oder keine Belohnung für neue Benutzer fest.",
        "ru": "Читаемый индекс продукта не устанавливает текущую ставку фермы, раздачу токенов или вознаграждение для новых пользователей.",
        "id": "Indeks produk yang dapat dibaca tidak menetapkan tingkat pertanian saat ini, pemberian token, atau hadiah pengguna baru.",
        "vi": "Chỉ mục sản phẩm có thể đọc được không thiết lập tỷ lệ trang trại hiện tại, quà tặng mã thông báo hoặc phần thưởng cho người dùng mới.",
        "it": "L'indice leggibile del prodotto non stabilisce una tariffa agricola attuale, un omaggio di token o un premio per i nuovi utenti.",
        // l10n: needs native review
        "ur": "قابل مطالعہ مصنوعات اشاریہ موجودہ فارم شرح، ٹوکن گِو اوے یا نئے صارف کا انعام ثابت نہیں کرتا۔",
        // l10n: needs native review
        "uk": "Читабельний індекс продуктів не встановлює поточну ставку ферми, роздачу токенів або винагороду нового користувача."
      }
    },
    "sources": {
      "raydium-docs": {
        "summary": {
          "en": "Product-family navigation was readable; reward-specific rates and deadlines remain unknown.",
          "zh-Hans": "已读到产品分类导航，具体奖励率与期限仍未知。",
          "zh-Hant": "已讀到產品分類導覽，具體獎勵率與期限仍未知。",
          "ja": "製品ファミリーのナビゲーションは判読可能でした。報酬固有のレートと期限は不明のままです。",
          "ko": "제품군 탐색을 읽을 수 있었습니다. 보상별 요율과 기한은 아직 알려지지 않았습니다.",
          "tr": "Ürün ailesindeki gezinme okunabilir nitelikteydi; Ödüle özel oranlar ve son tarihler hala bilinmiyor.",
          "ar": "كان التنقل بين عائلة المنتجات قابلاً للقراءة؛ لا تزال الأسعار والمواعيد النهائية الخاصة بالمكافأة غير معروفة.",
          "es": "La navegación por la familia de productos era legible; Las tasas y plazos específicos de las recompensas siguen siendo desconocidos.",
          "pt-BR": "A navegação da família de produtos era legível; as taxas e prazos específicos da recompensa permanecem desconhecidos.",
          "fr": "La navigation par famille de produits était lisible ; les taux et les délais spécifiques aux récompenses restent inconnus.",
          "de": "Die Produktfamiliennavigation war lesbar; Prämienspezifische Tarife und Fristen bleiben unbekannt.",
          "ru": "Навигация по семействам продуктов была читабельной; ставки и сроки вознаграждения остаются неизвестными.",
          "id": "Navigasi rangkaian produk dapat dibaca; tingkat imbalan dan tenggat waktu tertentu masih belum diketahui.",
          "vi": "Điều hướng dòng sản phẩm có thể đọc được; tỷ lệ và thời hạn cụ thể của phần thưởng vẫn chưa được biết.",
          "it": "La navigazione per famiglia di prodotti era leggibile; le tariffe e le scadenze specifiche della ricompensa rimangono sconosciute.",
          // l10n: needs native review
          "ur": "پروڈکٹ خاندان نیویگیشن قابل مطالعہ تھا؛ انعام مخصوص شرحیں اور آخری تاریخیں نامعلوم رہتے ہیں۔",
          // l10n: needs native review
          "uk": "навігація сімейством продуктів був читабельним; ставки, специфічні для винагороди і дедлайни залишаються невідомі."
        }
      }
    },
    "evidenceRequirements": {
      "rewardType": {
        "en": "Product-specific incentives not verified",
        "zh-Hans": "具体产品激励尚未核实",
        "zh-Hant": "具體產品激勵尚未核實",
        "ja": "製品固有のインセンティブは確認されていません",
        "ko": "제품별 인센티브가 확인되지 않음",
        "tr": "Ürüne özel teşvikler doğrulanmadı",
        "ar": "لم يتم التحقق من الحوافز الخاصة بالمنتج",
        "es": "Incentivos específicos de productos no verificados",
        "pt-BR": "Incentivos específicos do produto não verificados",
        "fr": "Incitations spécifiques aux produits non vérifiées",
        "de": "Produktspezifische Anreize nicht überprüft",
        "ru": "Стимулы для конкретного продукта не проверены",
        "id": "Insentif khusus produk tidak diverifikasi",
        "vi": "Ưu đãi dành riêng cho sản phẩm chưa được xác minh",
        "it": "Incentivi specifici del prodotto non verificati",
        // l10n: needs native review
        "ur": "پروڈکٹ مخصوص مراعات تصدیق شدہ نہیں",
        // l10n: needs native review
        "uk": "Стимули для конкретних продуктів не перевірено"
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ذریعہ لاگو شناختی تصدیق کی شرط ثابت نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; null не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مہم کی کوئی قطعی مدت تصدیق شدہ نہیں ہے؛ صرف پڑھنے کے قابل صفحہ پیشکش فعال ہونے کو ثابت نہیں کر سکتا۔",
          // l10n: needs native review
          "uk": "Повне абсолютне вікно кампанії не підтверджено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The readable product index does not establish a current farm rate, token giveaway or new-user reward.",
          "zh-Hans": "可读产品目录不能证明当前农场收益率、代币赠送或新用户奖励。",
          "zh-Hant": "可讀產品目錄不能證明目前農場收益率、代幣贈送或新用戶獎勵。",
          "ja": "読み取り可能な製品インデックスは、現在のファームレート、トークンの特典、または新規ユーザーの報酬を確立するものではありません。",
          "ko": "읽을 수 있는 제품 지수는 현재 농가 가격, 토큰 증정 또는 신규 사용자 보상을 설정하지 않습니다.",
          "tr": "Okunabilir ürün dizini güncel bir çiftlik ücreti, jeton hediye veya yeni kullanıcı ödülü sağlamaz.",
          "ar": "لا يحدد فهرس المنتج القابل للقراءة معدل المزرعة الحالي أو هبة الرمز المميز أو مكافأة المستخدم الجديد.",
          "es": "El índice de productos legible no establece una tasa agrícola actual, un obsequio de tokens o una recompensa para nuevos usuarios.",
          "pt-BR": "O índice de produtos legível não estabelece uma taxa de farm atual, distribuição de tokens ou recompensa para novos usuários.",
          "fr": "L'index lisible des produits n'établit pas de taux agricole actuel, de cadeaux symboliques ou de récompense pour les nouveaux utilisateurs.",
          "de": "Der lesbare Produktindex legt keinen aktuellen Farmpreis, keine Token-Verlosung oder keine Belohnung für neue Benutzer fest.",
          "ru": "Читаемый индекс продукта не устанавливает текущую ставку фермы, раздачу токенов или вознаграждение для новых пользователей.",
          "id": "Indeks produk yang dapat dibaca tidak menetapkan tingkat pertanian saat ini, pemberian token, atau hadiah pengguna baru.",
          "vi": "Chỉ mục sản phẩm có thể đọc được không thiết lập tỷ lệ trang trại hiện tại, quà tặng mã thông báo hoặc phần thưởng cho người dùng mới.",
          "it": "L'indice leggibile del prodotto non stabilisce una tariffa agricola attuale, un omaggio di token o un premio per i nuovi utenti.",
          // l10n: needs native review
          "ur": "قابل مطالعہ پروڈکٹ اشاریہ موجودہ فارم شرح، ٹوکن تحفہ یا نیا-صارف انعام قائم نہیں کرتا۔",
          // l10n: needs native review
          "uk": "Читабельний продукт індекс не встановлює поточний фарм ставка, токен роздача або новий-користувач винагорода."
        }
      ]
    }
  },
  "aerodrome": {
    "summary": {
      "en": "The official documentation page returned no readable body in this pass. Existing platform research is not replaced with invented campaign terms.",
      "zh-Hans": "本轮官方文档页面未返回可读正文，不用虚构活动条款替代已有平台研究。",
      "zh-Hant": "本輪官方文件頁面未傳回可讀正文，不用虛構活動條款替代已有平台研究。",
      "ja": "公式ドキュメント ページでは、このパスでは読み取り可能な本文が返されませんでした。既存のプラットフォーム調査が、発明されたキャンペーン用語に置き換えられることはありません。",
      "ko": "공식 문서 페이지는 이 패스에서 읽을 수 있는 본문을 반환하지 않았습니다. 기존 플랫폼 조사는 고안된 캠페인 용어로 대체되지 않습니다.",
      "tr": "Resmi dokümantasyon sayfası bu geçişte okunabilir bir metin döndürmedi. Mevcut platform araştırmasının yerini icat edilen kampanya terimleri almıyor.",
      "ar": "لم تُرجع صفحة التوثيق الرسمية أي محتوى مقروء في عملية الفحص هذه. ولا تُستبدل أبحاث المنصة الحالية بشروط حملة مُختلقة.",
      "es": "La página de documentación oficial no arrojó ningún cuerpo legible en este pase. La investigación de plataformas existente no se reemplaza con términos de campaña inventados.",
      "pt-BR": "A página de documentação oficial não retornou nenhum corpo legível nesta passagem. A pesquisa de plataforma existente não é substituída por termos de campanha inventados.",
      "fr": "La page de documentation officielle n'a renvoyé aucun corps lisible dans cette passe. Les recherches sur les plateformes existantes ne sont pas remplacées par des termes de campagne inventés.",
      "de": "Die offizielle Dokumentationsseite hat in diesem Durchgang keinen lesbaren Text zurückgegeben. Bestehende Plattformrecherchen werden nicht durch erfundene Kampagnenbegriffe ersetzt.",
      "ru": "Официальная страница документации при этой проверке не содержала доступного для чтения содержимого. Текущие результаты анализа платформы не заменяются вымышленными условиями промоакций.",
      "id": "Halaman dokumentasi resmi tidak memuat isi yang dapat dibaca dalam penelusuran ini. Riset platform yang ada tidak digantikan dengan syarat promosi yang dibuat-buat.",
      "vi": "Trang tài liệu chính thức không trả về nội dung nào có thể đọc được trong lượt rà soát này. Nghiên cứu nền tảng hiện tại không bị thay thế bằng các điều khoản chiến dịch tự đặt ra.",
      "it": "La pagina della documentazione ufficiale non ha restituito alcun corpo leggibile in questo passaggio. La ricerca sulle piattaforme esistenti non viene sostituita con termini di campagna inventati.",
      // l10n: needs native review
      "ur": "سرکاری دستاویزات صفحے نے اس پاس میں قابل مطالعہ متن واپس نہیں کیا۔ موجودہ پلیٹ فارم تحقیق کو ایجاد شدہ مہم شرائط سے تبدیل نہیں کیا جاتا۔",
      // l10n: needs native review
      "uk": "Офіційна сторінка документації у цьому проході не повернула читабельного тексту. Наявне дослідження платформи не замінюється вигаданими умовами кампанії."
    },
    "signupReward": {
      "summary": {
        "en": "Reward amount, eligibility and dates are unknown from this attempt.",
        "zh-Hans": "本次访问未核实奖励金额、资格与日期。",
        "zh-Hant": "本次存取未核實獎勵金額、資格與日期。",
        "ja": "この試みでは、報酬額、資格、日付は不明です。",
        "ko": "이 시도에서 보상 금액, 자격 및 날짜를 알 수 없습니다.",
        "tr": "Bu girişimde ödül miktarı, uygunluk durumu ve tarihler bilinmiyor.",
        "ar": "مبلغ المكافأة والأهلية والتواريخ غير معروفة من هذه المحاولة.",
        "es": "Se desconocen el monto de la recompensa, la elegibilidad y las fechas de este intento.",
        "pt-BR": "O valor da recompensa, a elegibilidade e as datas desta tentativa são desconhecidos.",
        "fr": "Le montant de la récompense, l'éligibilité et les dates sont inconnus de cette tentative.",
        "de": "Prämienhöhe, Berechtigung und Daten sind aus diesem Versuch nicht bekannt.",
        "ru": "Сумма вознаграждения, право на участие и даты этой попытки неизвестны.",
        "id": "Jumlah hadiah, kelayakan dan tanggal tidak diketahui dari upaya ini.",
        "vi": "Số tiền thưởng, tính đủ điều kiện và ngày không xác định được từ nỗ lực này.",
        "it": "L'importo del premio, l'idoneità e le date di questo tentativo non sono noti.",
        // l10n: needs native review
        "ur": "انعام رقم، اہلیت اور تاریخیں اس کوشش سے نامعلوم ہیں۔",
        // l10n: needs native review
        "uk": "Винагорода сума, придатність і дати з цієї спроба залишаються невідомі."
      }
    },
    "sources": {
      "aerodrome-docs-unread": {
        "summary": {
          "en": "Empty readable response. Search excerpts were not promoted to verified source evidence.",
          "zh-Hans": "可读响应为空，未将搜索摘要提升为已核实来源证据。",
          "zh-Hant": "可讀回應為空，未將搜尋摘要提升為已核實來源證據。",
          "ja": "空の読み取り可能な応答。検索の抜粋は、検証済みのソース証拠に昇格されませんでした。",
          "ko": "읽을 수 있는 응답이 비어 있습니다. 검색 발췌문은 확인된 소스 증거로 승격되지 않았습니다.",
          "tr": "Boş okunabilir yanıt. Arama alıntıları doğrulanmış kaynak kanıtlarına yükseltilmedi.",
          "ar": "استجابة فارغة للقراءة. لم تتم ترقية مقتطفات البحث إلى أدلة مصدر تم التحقق منها.",
          "es": "Respuesta legible vacía. Los extractos de la búsqueda no se promocionaron como evidencia de fuentes verificadas.",
          "pt-BR": "Resposta legível vazia. Os trechos da pesquisa não foram promovidos a evidências de fontes verificadas.",
          "fr": "Réponse vide et lisible. Les extraits de recherche n’ont pas été promus comme source de preuve vérifiée.",
          "de": "Leere lesbare Antwort. Suchauszüge wurden nicht zu verifizierten Quellennachweisen hochgestuft.",
          "ru": "Пустой читаемый ответ. Выдержки из поиска не были переведены в список проверенных источников.",
          "id": "Respons kosong yang dapat dibaca. Kutipan pencarian tidak dipromosikan menjadi bukti sumber yang terverifikasi.",
          "vi": "Phản hồi trống có thể đọc được. Các đoạn trích tìm kiếm không được đưa lên bằng chứng nguồn đã được xác minh.",
          "it": "Risposta leggibile vuota. Gli estratti della ricerca non sono stati promossi a prova della fonte verificata.",
          // l10n: needs native review
          "ur": "قابل مطالعہ جواب خالی تھا۔ تلاش اقتباسات کو تصدیق شدہ ذریعہ ثبوت میں ترقی نہیں دی گئی۔",
          // l10n: needs native review
          "uk": "Читабельна відповідь був порожнім. Пошукові уривки не підвищувалися до підтверджених джерельних доказів."
        }
      }
    },
    "evidenceRequirements": {
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ماخذ قابل اطلاق شناختی تصدیق کا تقاضا قائم نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; порожнє значення не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "Reward amount, eligibility and dates are unknown from this attempt.",
          "zh-Hans": "本次访问未核实奖励金额、资格与日期。",
          "zh-Hant": "本次存取未核實獎勵金額、資格與日期。",
          "ja": "この試みでは、報酬額、資格、日付は不明です。",
          "ko": "이 시도에서 보상 금액, 자격 및 날짜를 알 수 없습니다.",
          "tr": "Bu girişimde ödül miktarı, uygunluk durumu ve tarihler bilinmiyor.",
          "ar": "مبلغ المكافأة والأهلية والتواريخ غير معروفة من هذه المحاولة.",
          "es": "Se desconocen el monto de la recompensa, la elegibilidad y las fechas de este intento.",
          "pt-BR": "O valor da recompensa, a elegibilidade e as datas desta tentativa são desconhecidos.",
          "fr": "Le montant de la récompense, l'éligibilité et les dates sont inconnus de cette tentative.",
          "de": "Prämienhöhe, Berechtigung und Daten sind aus diesem Versuch nicht bekannt.",
          "ru": "Сумма вознаграждения, право на участие и даты этой попытки неизвестны.",
          "id": "Jumlah hadiah, kelayakan dan tanggal tidak diketahui dari upaya ini.",
          "vi": "Số tiền thưởng, tính đủ điều kiện và ngày không xác định được từ nỗ lực này.",
          "it": "L'importo del premio, l'idoneità e le date di questo tentativo non sono noti.",
          // l10n: needs native review
          "ur": "انعام رقم، اہلیت اور تاریخیں اس کوشش سے نامعلوم ہیں۔",
          // l10n: needs native review
          "uk": "Сума винагороди, придатність і дати невідомі з цієї цієї спроби."
        }
      ]
    }
  },
  "curve": {
    "summary": {
      "en": "Curve's introduction separates swaps, liquidity and lending; LLAMMA's gradual collateral conversion does not eliminate liquidation risk.",
      "zh-Hans": "Curve 入门文档区分兑换、流动性与借贷；LLAMMA 的渐进抵押品转换不等于没有清算风险。",
      "zh-Hant": "Curve 入門文件區分兌換、流動性與借貸；LLAMMA 的漸進抵押品轉換不等於沒有清算風險。",
      "ja": "カーブの導入により、スワップ、流動性、融資が分離されました。 LLAMMA の段階的な担保転換は清算リスクを排除するものではありません。",
      "ko": "Curve의 도입으로 스왑, 유동성 및 대출이 분리되었습니다. LLAMMA의 점진적인 담보 전환은 청산 위험을 제거하지 않습니다.",
      "tr": "Curve'ün tanıtımı swapları, likiditeyi ve borç vermeyi birbirinden ayırıyor; LLAMMA'nın kademeli teminat dönüşümü, tasfiye riskini ortadan kaldırmaz.",
      "ar": "يفصل تقديم Curve بين المقايضة والسيولة والإقراض؛ لا يؤدي تحويل الضمانات التدريجي لشركة LLAMMA إلى القضاء على مخاطر التصفية.",
      "es": "La introducción de Curve separa los swaps, la liquidez y los préstamos; La conversión gradual de garantías de LLAMMA no elimina el riesgo de liquidación.",
      "pt-BR": "A introdução do Curve separa swaps, liquidez e empréstimos; A conversão gradual das garantias da LLAMMA não elimina o risco de liquidação.",
      "fr": "L'introduction de Curve sépare les swaps, la liquidité et les prêts ; La conversion progressive des garanties de LLAMMA n'élimine pas le risque de liquidation.",
      "de": "Die Einführung von Curve trennt Swaps, Liquidität und Kreditvergabe; Die schrittweise Umwandlung der Sicherheiten durch LLAMMA beseitigt das Liquidationsrisiko nicht.",
      "ru": "Введение Curve разделяет свопы, ликвидность и кредитование; Постепенная конвертация обеспечения LLAMMA не устраняет риск ликвидации.",
      "id": "Pengenalan Curve memisahkan swap, likuiditas dan pinjaman; Konversi agunan LLAMMA secara bertahap tidak menghilangkan risiko likuidasi.",
      "vi": "Phần giới thiệu của Curve tách biệt giữa hoán đổi, thanh khoản và cho vay; Việc chuyển đổi dần dần tài sản thế chấp của LLAMMA không loại bỏ rủi ro thanh lý.",
      "it": "L'introduzione di Curve separa swap, liquidità e prestiti; La graduale conversione delle garanzie di LLAMMA non elimina il rischio di liquidazione.",
      // l10n: needs native review
      "ur": "Curve کا تعارف سواپس، لیکویڈیٹی اور قرض فراہمی کو الگ کرتا ہے؛ LLAMMA کی تدریجی ضمانت تبدیلی لیکویڈیشن خطرہ ختم نہیں کرتی۔",
      // l10n: needs native review
      "uk": "Вступ Curve розділяє обміни, ліквідність і кредитування; поступове перетворення застави в LLAMMA не усуває ризик ліквідації."
    },
    "signupReward": {
      "summary": {
        "en": "This source explains protocol products, not an account-opening cash reward.",
        "zh-Hans": "该来源说明协议产品，不是开户现金奖励。",
        "zh-Hant": "該來源說明協議產品，不是開戶現金獎勵。",
        "ja": "この情報源は、口座開設による現金報酬ではなく、プロトコル製品について説明しています。",
        "ko": "이 소스는 계좌 개설 현금 보상이 아닌 프로토콜 제품을 설명합니다.",
        "tr": "Bu kaynak, hesap açma nakit ödülünü değil, protokol ürünlerini açıklamaktadır.",
        "ar": "يشرح هذا المصدر منتجات البروتوكول، وليس المكافأة النقدية لفتح الحساب.",
        "es": "Esta fuente explica los productos del protocolo, no una recompensa en efectivo por abrir una cuenta.",
        "pt-BR": "Esta fonte explica os produtos do protocolo, não uma recompensa em dinheiro para abertura de conta.",
        "fr": "Cette source explique les produits protocolaires, et non une récompense en espèces pour l'ouverture d'un compte.",
        "de": "Diese Quelle erläutert Protokollprodukte, keine Geldprämie für die Kontoeröffnung.",
        "ru": "Этот источник объясняет продукты протокола, а не денежное вознаграждение за открытие счета.",
        "id": "Sumber ini menjelaskan produk protokol, bukan hadiah uang tunai pembukaan rekening.",
        "vi": "Nguồn này giải thích các sản phẩm giao thức, không phải phần thưởng tiền mặt khi mở tài khoản.",
        "it": "Questa fonte spiega i prodotti del protocollo, non una ricompensa in contanti per l'apertura di un conto.",
        // l10n: needs native review
        "ur": "یہ ماخذ پروٹوکول مصنوعات سمجھاتا ہے، اکاؤنٹ کھولنے کا نقد انعام نہیں۔",
        // l10n: needs native review
        "uk": "Це джерело пояснює продукти протоколу, а не грошова винагорода за відкриття акаунта."
      },
      "conditions": [
        {
          "en": "Identify whether the intended action is swapping, supplying liquidity or borrowing.",
          "zh-Hans": "先明确目标操作是兑换、提供流动性还是借贷。",
          "zh-Hant": "先明確目標操作是兌換、提供流動性還是借貸。",
          "ja": "意図されたアクションがスワップ、流動性の供給、または借入のいずれであるかを特定します。",
          "ko": "의도한 조치가 교환인지, 유동성 공급인지, 차용인지 식별합니다.",
          "tr": "Amaçlanan eylemin takas mı, likidite sağlamak mı yoksa borçlanma mı olduğunu belirleyin.",
          "ar": "تحديد ما إذا كان الإجراء المقصود هو المبادلة أو توفير السيولة أو الاقتراض.",
          "es": "Identifique si la acción prevista es intercambiar, suministrar liquidez o pedir prestado.",
          "pt-BR": "Identifique se a ação pretendida é troca, fornecimento de liquidez ou empréstimo.",
          "fr": "Identifiez si l’action envisagée consiste en un échange, une fourniture de liquidités ou un emprunt.",
          "de": "Stellen Sie fest, ob es sich bei der beabsichtigten Maßnahme um einen Tausch, die Bereitstellung von Liquidität oder eine Kreditaufnahme handelt.",
          "ru": "Определите, является ли предполагаемое действие свопом, предоставлением ликвидности или заимствованием.",
          "id": "Identifikasi apakah tindakan yang dimaksudkan adalah swapping, penyediaan likuiditas atau peminjaman.",
          "vi": "Xác định xem hành động dự định là hoán đổi, cung cấp thanh khoản hay vay mượn.",
          "it": "Identificare se l'azione prevista è lo scambio, la fornitura di liquidità o l'assunzione di prestiti.",
          // l10n: needs native review
          "ur": "شناخت کریں کہ مطلوبہ عمل سواپنگ، لیکویڈیٹی فراہم کرنا یا قرض ہے۔",
          // l10n: needs native review
          "uk": "Визначте, чи запланована дія — обмін, надання ліквідності або запозичення."
        },
        {
          "en": "For lending, distinguish collateral conversion from an assurance against losses.",
          "zh-Hans": "使用借贷时，不把抵押品转换机制理解为损失保障。",
          "zh-Hant": "使用借貸時，不把抵押品轉換機制理解為損失保障。",
          "ja": "融資の場合、担保の転換と損失に対する保証を区別してください。",
          "ko": "대출의 경우 담보 전환과 손실 보장을 구별하십시오.",
          "tr": "Borç verme konusunda, teminat dönüşümünü kayıplara karşı güvenceden ayırın.",
          "ar": "بالنسبة للإقراض، قم بالتمييز بين تحويل الضمانات والضمان ضد الخسائر.",
          "es": "Para los préstamos, distinga la conversión de garantías de una garantía contra pérdidas.",
          "pt-BR": "Para empréstimos, distinguir a conversão de garantias de uma garantia contra perdas.",
          "fr": "Pour les prêts, faites la distinction entre la conversion des garanties et l’assurance contre les pertes.",
          "de": "Bei der Kreditvergabe ist die Umwandlung von Sicherheiten von einer Absicherung gegen Verluste zu unterscheiden.",
          "ru": "При кредитовании следует отличать конверсию залога от гарантии от убытков.",
          "id": "Untuk pemberian pinjaman, bedakan konversi agunan dengan jaminan terhadap kerugian.",
          "vi": "Đối với việc cho vay, hãy phân biệt việc chuyển đổi tài sản thế chấp với sự đảm bảo chống lại tổn thất.",
          "it": "Per i prestiti, distinguere la conversione della garanzia collaterale dalla garanzia contro le perdite.",
          // l10n: needs native review
          "ur": "قرض دینا کے لیے ضمانت کی تبدیلی کو نقصانات کے خلاف ضمانت سے الگ سمجھیں۔",
          // l10n: needs native review
          "uk": "Для кредитування відрізняйте конвертацію застави від гарантії проти збитків."
        },
        {
          "en": "Check the specific pool or lending-market terms; this introduction states no universal reward rate.",
          "zh-Hans": "核对具体池或借贷市场条款，入门文档没有给出统一奖励率。",
          "zh-Hant": "核對具體池或借貸市場條款，入門文件沒有給出統一獎勵率。",
          "ja": "特定のプールまたは融資市場条件を確認してください。この序文には、普遍的な報酬率は記載されていません。",
          "ko": "특정 풀 또는 대출 시장 조건을 확인하세요. 이 소개에는 보편적인 보상률이 없다고 명시되어 있습니다.",
          "tr": "Özel havuz veya borç verme piyasası şartlarını kontrol edin; bu giriş evrensel bir ödül oranının olmadığını belirtiyor.",
          "ar": "التحقق من شروط المجمع أو سوق الإقراض المحددة؛ تنص هذه المقدمة على عدم وجود معدل مكافأة عالمي.",
          "es": "Verifique el conjunto específico o los términos del mercado de préstamos; Esta introducción no establece una tasa de recompensa universal.",
          "pt-BR": "Verifique os termos específicos do pool ou do mercado de empréstimos; esta introdução não declara nenhuma taxa de recompensa universal.",
          "fr": "Vérifiez les conditions spécifiques du pool ou du marché des prêts ; cette introduction ne mentionne aucun taux de récompense universel.",
          "de": "Überprüfen Sie die spezifischen Pool- oder Kreditmarktbedingungen. In dieser Einführung wird kein universeller Belohnungssatz angegeben.",
          "ru": "Проверьте конкретный пул или условия кредитного рынка; во введении не указывается универсальная ставка вознаграждения.",
          "id": "Periksa persyaratan kumpulan atau pasar pinjaman tertentu; pendahuluan ini menyatakan tidak ada tingkat imbalan universal.",
          "vi": "Kiểm tra các điều khoản cụ thể của nhóm hoặc thị trường cho vay; phần giới thiệu này nêu rõ không có tỷ lệ phần thưởng chung.",
          "it": "Controllare i termini specifici del pool o del mercato dei prestiti; questa introduzione non afferma alcun tasso di ricompensa universale.",
          // l10n: needs native review
          "ur": "مخصوص پول یا قرض مارکیٹ شرائط چیک کریں؛ یہ تعارف کوئی یکساں شرح انعام نہیں بتاتا۔",
          // l10n: needs native review
          "uk": "Перевірте конкретний пул або ринок кредитування умови; цей вступ не встановлює універсальний винагорода ставка."
        }
      ]
    },
    "sources": {
      "curve-introduction": {
        "summary": {
          "en": "The documentation explicitly retains loss and full-liquidation risks for the lending mechanism.",
          "zh-Hans": "文档明确保留借贷机制中的损失与完全清算风险。",
          "zh-Hant": "文件明確保留借貸機制中的損失與完全清算風險。",
          "ja": "文書には、融資メカニズムの損失と完全清算のリスクが明示的に記載されています。",
          "ko": "문서에는 대출 메커니즘에 대한 손실 및 완전 청산 위험이 명시적으로 포함되어 있습니다.",
          "tr": "Dokümantasyon, borç verme mekanizmasına ilişkin kayıp ve tam tasfiye risklerini açıkça muhafaza etmektedir.",
          "ar": "وتحتفظ الوثائق صراحةً بمخاطر الخسارة والتصفية الكاملة لآلية الإقراض.",
          "es": "La documentación recoge explícitamente los riesgos de pérdida y liquidación total del mecanismo de préstamo.",
          "pt-BR": "A documentação retém explicitamente os riscos de perda e liquidação total para o mecanismo de empréstimo.",
          "fr": "La documentation retient explicitement les risques de perte et de liquidation totale pour le mécanisme de prêt.",
          "de": "In der Dokumentation werden ausdrücklich Verlust- und Liquidationsrisiken für den Kreditmechanismus berücksichtigt.",
          "ru": "В документации явно сохраняются риски потерь и полной ликвидации механизма кредитования.",
          "id": "Dokumentasi tersebut secara eksplisit mencatat risiko kerugian dan likuidasi penuh pada mekanisme pinjaman.",
          "vi": "Tài liệu rõ ràng giữ lại rủi ro thua lỗ và thanh lý toàn bộ cho cơ chế cho vay.",
          "it": "La documentazione conserva esplicitamente i rischi di perdita e di liquidazione totale per il meccanismo di prestito.",
          // l10n: needs native review
          "ur": "دستاویزات قرض دینے کا طریقہ کے لیے نقصان اور مکمل لیکویڈیشن خطرات واضح طور پر برقرار رکھتی ہے۔",
          // l10n: needs native review
          "uk": "Документація прямо зберігає збитки і ризики повної ліквідації для механізму кредитування."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "Identify whether the intended action is swapping, supplying liquidity or borrowing.",
        "zh-Hans": "先明确目标操作是兑换、提供流动性还是借贷。",
        "zh-Hant": "先明確目標操作是兌換、提供流動性還是借貸。",
        "ja": "意図されたアクションがスワップ、流動性の供給、または借入のいずれであるかを特定します。",
        "ko": "의도한 조치가 교환인지, 유동성 공급인지, 차용인지 식별합니다.",
        "tr": "Amaçlanan eylemin takas mı, likidite sağlamak mı yoksa borçlanma mı olduğunu belirleyin.",
        "ar": "تحديد ما إذا كان الإجراء المقصود هو المبادلة أو توفير السيولة أو الاقتراض.",
        "es": "Identifique si la acción prevista es intercambiar, suministrar liquidez o pedir prestado.",
        "pt-BR": "Identifique se a ação pretendida é troca, fornecimento de liquidez ou empréstimo.",
        "fr": "Identifiez si l’action envisagée consiste en un échange, une fourniture de liquidités ou un emprunt.",
        "de": "Stellen Sie fest, ob es sich bei der beabsichtigten Maßnahme um einen Tausch, die Bereitstellung von Liquidität oder eine Kreditaufnahme handelt.",
        "ru": "Определите, является ли предполагаемое действие свопом, предоставлением ликвидности или заимствованием.",
        "id": "Identifikasi apakah tindakan yang dimaksudkan adalah swapping, penyediaan likuiditas atau peminjaman.",
        "vi": "Xác định xem hành động dự định là hoán đổi, cung cấp thanh khoản hay vay mượn.",
        "it": "Identificare se l'azione prevista è lo scambio, la fornitura di liquidità o l'assunzione di prestiti.",
        // l10n: needs native review
        "ur": "شناخت کریں کہ مطلوبہ عمل سواپنگ، لیکویڈیٹی فراہم کرنا یا قرض لینا ہے۔",
        // l10n: needs native review
        "uk": "Визначте, чи запланована дія — свопу, надання ліквідності або запозичення."
      },
      "rewardType": {
        "en": "Protocol product guidance; no signup reward established",
        "zh-Hans": "协议产品说明，未证明注册奖励",
        "zh-Hant": "協議產品說明，未證明註冊獎勵",
        "ja": "プロトコル製品ガイダンス。サインアップ報酬が設定されていません",
        "ko": "프로토콜 제품 안내 가입 보상이 설정되지 않았습니다.",
        "tr": "Protokol ürün rehberliği; kayıt ödülü belirlenmedi",
        "ar": "توجيهات منتج البروتوكول؛ لم يتم تحديد مكافأة الاشتراك",
        "es": "Guía de productos de protocolo; no se ha establecido ninguna recompensa de registro",
        "pt-BR": "Orientação de produto de protocolo; nenhuma recompensa de inscrição estabelecida",
        "fr": "Conseils sur les produits du protocole ; aucune récompense d'inscription établie",
        "de": "Protokollproduktanleitung; Es wurde keine Anmeldeprämie festgelegt",
        "ru": "Протокол руководства по продукту; вознаграждение за регистрацию не установлено",
        "id": "Panduan produk protokol; tidak ada hadiah pendaftaran yang ditetapkan",
        "vi": "Hướng dẫn sản phẩm giao thức; không có phần thưởng đăng ký nào được thiết lập",
        "it": "Guida al prodotto del protocollo; nessuna ricompensa di iscrizione stabilita",
        // l10n: needs native review
        "ur": "پروٹوکول پروڈکٹ رہنمائی؛ کوئی سائن اپ انعام قائم نہیں",
        // l10n: needs native review
        "uk": "Протокольна продукт настанова; реєстрація винагорода не встановлено"
      },
      "limitations": {
        "en": "For lending, distinguish collateral conversion from an assurance against losses.",
        "zh-Hans": "使用借贷时，不把抵押品转换机制理解为损失保障。",
        "zh-Hant": "使用借貸時，不把抵押品轉換機制理解為損失保障。",
        "ja": "融資の場合、担保の転換と損失に対する保証を区別してください。",
        "ko": "대출의 경우 담보 전환과 손실 보장을 구별하십시오.",
        "tr": "Borç verme konusunda, teminat dönüşümünü kayıplara karşı güvenceden ayırın.",
        "ar": "بالنسبة للإقراض، قم بالتمييز بين تحويل الضمانات والضمان ضد الخسائر.",
        "es": "Para los préstamos, distinga la conversión de garantías de una garantía contra pérdidas.",
        "pt-BR": "Para empréstimos, distinguir a conversão de garantias de uma garantia contra perdas.",
        "fr": "Pour les prêts, faites la distinction entre la conversion des garanties et l’assurance contre les pertes.",
        "de": "Bei der Kreditvergabe ist die Umwandlung von Sicherheiten von einer Absicherung gegen Verluste zu unterscheiden.",
        "ru": "При кредитовании следует отличать конверсию залога от гарантии от убытков.",
        "id": "Untuk pemberian pinjaman, bedakan konversi agunan dengan jaminan terhadap kerugian.",
        "vi": "Đối với việc cho vay, hãy phân biệt việc chuyển đổi tài sản thế chấp với sự đảm bảo chống lại tổn thất.",
        "it": "Per i prestiti, distinguere la conversione della garanzia collaterale dalla garanzia contro le perdite.",
        // l10n: needs native review
        "ur": "قرض فراہمی کے لیے ضمانت تبدیلی کو نقصانات کے خلاف ضمانت سے الگ کریں۔",
        // l10n: needs native review
        "uk": "Для кредитування відрізняйте перетворення застави від запевнення від втрат."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/ریجن اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Для цієї конкретної пропозиції не встановлено повний список придатності країн/регіонів."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ذریعہ لاگو شناختی تصدیق کی شرط ثابت نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; null не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مہم کی کوئی قطعی مدت تصدیق شدہ نہیں ہے؛ صرف پڑھنے کے قابل صفحہ پیشکش فعال ہونے کو ثابت نہیں کر سکتا۔",
          // l10n: needs native review
          "uk": "Повне абсолютне вікно кампанії не підтверджено; сама читабельна сторінка не може встановити, що пропозиція активна."
        }
      ]
    }
  },
  "hyperliquid": {
    "summary": {
      "en": "Hyperliquid documents a volume-limited trading-fee discount for referred users, separate from inviter commission.",
      "zh-Hans": "Hyperliquid 文档明确了受邀用户的限成交量手续费折扣，应与邀请人佣金分开看。",
      "zh-Hant": "Hyperliquid 文件明確了受邀用戶的限成交量手續費折扣，應與邀請人佣金分開看。",
      "ja": "Hyperliquid は、招待者手数料とは別に、紹介されたユーザーに対して数量限定の取引手数料割引を文書化しています。",
      "ko": "Hyperliquid는 초대 커미션과 별도로 추천 사용자에 대한 수량 제한 거래 수수료 할인을 문서화합니다.",
      "tr": "Hyperliquid, davetli komisyonundan ayrı olarak, yönlendirilen kullanıcılar için hacimle sınırlı bir işlem ücreti indirimi belgeliyor.",
      "ar": "يقوم Hyperliquid بتوثيق خصم محدود على رسوم التداول للمستخدمين المحالين، منفصل عن عمولة الداعي.",
      "es": "Hyperliquid documenta un descuento en la tarifa comercial por volumen limitado para los usuarios recomendados, aparte de la comisión del invitado.",
      "pt-BR": "O Hyperliquid documenta um desconto na taxa de negociação com volume limitado para usuários indicados, separado da comissão do convidador.",
      "fr": "Hyperliquid documente une remise sur les frais de négociation limitée en volume pour les utilisateurs référés, distincte de la commission de l'invitant.",
      "de": "Hyperliquid bietet einen volumenbegrenzten Rabatt auf die Handelsgebühr für empfohlene Benutzer, unabhängig von der Provision des Einladenden.",
      "ru": "Hyperliquid документирует ограниченную по объему скидку на комиссию за торговлю для привлеченных пользователей, отдельно от комиссии приглашающего.",
      "id": "Hyperlikuid mendokumentasikan diskon biaya perdagangan terbatas volume untuk pengguna yang dirujuk, terpisah dari komisi pengundang.",
      "vi": "Hyperliquid ghi lại khoản chiết khấu phí giao dịch có giới hạn số lượng cho người dùng được giới thiệu, tách biệt với hoa hồng của người mời.",
      "it": "Hyperliquid documenta uno sconto sulle commissioni di negoziazione a volume limitato per gli utenti segnalati, separato dalla commissione dell'invitante.",
      // l10n: needs native review
      "ur": "Hyperliquid ریفر کیے گئے صارفین کے لیے والیوم سے محدود ٹریڈنگ فیس رعایت دستاویز کرتا ہے، مدعو کنندہ کمیشن سے الگ۔",
      // l10n: needs native review
      "uk": "Hyperliquid документує знижку на торгову комісію, обмежену обсягом для реферованих користувачів, окремо від комісії запрошувача."
    },
    "signupReward": {
      "summary": {
        "en": "The documented discount is 4% on fees for the first $25 million of volume; vaults and sub-accounts are excluded. This is not a cash signup reward.",
        "zh-Hans": "文档折扣为首 2,500 万美元成交量的手续费减免 4%，金库与子账户不适用，不是注册现金奖励。",
        "zh-Hant": "文件折扣為首 2,500 萬美元成交量的手續費減免 4%，金庫與子帳戶不適用，不是註冊現金獎勵。",
        "ja": "文書化された割引額は、最初の 2,500 万ドルのボリュームに対する手数料の 4% です。ボールトとサブアカウントは除外されます。これは現金によるサインアップ特典ではありません。",
        "ko": "문서화된 할인은 처음 2,500만 달러 규모의 수수료에 대해 4%입니다. 볼트 및 하위 계정은 제외됩니다. 이는 현금 가입 보상이 아닙니다.",
        "tr": "Belgelenen indirim, ilk 25 milyon dolarlık hacim için ücretlerde %4'tür; kasalar ve alt hesaplar hariçtir. Bu nakit kayıt ödülü değildir.",
        "ar": "الخصم الموثق هو 4% على رسوم أول 25 مليون دولار من الحجم؛ يتم استبعاد الخزائن والحسابات الفرعية. هذه ليست مكافأة الاشتراك النقدي.",
        "es": "El descuento documentado es del 4% sobre las tarifas por los primeros $25 millones de volumen; Se excluyen las bóvedas y subcuentas. Esta no es una recompensa de registro en efectivo.",
        "pt-BR": "O desconto documentado é de 4% nas taxas para os primeiros US$ 25 milhões de volume; cofres e subcontas são excluídos. Esta não é uma recompensa de inscrição em dinheiro.",
        "fr": "La remise documentée est de 4 % sur les frais pour les premiers 25 millions de dollars de volume ; les coffres-forts et les sous-comptes sont exclus. Il ne s'agit pas d'une récompense d'inscription en espèces.",
        "de": "Der dokumentierte Rabatt beträgt 4 % auf die Gebühren für die ersten 25 Millionen US-Dollar des Volumens; Tresore und Unterkonten sind ausgeschlossen. Dies ist keine Bargeld-Anmeldeprämie.",
        "ru": "Документально подтвержденная скидка составляет 4% от комиссии за первые 25 миллионов долларов США; хранилища и субсчета исключены. Это не денежное вознаграждение за регистрацию.",
        "id": "Diskon yang didokumentasikan adalah 4% untuk biaya volume $25 juta pertama; brankas dan sub-akun dikecualikan. Ini bukan hadiah pendaftaran tunai.",
        "vi": "Mức chiết khấu được ghi nhận là 4% phí cho khối lượng 25 triệu USD đầu tiên; vault và tài khoản phụ được loại trừ. Đây không phải là phần thưởng đăng ký bằng tiền mặt.",
        "it": "Lo sconto documentato è del 4% sulle commissioni per i primi 25 milioni di dollari di volume; sono esclusi caveau e sottoconti. Questo non è un premio in denaro per l'iscrizione.",
        // l10n: needs native review
        "ur": "دستاویزی رعایت پہلے $25 ملین حجم پر فیس کا 4% ہے؛ والٹس اور ذیلی اکاؤنٹس خارج ہیں۔ یہ نقد سائن اپ انعام نہیں۔",
        // l10n: needs native review
        "uk": "Задокументована знижка становить 4% на комісії для перших $25 млн обсягу; сховища і субакаунти виключені. Це не грошова винагорода за реєстрацію."
      },
      "conditions": [
        {
          "en": "A valid referral code or link must be applied. This research panel does not include referral codes; the sign-up cards on this site do.",
          "zh-Hans": "需绑定有效邀请代码或链接。本研究面板不附邀请码；本站的开户卡片会附带邀请码。",
          "zh-Hant": "需綁定有效邀請代碼或連結。本研究面板不附邀請碼；本站的開戶卡片會附帶邀請碼。",
          "ja": "有効な紹介コードまたはリンクの適用が必要です。この調査パネルには紹介コードを載せていません。サイト内の登録カードにはコードがあります。",
          "ko": "유효한 추천 코드나 링크를 적용해야 합니다. 이 리서치 패널에는 추천 코드가 없으며, 사이트의 가입 카드에는 코드가 있습니다.",
          "tr": "Geçerli bir referans kodu veya bağlantısı uygulanmalıdır. Bu araştırma panelinde referans kodu yoktur; sitedeki kayıt kartlarında yer alır.",
          "ar": "يجب تطبيق رمز أو رابط إحالة صالح. لا تتضمن لوحة البحث هذه رموز إحالة؛ بطاقات التسجيل في الموقع تتضمنها.",
          "es": "Debe aplicarse un código o enlace de referido válido. Este panel de investigación no incluye códigos de referido; las tarjetas de registro del sitio sí.",
          "pt-BR": "É preciso aplicar um código ou link de indicação válido. Este painel de pesquisa não inclui códigos de indicação; os cartões de cadastro do site incluem.",
          "fr": "Un code ou lien de parrainage valide doit être appliqué. Ce panneau de recherche ne contient pas de code de parrainage ; les cartes d’inscription du site en contiennent.",
          "de": "Ein gültiger Empfehlungscode oder -link muss angewendet werden. Dieses Recherchefeld enthält keine Empfehlungscodes; die Anmeldekarten der Website enthalten sie.",
          "ru": "Нужно применить действующий реферальный код или ссылку. Эта исследовательская панель не содержит реферальных кодов; карточки регистрации на сайте содержат их и раскрывают комиссию.",
          "id": "Kode atau tautan referal yang valid harus diterapkan. Panel riset ini tidak memuat kode referal; kartu pendaftaran di situs ini memuatnya.",
          "vi": "Cần áp dụng mã hoặc liên kết giới thiệu hợp lệ. Bảng nghiên cứu này không kèm mã giới thiệu; các thẻ đăng ký trên trang có kèm mã.",
          "it": "Va applicato un codice o link di invito valido. Questo pannello di ricerca non include codici di invito; le schede di registrazione del sito li includono.",
          // l10n: needs native review
          "ur": "درست ریفرل کوڈ یا لنک لگانا ضروری ہے۔ یہ تحقیقی پینل ریفرل کوڈز شامل نہیں کرتا؛ اس سائٹ کے سائن اپ کارڈز کرتے ہیں اور کمیشن ظاہر کرتے ہیں۔",
          // l10n: needs native review
          "uk": "Потрібно застосувати дійсний реферальний код або посилання. Ця дослідницька панель не містить реферальних кодів; реєстраційні картки на цьому сайті містять їх і розкривають комісію."
        },
        {
          "en": "The fee discount stops after the referred account's first $25 million in volume; vaults and sub-accounts do not inherit it.",
          "zh-Hans": "受邀账户首 2,500 万美元成交量之后不再适用；金库与子账户不会继承此折扣。",
          "zh-Hant": "受邀帳戶首 2,500 萬美元成交量之後不再適用；金庫與子帳戶不會繼承此折扣。",
          "ja": "手数料の割引は、紹介されたアカウントの最初の取引量が 2,500 万ドルに達すると停止します。ボールトとサブアカウントはそれを継承しません。",
          "ko": "추천 계정의 첫 2,500만 달러 이후에는 수수료 할인이 중단됩니다. 볼트와 하위 계정은 이를 상속하지 않습니다.",
          "tr": "Ücret indirimi, yönlendirilen hesabın ilk 25 milyon dolarlık hacminin ardından durur; kasalar ve alt hesaplar bunu devralmaz.",
          "ar": "ويتوقف خصم الرسوم بعد أول 25 مليون دولار للحساب المُحال؛ ولا ينطبق ذلك على الخزائن أو الحسابات الفرعية.",
          "es": "El descuento en la tarifa finaliza después de los primeros $25 millones en volumen de la cuenta referida; las bóvedas y subcuentas no lo heredan.",
          "pt-BR": "O desconto na taxa termina após o volume dos primeiros US$ 25 milhões da referida conta; cofres e subcontas não o herdam.",
          "fr": "La remise sur les frais s'arrête après les premiers 25 millions de dollars en volume du compte référé ; les coffres-forts et les sous-comptes n’en héritent pas.",
          "de": "Der Gebührennachlass endet, sobald das empfohlene Konto das erste Volumen von 25 Millionen US-Dollar erreicht hat. Tresore und Unterkonten erben es nicht.",
          "ru": "Скидка на комиссии прекращается после достижения привлеченным счетом объема в первые 25 миллионов долларов США; на хранилища и субсчета она не распространяется.",
          "id": "Diskon biaya berhenti setelah volume pertama akun yang diundang mencapai $25 juta; vault dan sub-akun tidak mendapatkan diskon ini.",
          "vi": "Việc giảm phí sẽ dừng sau khi tài khoản được giới thiệu đạt khối lượng 25 triệu USD đầu tiên; vault và tài khoản phụ không kế thừa nó.",
          "it": "Lo sconto sulla commissione termina dopo il raggiungimento dei primi 25 milioni di dollari di volume del conto segnalato; casseforti e sottoconti non lo ereditano.",
          // l10n: needs native review
          "ur": "فیس رعایت ریفر کیے گئے اکاؤنٹ کے پہلے $25 ملین والیوم کے بعد رک جاتا ہے؛ والٹس اور ذیلی اکاؤنٹس اسے وراثت میں لیتے نہیں کرتے۔",
          // l10n: needs native review
          "uk": "знижка на комісію припиняється після перших $25 мільйонів обсягу реферованого акаунта; сховища і субакаунти його не успадковують."
        },
        {
          "en": "The inviter's $10,000 volume requirement and fee share are separate from the referred user's benefit. Region and identity requirements are not specified on this page.",
          "zh-Hans": "邀请人创建代码所需的 1 万美元交易量及其手续费分成，与受邀人权益不同；本页未说明地区与身份要求。",
          "zh-Hant": "邀請人建立代碼所需的 1 萬美元交易量及其手續費分成，與受邀人權益不同；本頁未說明地區與身分要求。",
          "ja": "招待者の 10,000 ドルのボリューム要件と手数料の負担は、紹介されたユーザーの特典とは別のものです。このページでは、地域と ID の要件は指定されていません。",
          "ko": "초대자의 $10,000 볼륨 요구 사항 및 수수료 공유는 추천 사용자의 혜택과 별개입니다. 이 페이지에는 지역 및 ID 요구 사항이 지정되어 있지 않습니다.",
          "tr": "Davet edenin 10.000$'lık hacim gereksinimi ve ücret payı, yönlendirilen kullanıcının avantajından ayrıdır. Bölge ve kimlik gereksinimleri bu sayfada belirtilmemiştir.",
          "ar": "إن متطلبات الحجم البالغة 10000 دولار أمريكي ومشاركة الرسوم الخاصة بالداعي منفصلة عن فائدة المستخدم المُحال. لم يتم تحديد متطلبات المنطقة والهوية في هذه الصفحة.",
          "es": "El requisito de volumen de $10,000 del que invita y la tarifa compartida son independientes del beneficio del usuario recomendado. Los requisitos de región e identidad no se especifican en esta página.",
          "pt-BR": "O requisito de volume de US$ 10.000 e a divisão de taxas do autor do convite são separados do benefício do usuário indicado. Os requisitos de região e identidade não são especificados nesta página.",
          "fr": "Le volume requis de 10 000 $ et la part des frais de l'invitant sont distincts de l'avantage de l'utilisateur référé. Les exigences de région et d’identité ne sont pas spécifiées sur cette page.",
          "de": "Der Volumenbedarf des Einladenden in Höhe von 10.000 US-Dollar und der Gebührenanteil sind vom Vorteil des geworbenen Benutzers getrennt. Regions- und Identitätsanforderungen werden auf dieser Seite nicht angegeben.",
          "ru": "Требование пригласителя к объему в размере 10 000 долларов США и доля комиссии не зависят от выгоды приглашенного пользователя. На этой странице не указаны требования к региону и удостоверению.",
          "id": "Persyaratan volume dan pembagian biaya sebesar $10.000 bagi pengundang terpisah dari manfaat pengguna yang dirujuk. Persyaratan wilayah dan identitas tidak ditentukan di halaman ini.",
          "vi": "Yêu cầu về khối lượng 10.000 USD của người mời và phần phí chia sẻ tách biệt với lợi ích của người dùng được giới thiệu. Yêu cầu về khu vực và danh tính không được chỉ định trên trang này.",
          "it": "Il requisito di volume di $ 10.000 e la quota di commissione dell'invitante sono separati dal vantaggio dell'utente segnalato. I requisiti di regione e identità non sono specificati in questa pagina.",
          // l10n: needs native review
          "ur": "دعوت دینے والے کی $10,000 حجم شرط اور فیس شیئر ریفر کیے گئے صارف کے فائدے سے الگ ہیں۔ علاقہ اور شناختی تقاضے اس صفحے پر بیان نہیں۔",
          // l10n: needs native review
          "uk": "Вимога $10,000 обсягу для запрошувача та частка комісій відокремлені від вигоди запрошеного користувача. Регіональні й ідентифікаційні вимоги на цій сторінці не зазначені."
        }
      ]
    },
    "sources": {
      "hyperliquid-referrals-markdown": {
        "summary": {
          "en": "The official Markdown export resolved the earlier reader error. Discounts are limited by volume; the page gives no publication date or campaign end date.",
          "zh-Hans": "官方 Markdown 导出解决了此前读取错误。折扣受成交量限制，页面未提供发布日期或活动结束日期。",
          "zh-Hant": "官方 Markdown 匯出解決了此前讀取錯誤。折扣受成交量限制，頁面未提供發布日期或活動結束日期。",
          "ja": "公式の Markdown エクスポートにより、以前のリーダー エラーが解決されました。割引は数量によって制限されます。このページには出版日やキャンペーン終了日が記載されていません。",
          "ko": "공식 Markdown 내보내기는 이전 리더 오류를 해결했습니다. 할인은 수량에 따라 제한됩니다. 페이지에는 게시 날짜나 캠페인 종료 날짜가 나와 있지 않습니다.",
          "tr": "Resmi Markdown aktarımı, önceki okuyucu hatasını çözdü. İndirimler hacimle sınırlıdır; sayfada yayın tarihi veya kampanya bitiş tarihi belirtilmemektedir.",
          "ar": "أدى تصدير Markdown الرسمي إلى حل خطأ القارئ السابق. الخصومات محدودة بالحجم؛ لا تعطي الصفحة تاريخ النشر أو تاريخ انتهاء الحملة.",
          "es": "La exportación oficial de Markdown resolvió el error anterior del lector. Los descuentos están limitados por volumen; la página no da fecha de publicación ni fecha de finalización de la campaña.",
          "pt-BR": "A exportação oficial do Markdown resolveu o erro anterior do leitor. Os descontos são limitados por volume; a página não fornece data de publicação ou data de término da campanha.",
          "fr": "L'exportation officielle de Markdown a résolu l'erreur précédente du lecteur. Les réductions sont limitées par le volume ; la page ne donne aucune date de publication ni date de fin de campagne.",
          "de": "Der offizielle Markdown-Export hat den früheren Lesefehler behoben. Rabatte sind mengenmäßig begrenzt; Die Seite gibt kein Veröffentlichungsdatum oder Enddatum der Kampagne an.",
          "ru": "Официальный экспорт Markdown устранил более раннюю ошибку чтения. Скидки ограничены объемом; на странице не указана дата публикации или дата окончания кампании.",
          "id": "Ekspor penurunan harga resmi menyelesaikan kesalahan pembaca sebelumnya. Diskon dibatasi berdasarkan volume; halaman tersebut tidak memberikan tanggal publikasi atau tanggal akhir kampanye.",
          "vi": "Việc xuất Markdown chính thức đã giải quyết được lỗi trình đọc trước đó. Giảm giá bị giới hạn bởi số lượng; trang này không cung cấp ngày xuất bản hoặc ngày kết thúc chiến dịch.",
          "it": "L'esportazione ufficiale di Markdown ha risolto l'errore precedente del lettore. Gli sconti sono limitati in base al volume; la pagina non riporta alcuna data di pubblicazione o di fine campagna.",
          // l10n: needs native review
          "ur": "سرکاری Markdown ایکسپورٹ نے پہلے والا ریڈر ایرر حل کیا۔ ڈسکاؤنٹس والیوم سے محدود ہیں؛ صفحہ اشاعت کی تاریخ یا مہم کی آخری تاریخ نہیں دیتا۔",
          // l10n: needs native review
          "uk": "Офіційний експорт Markdown усунув попередню помилку читача. Знижки обмежені обсягом; сторінка не надає дати публікації або дати завершення кампанії."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "A valid referral code or link must be applied. This research panel does not include referral codes; the sign-up cards on this site do.",
        "zh-Hans": "需绑定有效邀请代码或链接。本研究面板不附邀请码；本站的开户卡片会附带邀请码。",
        "zh-Hant": "需綁定有效邀請代碼或連結。本研究面板不附邀請碼；本站的開戶卡片會附帶邀請碼。",
        "ja": "有効な紹介コードまたはリンクの適用が必要です。この調査パネルには紹介コードを載せていません。サイト内の登録カードにはコードがあります。",
        "ko": "유효한 추천 코드나 링크를 적용해야 합니다. 이 리서치 패널에는 추천 코드가 없으며, 사이트의 가입 카드에는 코드가 있습니다.",
        "tr": "Geçerli bir referans kodu veya bağlantısı uygulanmalıdır. Bu araştırma panelinde referans kodu yoktur; sitedeki kayıt kartlarında yer alır.",
        "ar": "يجب تطبيق رمز أو رابط إحالة صالح. لا تتضمن لوحة البحث هذه رموز إحالة؛ بطاقات التسجيل في الموقع تتضمنها.",
        "es": "Debe aplicarse un código o enlace de referido válido. Este panel de investigación no incluye códigos de referido; las tarjetas de registro del sitio sí.",
        "pt-BR": "É preciso aplicar um código ou link de indicação válido. Este painel de pesquisa não inclui códigos de indicação; os cartões de cadastro do site incluem.",
        "fr": "Un code ou lien de parrainage valide doit être appliqué. Ce panneau de recherche ne contient pas de code de parrainage ; les cartes d’inscription du site en contiennent.",
        "de": "Ein gültiger Empfehlungscode oder -link muss angewendet werden. Dieses Recherchefeld enthält keine Empfehlungscodes; die Anmeldekarten der Website enthalten sie.",
        "ru": "Нужно применить действующий реферальный код или ссылку. Эта исследовательская панель не содержит реферальных кодов; карточки регистрации на сайте содержат их и раскрывают комиссию.",
        "id": "Kode atau tautan referal yang valid harus diterapkan. Panel riset ini tidak memuat kode referal; kartu pendaftaran di situs ini memuatnya.",
        "vi": "Cần áp dụng mã hoặc liên kết giới thiệu hợp lệ. Bảng nghiên cứu này không kèm mã giới thiệu; các thẻ đăng ký trên trang có kèm mã.",
        "it": "Va applicato un codice o link di invito valido. Questo pannello di ricerca non include codici di invito; le schede di registrazione del sito li includono.",
        // l10n: needs native review
        "ur": "درست ریفرل کوڈ یا لنک لاگو ہونا چاہیے۔ یہ تحقیقی پینل ریفرل کوڈز شامل نہیں کرتا؛ اس سائٹ کے سائن اپ کارڈز شامل کرتے ہیں اور کمیشن ظاہر کرتے ہیں۔",
        // l10n: needs native review
        "uk": "Потрібно застосувати дійсний реферальний код або посилання. Ця дослідницька панель не містить реферальних кодів; реєстрацію-картки на цьому сайті містять їх і розкривають комісію."
      },
      "trading": {
        "en": "The fee discount stops after the referred account's first $25 million in volume; vaults and sub-accounts do not inherit it.",
        "zh-Hans": "受邀账户首 2,500 万美元成交量之后不再适用；金库与子账户不会继承此折扣。",
        "zh-Hant": "受邀帳戶首 2,500 萬美元成交量之後不再適用；金庫與子帳戶不會繼承此折扣。",
        "ja": "手数料の割引は、紹介されたアカウントの最初の取引量が 2,500 万ドルに達すると停止します。ボールトとサブアカウントはそれを継承しません。",
        "ko": "추천 계정의 첫 2,500만 달러 이후에는 수수료 할인이 중단됩니다. 볼트와 하위 계정은 이를 상속하지 않습니다.",
        "tr": "Ücret indirimi, yönlendirilen hesabın ilk 25 milyon dolarlık hacminin ardından durur; kasalar ve alt hesaplar bunu devralmaz.",
        "ar": "ويتوقف خصم الرسوم بعد أول 25 مليون دولار للحساب المُحال؛ ولا ينطبق ذلك على الخزائن أو الحسابات الفرعية.",
        "es": "El descuento en la tarifa finaliza después de los primeros $25 millones en volumen de la cuenta referida; las bóvedas y subcuentas no lo heredan.",
        "pt-BR": "O desconto na taxa termina após o volume dos primeiros US$ 25 milhões da referida conta; cofres e subcontas não o herdam.",
        "fr": "La remise sur les frais s'arrête après les premiers 25 millions de dollars en volume du compte référé ; les coffres-forts et les sous-comptes n’en héritent pas.",
        "de": "Der Gebührennachlass endet, sobald das empfohlene Konto das erste Volumen von 25 Millionen US-Dollar erreicht hat. Tresore und Unterkonten erben es nicht.",
        "ru": "Скидка на комиссии прекращается после достижения привлеченным счетом объема в первые 25 миллионов долларов США; на хранилища и субсчета она не распространяется.",
        "id": "Diskon biaya berhenti setelah volume pertama akun yang diundang mencapai $25 juta; vault dan sub-akun tidak mendapatkan diskon ini.",
        "vi": "Việc giảm phí sẽ dừng sau khi tài khoản được giới thiệu đạt khối lượng 25 triệu USD đầu tiên; vault và tài khoản phụ không kế thừa nó.",
        "it": "Lo sconto sulla commissione termina dopo il raggiungimento dei primi 25 milioni di dollari di volume del conto segnalato; casseforti e sottoconti non lo ereditano.",
        // l10n: needs native review
        "ur": "فیس رعایت ریفر کیے گئے اکاؤنٹ کے پہلے $25 ملین حجم کے بعد رک جاتی ہے؛ والٹس اور ذیلی اکاؤنٹس اسے منتقل نہیں ہوتی نہیں کرتے۔",
        // l10n: needs native review
        "uk": "Знижка на комісії припиняється після перших $25 млн обсягу запрошеного акаунта; сховища і субакаунти її не успадковують."
      },
      "rewardType": {
        "en": "Discount on specified trading fees",
        "zh-Hans": "指定交易手续费折扣",
        "zh-Hant": "指定交易手續費折扣",
        "ja": "指定取引手数料の割引",
        "ko": "특정 거래 수수료 할인",
        "tr": "Belirtilen işlem ücretlerinde indirim",
        "ar": "خصم على رسوم التداول المحددة",
        "es": "Descuento en tarifas comerciales específicas",
        "pt-BR": "Desconto em taxas de negociação específicas",
        "fr": "Remise sur les frais de négociation spécifiés",
        "de": "Rabatt auf bestimmte Handelsgebühren",
        "ru": "Скидка на указанные торговые комиссии",
        "id": "Diskon biaya perdagangan tertentu",
        "vi": "Giảm phí giao dịch được chỉ định",
        "it": "Sconto sulle commissioni di negoziazione specificate",
        // l10n: needs native review
        "ur": "مخصوص ٹریڈنگ فیس پر رعایت۔",
        // l10n: needs native review
        "uk": "Знижка на визначені торгові комісії."
      },
      "maximumConditions": {
        "en": "The fee discount stops after the referred account's first $25 million in volume; vaults and sub-accounts do not inherit it.",
        "zh-Hans": "受邀账户首 2,500 万美元成交量之后不再适用；金库与子账户不会继承此折扣。",
        "zh-Hant": "受邀帳戶首 2,500 萬美元成交量之後不再適用；金庫與子帳戶不會繼承此折扣。",
        "ja": "手数料の割引は、紹介されたアカウントの最初の取引量が 2,500 万ドルに達すると停止します。ボールトとサブアカウントはそれを継承しません。",
        "ko": "추천 계정의 첫 2,500만 달러 이후에는 수수료 할인이 중단됩니다. 볼트와 하위 계정은 이를 상속하지 않습니다.",
        "tr": "Ücret indirimi, yönlendirilen hesabın ilk 25 milyon dolarlık hacminin ardından durur; kasalar ve alt hesaplar bunu devralmaz.",
        "ar": "ويتوقف خصم الرسوم بعد أول 25 مليون دولار للحساب المُحال؛ ولا ينطبق ذلك على الخزائن أو الحسابات الفرعية.",
        "es": "El descuento en la tarifa finaliza después de los primeros $25 millones en volumen de la cuenta referida; las bóvedas y subcuentas no lo heredan.",
        "pt-BR": "O desconto na taxa termina após o volume dos primeiros US$ 25 milhões da referida conta; cofres e subcontas não o herdam.",
        "fr": "La remise sur les frais s'arrête après les premiers 25 millions de dollars en volume du compte référé ; les coffres-forts et les sous-comptes n’en héritent pas.",
        "de": "Der Gebührennachlass endet, sobald das empfohlene Konto das erste Volumen von 25 Millionen US-Dollar erreicht hat. Tresore und Unterkonten erben es nicht.",
        "ru": "Скидка на комиссии прекращается после достижения привлеченным счетом объема в первые 25 миллионов долларов США; на хранилища и субсчета она не распространяется.",
        "id": "Diskon biaya berhenti setelah volume pertama akun yang diundang mencapai $25 juta; vault dan sub-akun tidak mendapatkan diskon ini.",
        "vi": "Việc giảm phí sẽ dừng sau khi tài khoản được giới thiệu đạt khối lượng 25 triệu USD đầu tiên; vault và tài khoản phụ không kế thừa nó.",
        "it": "Lo sconto sulla commissione termina dopo il raggiungimento dei primi 25 milioni di dollari di volume del conto segnalato; casseforti e sottoconti non lo ereditano.",
        // l10n: needs native review
        "ur": "فیس رعایت ریفر کیے گئے اکاؤنٹ کے پہلے $25 ملین والیوم کے بعد رک جاتا ہے؛ والٹس اور ذیلی اکاؤنٹس اسے وراثت میں لیتے نہیں کرتے۔",
        // l10n: needs native review
        "uk": "знижка на комісію припиняється після перших $25 мільйонів обсягу реферованого акаунта; сховища і субакаунти його не успадковують."
      },
      "limitations": {
        "en": "The inviter's $10,000 volume requirement and fee share are separate from the referred user's benefit. Region and identity requirements are not specified on this page.",
        "zh-Hans": "邀请人创建代码所需的 1 万美元交易量及其手续费分成，与受邀人权益不同；本页未说明地区与身份要求。",
        "zh-Hant": "邀請人建立代碼所需的 1 萬美元交易量及其手續費分成，與受邀人權益不同；本頁未說明地區與身分要求。",
        "ja": "招待者の 10,000 ドルのボリューム要件と手数料の負担は、紹介されたユーザーの特典とは別のものです。このページでは、地域と ID の要件は指定されていません。",
        "ko": "초대자의 $10,000 볼륨 요구 사항 및 수수료 공유는 추천 사용자의 혜택과 별개입니다. 이 페이지에는 지역 및 ID 요구 사항이 지정되어 있지 않습니다.",
        "tr": "Davet edenin 10.000$'lık hacim gereksinimi ve ücret payı, yönlendirilen kullanıcının avantajından ayrıdır. Bölge ve kimlik gereksinimleri bu sayfada belirtilmemiştir.",
        "ar": "إن متطلبات الحجم البالغة 10000 دولار أمريكي ومشاركة الرسوم الخاصة بالداعي منفصلة عن فائدة المستخدم المُحال. لم يتم تحديد متطلبات المنطقة والهوية في هذه الصفحة.",
        "es": "El requisito de volumen de $10,000 del que invita y la tarifa compartida son independientes del beneficio del usuario recomendado. Los requisitos de región e identidad no se especifican en esta página.",
        "pt-BR": "O requisito de volume de US$ 10.000 e a divisão de taxas do autor do convite são separados do benefício do usuário indicado. Os requisitos de região e identidade não são especificados nesta página.",
        "fr": "Le volume requis de 10 000 $ et la part des frais de l'invitant sont distincts de l'avantage de l'utilisateur référé. Les exigences de région et d’identité ne sont pas spécifiées sur cette page.",
        "de": "Der Volumenbedarf des Einladenden in Höhe von 10.000 US-Dollar und der Gebührenanteil sind vom Vorteil des geworbenen Benutzers getrennt. Regions- und Identitätsanforderungen werden auf dieser Seite nicht angegeben.",
        "ru": "Требование пригласителя к объему в размере 10 000 долларов США и доля комиссии не зависят от выгоды приглашенного пользователя. На этой странице не указаны требования к региону и удостоверению.",
        "id": "Persyaratan volume dan pembagian biaya sebesar $10.000 bagi pengundang terpisah dari manfaat pengguna yang dirujuk. Persyaratan wilayah dan identitas tidak ditentukan di halaman ini.",
        "vi": "Yêu cầu về khối lượng 10.000 USD của người mời và phần phí chia sẻ tách biệt với lợi ích của người dùng được giới thiệu. Yêu cầu về khu vực và danh tính không được chỉ định trên trang này.",
        "it": "Il requisito di volume di $ 10.000 e la quota di commissione dell'invitante sono separati dal vantaggio dell'utente segnalato. I requisiti di regione e identità non sono specificati in questa pagina.",
        // l10n: needs native review
        "ur": "مدعو کرنے والے کی $10,000 والیوم شرط اور فیس شیئر ریفر کیے گئے صارف کے فائدے سے الگ ہیں۔ ریجن اور شناختی تقاضے اس صفحے پر درج نہیں۔",
        // l10n: needs native review
        "uk": "Вимога $10,000 обсягу для запрошувача й частка комісії окремі від вигоди запрошеного користувача. Вимоги щодо регіону та ідентифікації на цій сторінці не зазначені."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ماخذ قابل اطلاق شناختی تصدیق کا تقاضا قائم نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; порожнє значення не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        }
      ]
    }
  },
  "dydx": {
    "summary": {
      "en": "The reviewed dYdX incentive notice covers June, while a later product update distinguishes Arcus from dYdX v4. Neither establishes a current signup payout.",
      "zh-Hans": "已读 dYdX 激励公告覆盖 6 月，后续产品更新区分 Arcus 与 dYdX v4；两者都不能证明当前注册到账奖励。",
      "zh-Hant": "已讀 dYdX 激勵公告涵蓋 6 月，後續產品更新區分 Arcus 與 dYdX v4；兩者都不能證明目前註冊到帳獎勵。",
      "ja": "レビューされた dYdX インセンティブ通知は 6 月を対象としていますが、その後の製品アップデートでは Arcus と dYdX v4 が区別されます。どちらも現在のサインアップ支払いを確立しません。",
      "ko": "검토된 dYdX 인센티브 공지는 6월에 적용되며 이후 제품 업데이트에서는 Arcus를 dYdX v4와 구별합니다. 둘 다 현재 가입 지불금을 설정하지 않습니다.",
      "tr": "İncelenen dYdX teşvik bildirimi Haziran ayını kapsarken, daha sonraki bir ürün güncellemesi Arcus'u dYdX v4'ten ayırıyor. İkisi de geçerli bir kayıt ödemesi sağlamaz.",
      "ar": "يغطي إشعار حوافز dYdX الذي تمت مراجعته شهر يونيو، بينما يميز تحديث المنتج اللاحق Arcus عن dYdX v4. ولا يحدد أي منهما عائد الاشتراك الحالي.",
      "es": "El aviso de incentivo de dYdX revisado cubre junio, mientras que una actualización posterior del producto distingue a Arcus de dYdX v4. Ninguno de los dos establece un pago de registro actual.",
      "pt-BR": "O aviso de incentivo dYdX revisado abrange junho, enquanto uma atualização posterior do produto distingue o Arcus do dYdX v4. Nenhum dos dois estabelece um pagamento de inscrição atual.",
      "fr": "L'avis d'incitation dYdX examiné couvre le mois de juin, tandis qu'une mise à jour ultérieure du produit distingue Arcus de dYdX v4. Ni l’un ni l’autre n’établit un paiement d’inscription actuel.",
      "de": "Die überprüfte dYdX-Incentive-Mitteilung deckt den Juni ab, während ein späteres Produktupdate Arcus von dYdX v4 unterscheidet. Beides stellt keine aktuelle Anmeldeauszahlung dar.",
      "ru": "Рассмотренное уведомление о поощрении dYdX охватывает июнь, а в более позднем обновлении продукта Arcus отличается от dYdX v4. Ни один из них не устанавливает текущую выплату за регистрацию.",
      "id": "Pemberitahuan insentif dYdX yang ditinjau mencakup bulan Juni, sedangkan pembaruan produk selanjutnya membedakan Arcus dari dYdX v4. Tidak ada yang menetapkan pembayaran pendaftaran saat ini.",
      "vi": "Thông báo khuyến khích dYdX được xem xét bao gồm tháng 6, trong khi bản cập nhật sản phẩm sau này giúp phân biệt Arcus với dYdX v4. Không thiết lập khoản thanh toán đăng ký hiện tại.",
      "it": "L'avviso sugli incentivi dYdX rivisto riguarda giugno, mentre un successivo aggiornamento del prodotto distingue Arcus da dYdX v4. Nessuno dei due stabilisce un pagamento di registrazione corrente.",
      // l10n: needs native review
      "ur": "جائزہ شدہ dYdX مراعاتی نوٹس جون کا احاطہ کرتا ہے، جبکہ بعد کی پروڈکٹ اپ ڈیٹ Arcus کو dYdX v4 سے الگ کرتی ہے۔ کوئی بھی موجودہ سائن اپ ادائیگی ثابت نہیں کرتا۔",
      // l10n: needs native review
      "uk": "Перевірене повідомлення про стимули dYdX охоплює червень, тоді як пізніше оновлення продукту відрізняє Arcus від dYdX v4. Жодне з них не встановлює поточну виплату за реєстрацію."
    },
    "signupReward": {
      "summary": {
        "en": "The June campaign is historical. No September renewal, current referral benefit or personal eligibility was established in the reviewed sources.",
        "zh-Hans": "6 月活动已属历史；本次来源没有证明 9 月续期、当前邀请优惠或个人参与资格。",
        "zh-Hant": "6 月活動已屬歷史；本次來源沒有證明 9 月續期、目前邀請優惠或個人參與資格。",
        "ja": "6 月のキャンペーンは歴史的なものです。レビューされた情報源では、9 月の更新、現在の紹介特典、または個人の資格は確立されていません。",
        "ko": "6월 캠페인은 역사적입니다. 검토된 출처에는 9월 갱신, 현재 추천 혜택 또는 개인 자격이 확립되지 않았습니다.",
        "tr": "Haziran kampanyası tarihi bir kampanyadır. İncelenen kaynaklarda Eylül ayı yenilemesi, mevcut sevk yardımı veya kişisel uygunluk belirlenmemiştir.",
        "ar": "حملة يونيو تاريخية. لم يتم تحديد أي تجديد لشهر سبتمبر أو فائدة الإحالة الحالية أو الأهلية الشخصية في المصادر التي تمت مراجعتها.",
        "es": "La campaña de junio es histórica. En las fuentes revisadas no se estableció ninguna renovación de septiembre, beneficio de referencia actual o elegibilidad personal.",
        "pt-BR": "A campanha de junho é histórica. Nenhuma renovação de setembro, benefício de referência atual ou elegibilidade pessoal foi estabelecida nas fontes revisadas.",
        "fr": "La campagne de juin est historique. Aucun renouvellement en septembre, aucune prestation de référence actuelle ou éligibilité personnelle n'ont été établis dans les sources examinées.",
        "de": "Die Juni-Kampagne ist historisch. In den überprüften Quellen wurde weder eine Verlängerung im September noch ein aktueller Empfehlungsvorteil noch eine persönliche Berechtigung festgestellt.",
        "ru": "Июньская кампания имеет историческое значение. В рассмотренных источниках не было установлено продление сентября, текущие реферальные льготы или личное право на участие.",
        "id": "Kampanye bulan Juni merupakan kampanye bersejarah. Tidak ada perpanjangan bulan September, manfaat rujukan saat ini, atau kelayakan pribadi yang ditetapkan dalam sumber yang ditinjau.",
        "vi": "Chiến dịch tháng Sáu mang tính lịch sử. Không có sự gia hạn tháng 9, lợi ích giới thiệu hiện tại hoặc tính đủ điều kiện cá nhân được thiết lập trong các nguồn được xem xét.",
        "it": "La campagna di giugno è storica. Nelle fonti esaminate non è stato stabilito alcun rinnovo di settembre, alcun beneficio di riferimento attuale o idoneità personale.",
        // l10n: needs native review
        "ur": "جون کی مہم تاریخی ہے۔ جائزہ شدہ ذرائع میں ستمبر کی تجدید، موجودہ ریفرل فائدہ یا ذاتی اہلیت ثابت نہیں ہوئی۔",
        // l10n: needs native review
        "uk": "Червнева кампанія є історичною. У переглянутих джерелах не встановлено вересневе поновлення, поточну реферальну вигоду або персональну придатність."
      }
    },
    "sources": {
      "dydx-docs-index": {
        "summary": {
          "en": "Documentation index only. Product navigation should not be mistaken for a token-listing or giveaway notice.",
          "zh-Hans": "仅为文档目录，产品导航不能被当作上币或赠送代币公告。",
          "zh-Hant": "僅為文件目錄，產品導覽不能被當作上幣或贈送代幣公告。",
          "ja": "ドキュメントのインデックスのみ。製品ナビゲーションをトークンのリストやプレゼントの通知と誤解してはなりません。",
          "ko": "문서 색인 전용입니다. 제품 탐색을 토큰 상장이나 경품 공지로 착각해서는 안 됩니다.",
          "tr": "Yalnızca belge dizini. Ürün navigasyonu, jeton listeleme veya hediye bildirimi ile karıştırılmamalıdır.",
          "ar": "فهرس التوثيق فقط. لا ينبغي الخلط بين التنقل بين المنتجات وبين قائمة الرموز المميزة أو إشعار الهبة.",
          "es": "Sólo índice de documentación. La navegación del producto no debe confundirse con una lista de tokens o un aviso de obsequio.",
          "pt-BR": "Apenas índice de documentação. A navegação do produto não deve ser confundida com uma listagem de tokens ou aviso de brinde.",
          "fr": "Index de la documentation uniquement. La navigation sur les produits ne doit pas être confondue avec une liste de jetons ou un avis de cadeau.",
          "de": "Nur Dokumentationsindex. Die Produktnavigation sollte nicht mit einer Token-Auflistung oder einer Werbemitteilung verwechselt werden.",
          "ru": "Только указатель документации. Навигацию по продукту не следует путать с листингом токенов или уведомлением о раздаче.",
          "id": "Indeks dokumentasi saja. Navigasi produk tidak boleh disalahartikan sebagai daftar token atau pemberitahuan giveaway.",
          "vi": "Chỉ mục tài liệu. Không nên nhầm lẫn điều hướng sản phẩm với thông báo niêm yết mã thông báo hoặc quà tặng.",
          "it": "Solo indice della documentazione. La navigazione del prodotto non deve essere confusa con un elenco di token o un avviso di omaggio.",
          // l10n: needs native review
          "ur": "صرف دستاویزات اشاریہ ہے۔ مصنوعات نیویگیشن کو ٹوکن لسٹنگ یا گِو اوے نوٹس نہ سمجھا جائے۔",
          // l10n: needs native review
          "uk": "Лише документація індекс. Навігацію продуктів не слід плутати з лістинг токена або повідомлення про роздачу."
        }
      },
      "dydx-surge-june": {
        "summary": {
          "en": "The 1 June notice covers June incentives: BTC/BONK trading-fee discounts and partial liquidation rebates on eligible non-BTC markets. Gas, bridging, slippage and third-party costs remain. It establishes no September renewal, so the reviewed June period is historical.",
          "zh-Hans": "6 月 1 日公告只覆盖 6 月激励：BTC/BONK 交易费优惠及合资格非 BTC 市场的部分清算返还。Gas、跨链、滑点和第三方成本仍存在；未证明 9 月续期，本次所读 6 月周期已属历史。",
          "zh-Hant": "6 月 1 日公告只涵蓋 6 月激勵：BTC/BONK 交易費優惠及合資格非 BTC 市場的部分清算返還。Gas、跨鏈、滑點和第三方成本仍存在；未證明 9 月續期，本次所讀 6 月週期已屬歷史。",
          "ja": "6 月 1 日の通知には、6 月のインセンティブ、つまり BTC/BONK 取引手数料の割引と対象となる非 BTC 市場での部分清算リベートが含まれています。ガス、ブリッジ、スリッページ、サードパーティのコストは残ります。 9 月の更新は確立されていないため、見直した 6 月の期間は過去のものです。",
          "ko": "6월 1일 공지에는 6월 인센티브가 포함됩니다: BTC/BONK 거래 수수료 할인 및 적격 비 BTC 시장에 대한 부분 청산 리베이트. 가스, 브리징, 미끄러짐 및 제3자 비용이 남아 있습니다. 9월 갱신이 설정되지 않았으므로 검토된 6월 기간은 역사적입니다.",
          "tr": "1 Haziran tarihli bildirim, Haziran ayı teşviklerini kapsıyor: BTC/BONK işlem ücreti indirimleri ve uygun BTC dışı piyasalarda kısmi tasfiye indirimleri. Gaz, köprüleme, kayma ve üçüncü taraf maliyetleri devam etmektedir. Eylül ayında yenileme yapılmadığından, incelenen Haziran dönemi tarihsel niteliktedir.",
          "ar": "يغطي إشعار 1 يونيو حوافز يونيو: خصومات رسوم تداول BTC/BONK وخصومات التصفية الجزئية في الأسواق المؤهلة غير BTC. تظل تكاليف الغاز والجسور والانزلاق وتكاليف الطرف الثالث قائمة. فهو لا يحدد أي تجديد لشهر سبتمبر، وبالتالي فإن فترة يونيو التي تمت مراجعتها تاريخية.",
          "es": "El aviso del 1 de junio cubre los incentivos de junio: descuentos en las tarifas comerciales de BTC/BONK y reembolsos de liquidación parcial en mercados elegibles que no son BTC. Se mantienen los costes de gas, puentes, deslizamientos y terceros. No establece ninguna renovación en septiembre, por lo que el periodo de junio revisado es histórico.",
          "pt-BR": "O aviso de 1º de junho cobre os incentivos de junho: descontos nas taxas de negociação BTC/BONK e descontos parciais de liquidação em mercados não-BTC elegíveis. Os custos de gás, pontes, deslizamentos e terceiros permanecem. Não estabelece renovação em setembro, portanto o período de junho revisado é histórico.",
          "fr": "L'avis du 1er juin couvre les incitations de juin : remises sur les frais de négociation BTC/BONK et remises de liquidation partielle sur les marchés éligibles non BTC. Les frais de gaz, de pontage, de glissement et de tiers demeurent. Il n'établit aucun renouvellement en septembre, la période de juin révisée est donc historique.",
          "de": "Die Bekanntmachung vom 1. Juni umfasst Juni-Anreize: Rabatte auf BTC/BONK-Handelsgebühren und teilweise Liquidationsrabatte auf berechtigten Nicht-BTC-Märkten. Es bleiben Gas-, Überbrückungs-, Schlupf- und Fremdkosten bestehen. Es sieht keine Erneuerung im September vor, daher ist der betrachtete Juni-Zeitraum historisch.",
          "ru": "Уведомление от 1 июня охватывает июньские поощрения: скидки на торговые комиссии для BTC/BONK и компенсации при частичной ликвидации на подходящих рынках, кроме BTC. Расходы на газ, комиссии за мосты, проскальзывание и сборы третьих сторон сохраняются. В нем не указано продление на сентябрь, поэтому рассмотренный июньский период является архивным.",
          "id": "Pengumuman tanggal 1 Juni mencakup insentif bulan Juni: diskon biaya trading BTC/BONK dan rabat likuidasi parsial di pasar non-BTC yang memenuhi syarat. Biaya gas, bridge, slippage, dan biaya pihak ketiga tetap berlaku. Sumber ini tidak memuat perpanjangan untuk bulan September, sehingga periode Juni yang ditinjau bersifat historis.",
          "vi": "Thông báo ngày 1 tháng 6 bao gồm các ưu đãi của tháng 6: chiết khấu phí giao dịch BTC/BONK và giảm giá thanh lý một phần trên các thị trường không phải BTC đủ điều kiện. Chi phí gas, bắc cầu, trượt giá và bên thứ ba vẫn còn. Nó không thiết lập việc gia hạn vào tháng 9, vì vậy khoảng thời gian tháng 6 được xem xét mang tính lịch sử.",
          "it": "L'avviso del 1° giugno riguarda gli incentivi di giugno: sconti sulle commissioni di negoziazione BTC/BONK e sconti parziali di liquidazione sui mercati idonei non BTC. Rimangono i costi relativi a gas, bridge, slippage e terzi. Non prevede il rinnovo di settembre, quindi il periodo di giugno esaminato è storico.",
          // l10n: needs native review
          "ur": "1 جون کا نوٹس جون کی مراعات کا احاطہ کرتا ہے: اہل غیر BTC مارکیٹوں پر BTC/BONK ٹریڈنگ فیس کی رعایتیں اور جزوی لیکویڈیشن ریبیٹس۔ گیس، برجنگ، پھسلن اور تیسرے فریق کے اخراجات برقرار رہتے ہیں۔ یہ ستمبر کی تجدید ثابت نہیں کرتا، اس لیے جائزہ شدہ جون مدت تاریخی ہے۔",
          // l10n: needs native review
          "uk": "Повідомлення від 1 червня охоплює червневі стимули: знижки на торгові комісії BTC/BONK і часткові ребейти за ліквідації на придатних не-BTC ринках. Газ, міст, прослизання й сторонні витрати залишаються. Воно не встановлює вересневе поновлення, тому перевірений червневий період є історичним."
        }
      },
      "dydx-arcus-july": {
        "summary": {
          "en": "The July update distinguishes the new Arcus product from dYdX v4 and says v4 continues to be supported. A possible future token allocation is mentioned without a claim amount or date. Neither this notice nor a historical campaign proves a current signup reward.",
          "zh-Hans": "7 月更新区分新产品 Arcus 与 dYdX v4，并表示继续支持 v4。文中提及潜在未来代币分配，但没有领取金额或日期；该公告与历史活动都不能证明当前注册奖励。",
          "zh-Hant": "7 月更新區分新產品 Arcus 與 dYdX v4，並表示繼續支援 v4。文中提及潛在未來代幣分配，但沒有領取金額或日期；該公告與歷史活動都不能證明目前註冊獎勵。",
          "ja": "7 月のアップデートでは、新しい Arcus 製品と dYdX v4 が区別され、v4 は引き続きサポートされると記載されています。将来のトークン割り当ての可能性については、請求額や日付は記載されていません。この通知も過去のキャンペーンも、現在のサインアップ特典を証明するものではありません。",
          "ko": "7월 업데이트에서는 새로운 Arcus 제품을 dYdX v4와 구별하고 v4가 계속 지원된다고 말합니다. 청구 금액이나 날짜 없이 향후 토큰 할당이 언급됩니다. 이 공지나 과거 캠페인 모두 현재 가입 보상을 증명하지 않습니다.",
          "tr": "Temmuz güncellemesi, yeni Arcus ürününü dYdX v4'ten ayırıyor ve v4'ün desteklenmeye devam ettiğini söylüyor. Gelecekteki olası bir token tahsisinden, talep tutarı veya tarihi olmadan bahsediliyor. Ne bu bildirim ne de geçmiş bir kampanya, mevcut bir kayıt ödülünü kanıtlamaz.",
          "ar": "يميز تحديث يوليو منتج Arcus الجديد عن dYdX v4 ويوضح أن الإصدار 4 لا يزال مدعوماً. وتم ذكر تخصيص محتمل للتوكنات في المستقبل دون تحديد مبلغ أو تاريخ للمطالبة. ولا يثبت هذا الإشعار ولا الحملات السابقة وجود مكافأة تسجيل حالية.",
          "es": "La actualización de julio distingue el nuevo producto Arcus de dYdX v4 y dice que la versión 4 sigue siendo compatible. Se menciona una posible asignación futura de tokens sin un monto o fecha de reclamo. Ni este aviso ni una campaña histórica prueban una recompensa de registro actual.",
          "pt-BR": "A atualização de julho distingue o novo produto Arcus do dYdX v4 e diz que a v4 continua a ser suportada. Uma possível alocação futura de tokens é mencionada sem valor ou data de reivindicação. Nem este aviso nem uma campanha histórica provam uma recompensa de inscrição atual.",
          "fr": "La mise à jour de juillet distingue le nouveau produit Arcus de dYdX v4 et indique que la v4 continue d'être prise en charge. Une éventuelle future allocation de jetons est mentionnée sans montant ni date de réclamation. Ni cet avis ni une campagne historique ne prouvent une récompense d'inscription actuelle.",
          "de": "Das Juli-Update unterscheidet das neue Arcus-Produkt von dYdX v4 und besagt, dass v4 weiterhin unterstützt wird. Eine mögliche zukünftige Token-Zuteilung wird ohne Anspruchshöhe oder -datum erwähnt. Weder dieser Hinweis noch eine historische Kampagne beweisen eine aktuelle Anmeldeprämie.",
          "ru": "Июльское обновление отличает новый продукт Arcus от dYdX v4 и сообщает, что v4 продолжает поддерживаться. Возможное будущее распределение токенов упоминается без суммы или даты требования. Ни это уведомление, ни историческая кампания не подтверждают текущее вознаграждение за регистрацию.",
          "id": "Pembaruan bulan Juli membedakan produk Arcus baru dari dYdX v4 dan mengatakan v4 terus didukung. Kemungkinan alokasi token di masa depan disebutkan tanpa jumlah atau tanggal klaim. Baik pemberitahuan maupun kampanye historis ini tidak membuktikan imbalan pendaftaran saat ini.",
          "vi": "Bản cập nhật tháng 7 phân biệt sản phẩm Arcus mới với dYdX v4 và cho biết v4 tiếp tục được hỗ trợ. Việc phân bổ mã thông báo có thể có trong tương lai được đề cập mà không có số tiền hoặc ngày yêu cầu. Cả thông báo này lẫn chiến dịch lịch sử đều không chứng minh được phần thưởng đăng ký hiện tại.",
          "it": "L'aggiornamento di luglio distingue il nuovo prodotto Arcus da dYdX v4 e afferma che la v4 continua a essere supportata. Una possibile futura assegnazione di token viene menzionata senza importo o data di richiesta. Né questo avviso né una campagna storica dimostrano un attuale premio di iscrizione.",
          // l10n: needs native review
          "ur": "جولائی اپ ڈیٹ نئے Arcus پروڈکٹ کو dYdX v4 سے الگ بتاتا ہے اور کہتا ہے کہ v4 کی حمایت جاری ہے۔ ممکنہ مستقبل کی ٹوکن الاٹمنٹ کا ذکر ہے، مگر دعویٰ رقم یا تاریخ کے بغیر۔ نہ یہ نوٹس اور نہ کوئی تاریخی مہم موجودہ سائن اپ انعام ثابت کرتی ہے۔",
          // l10n: needs native review
          "uk": "Липневе оновлення відрізняє новий продукт Arcus від dYdX v4 і каже, що v4 надалі підтримується. Можливий майбутній розподіл токенів згадано без суми чи дати заявки. Ні це повідомлення, ні історична кампанія не доводять поточну винагороду за реєстрацію."
        }
      }
    },
    "evidenceRequirements": {
      "limitations": {
        "en": "The June campaign is historical. No September renewal, current referral benefit or personal eligibility was established in the reviewed sources.",
        "zh-Hans": "6 月活动已属历史；本次来源没有证明 9 月续期、当前邀请优惠或个人参与资格。",
        "zh-Hant": "6 月活動已屬歷史；本次來源沒有證明 9 月續期、目前邀請優惠或個人參與資格。",
        "ja": "6 月のキャンペーンは歴史的なものです。レビューされた情報源では、9 月の更新、現在の紹介特典、または個人の資格は確立されていません。",
        "ko": "6월 캠페인은 역사적입니다. 검토된 출처에는 9월 갱신, 현재 추천 혜택 또는 개인 자격이 확립되지 않았습니다.",
        "tr": "Haziran kampanyası tarihi bir kampanyadır. İncelenen kaynaklarda Eylül ayı yenilemesi, mevcut sevk yardımı veya kişisel uygunluk belirlenmemiştir.",
        "ar": "حملة يونيو تاريخية. لم يتم تحديد أي تجديد لشهر سبتمبر أو فائدة الإحالة الحالية أو الأهلية الشخصية في المصادر التي تمت مراجعتها.",
        "es": "La campaña de junio es histórica. En las fuentes revisadas no se estableció ninguna renovación de septiembre, beneficio de referencia actual o elegibilidad personal.",
        "pt-BR": "A campanha de junho é histórica. Nenhuma renovação de setembro, benefício de referência atual ou elegibilidade pessoal foi estabelecida nas fontes revisadas.",
        "fr": "La campagne de juin est historique. Aucun renouvellement en septembre, aucune prestation de référence actuelle ou éligibilité personnelle n'ont été établis dans les sources examinées.",
        "de": "Die Juni-Kampagne ist historisch. In den überprüften Quellen wurde weder eine Verlängerung im September noch ein aktueller Empfehlungsvorteil noch eine persönliche Berechtigung festgestellt.",
        "ru": "Июньская кампания имеет историческое значение. В рассмотренных источниках не было установлено продление сентября, текущие реферальные льготы или личное право на участие.",
        "id": "Kampanye bulan Juni merupakan kampanye bersejarah. Tidak ada perpanjangan bulan September, manfaat rujukan saat ini, atau kelayakan pribadi yang ditetapkan dalam sumber yang ditinjau.",
        "vi": "Chiến dịch tháng Sáu mang tính lịch sử. Không có sự gia hạn tháng 9, lợi ích giới thiệu hiện tại hoặc tính đủ điều kiện cá nhân được thiết lập trong các nguồn được xem xét.",
        "it": "La campagna di giugno è storica. Nelle fonti esaminate non è stato stabilito alcun rinnovo di settembre, alcun beneficio di riferimento attuale o idoneità personale.",
        // l10n: needs native review
        "ur": "جون مہم تاریخی ہے۔ جائزہ شدہ ذرائع میں ستمبر کی تجدید، موجودہ ریفرل فائدہ یا ذاتی اہلیت ثابت نہیں ہوئی۔",
        // l10n: needs native review
        "uk": "Червнева кампанія є історичною. У перевірених джерелах не встановлено вересневого поновлення, поточної реферальної вигоди або особистої придатності."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/ریجن اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Для цієї конкретної пропозиції не встановлено повний список придатності країн/регіонів."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ لا يعني عدم وجود KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ماخذ قابل اطلاق شناختی تصدیق کا تقاضا قائم نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; порожнє значення не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مہم کی کوئی قطعی مدت تصدیق شدہ نہیں ہے؛ صرف پڑھنے کے قابل صفحہ پیشکش فعال ہونے کو ثابت نہیں کر سکتا۔",
          // l10n: needs native review
          "uk": "Повне абсолютне вікно кампанії не підтверджено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "The June campaign is historical. No September renewal, current referral benefit or personal eligibility was established in the reviewed sources.",
          "zh-Hans": "6 月活动已属历史；本次来源没有证明 9 月续期、当前邀请优惠或个人参与资格。",
          "zh-Hant": "6 月活動已屬歷史；本次來源沒有證明 9 月續期、目前邀請優惠或個人參與資格。",
          "ja": "6 月のキャンペーンは歴史的なものです。レビューされた情報源では、9 月の更新、現在の紹介特典、または個人の資格は確立されていません。",
          "ko": "6월 캠페인은 역사적입니다. 검토된 출처에는 9월 갱신, 현재 추천 혜택 또는 개인 자격이 확립되지 않았습니다.",
          "tr": "Haziran kampanyası tarihi bir kampanyadır. İncelenen kaynaklarda Eylül ayı yenilemesi, mevcut sevk yardımı veya kişisel uygunluk belirlenmemiştir.",
          "ar": "حملة يونيو تاريخية. لم يتم تحديد أي تجديد لشهر سبتمبر أو فائدة الإحالة الحالية أو الأهلية الشخصية في المصادر التي تمت مراجعتها.",
          "es": "La campaña de junio es histórica. En las fuentes revisadas no se estableció ninguna renovación de septiembre, beneficio de referencia actual o elegibilidad personal.",
          "pt-BR": "A campanha de junho é histórica. Nenhuma renovação de setembro, benefício de referência atual ou elegibilidade pessoal foi estabelecida nas fontes revisadas.",
          "fr": "La campagne de juin est historique. Aucun renouvellement en septembre, aucune prestation de référence actuelle ou éligibilité personnelle n'ont été établis dans les sources examinées.",
          "de": "Die Juni-Kampagne ist historisch. In den überprüften Quellen wurde weder eine Verlängerung im September noch ein aktueller Empfehlungsvorteil noch eine persönliche Berechtigung festgestellt.",
          "ru": "Июньская кампания имеет историческое значение. В рассмотренных источниках не было установлено продление сентября, текущие реферальные льготы или личное право на участие.",
          "id": "Kampanye bulan Juni merupakan kampanye bersejarah. Tidak ada perpanjangan bulan September, manfaat rujukan saat ini, atau kelayakan pribadi yang ditetapkan dalam sumber yang ditinjau.",
          "vi": "Chiến dịch tháng Sáu mang tính lịch sử. Không có sự gia hạn tháng 9, lợi ích giới thiệu hiện tại hoặc tính đủ điều kiện cá nhân được thiết lập trong các nguồn được xem xét.",
          "it": "La campagna di giugno è storica. Nelle fonti esaminate non è stato stabilito alcun rinnovo di settembre, alcun beneficio di riferimento attuale o idoneità personale.",
          // l10n: needs native review
          "ur": "جون کی مہم تاریخی ہے۔ جائزہ شدہ ذرائع میں ستمبر کی تجدید، موجودہ ریفرل فائدہ یا ذاتی اہلیت ثابت نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Червнева кампанія є історичною. У переглянутих джерелах не встановлено вересневе поновлення, поточну реферальну вигоду або персональну придатність."
        }
      ]
    }
  },
  "gmx": {
    "summary": {
      "en": "GMX v2 referral benefits reduce qualifying opening/closing fees at execution; they do not reduce every cost or create cash rewards.",
      "zh-Hans": "GMX v2 邀请利益在成交时减免合资格开平仓费用，不涵盖所有成本，也不产生现金注册礼。",
      "zh-Hant": "GMX v2 邀請利益在成交時減免合資格開平倉費用，不涵蓋所有成本，也不產生現金註冊禮。",
      "ja": "GMX v2 紹介特典により、実行時の適格な開始/終了手数料が削減されます。すべてのコストを削減したり、現金の報酬を生み出したりするわけではありません。",
      "ko": "GMX v2 추천 혜택은 실행 시 적격 개시/마감 수수료를 줄여줍니다. 모든 비용을 줄이거나 현금 보상을 창출하지는 않습니다.",
      "tr": "GMX v2 yönlendirme avantajları, uygulama sırasında uygun açılış/kapanış ücretlerini azaltır; her maliyeti düşürmezler veya nakit ödüller yaratmazlar.",
      "ar": "تعمل فوائد إحالة GMX v2 على تقليل رسوم الافتتاح/الإغلاق المؤهلة عند التنفيذ؛ فهي لا تقلل من كل التكاليف أو تخلق مكافآت نقدية.",
      "es": "Los beneficios de referencia de GMX v2 reducen las tarifas de apertura/cierre calificadas en el momento de la ejecución; no reducen todos los costos ni crean recompensas en efectivo.",
      "pt-BR": "Os benefícios de indicação do GMX v2 reduzem as taxas de abertura/fechamento qualificadas na execução; eles não reduzem todos os custos nem criam recompensas em dinheiro.",
      "fr": "Les avantages du parrainage GMX v2 réduisent les frais d'ouverture/clôture admissibles à l'exécution ; ils ne réduisent pas tous les coûts ni ne créent de récompenses en espèces.",
      "de": "Die Empfehlungsvorteile von GMX v2 reduzieren die qualifizierenden Eröffnungs-/Abschlussgebühren bei der Ausführung; Sie reduzieren nicht alle Kosten und schaffen keine Geldprämien.",
      "ru": "Реферальные преимущества GMX v2 снижают соответствующие комиссии за открытие/закрытие при исполнении; они не сокращают все затраты и не создают денежного вознаграждения.",
      "id": "Manfaat rujukan GMX v2 mengurangi biaya pembukaan/penutupan yang memenuhi syarat pada saat pelaksanaan; mereka tidak mengurangi setiap biaya atau menciptakan imbalan uang tunai.",
      "vi": "Lợi ích giới thiệu GMX v2 giảm phí mở/đóng đủ điều kiện khi thực hiện; chúng không giảm mọi chi phí hoặc tạo ra phần thưởng bằng tiền mặt.",
      "it": "I vantaggi del referral GMX v2 riducono le commissioni di apertura/chiusura qualificanti al momento dell'esecuzione; non riducono tutti i costi né creano premi in denaro.",
      // l10n: needs native review
      "ur": "GMX v2 ریفرل فوائد عمل درآمد پر اہل اوپننگ/کلوزنگ فیس کم کرتے ہیں؛ وہ ہر لاگت کم نہیں کرتے اور نقد انعامات پیدا نہیں کرتے۔",
      // l10n: needs native review
      "uk": "GMX v2 реферальні вигоди зменшують придатні комісії відкриття/закриття під час виконання; вони не зменшують кожну вартість і не створюють грошові винагороди."
    },
    "signupReward": {
      "summary": {
        "en": "The documented trader discount is 5% at tier 1 and 10% at tiers 2–3. Borrowing and funding fees are excluded; governance may change the rules.",
        "zh-Hans": "文档交易者折扣为一级 5%、二至三级 10%。借款费与资金费不在折扣范围内；治理可能调整规则。",
        "zh-Hant": "文件交易者折扣為一級 5%、二至三級 10%。借款費與資金費不在折扣範圍內；治理可能調整規則。",
        "ja": "文書化されたトレーダー割引は Tier 1 で 5%、Tier 2～3 で 10% です。借入手数料と資金調達料は対象外で、ガバナンスによりルールが変更される場合があります。",
        "ko": "문서화된 트레이더 할인은 1등급 5%, 2~3등급 10%입니다. 차입 수수료와 펀딩비는 제외되며, 거버넌스가 규칙을 변경할 수 있습니다.",
        "tr": "Belgelenen trader indirimi 1. kademede %5, 2-3. kademelerde %10'dur. Borçlanma ücretleri ve fonlama ücretleri hariçtir; yönetişim kuralları değiştirebilir.",
        "ar": "خصم المتداول الموثق هو 5% في المستوى 1 و10% في المستويين 2–3. رسوم الاقتراض ورسوم التمويل مستبعدة؛ وقد تغير الحوكمة القواعد.",
        "es": "El descuento documentado para traders es del 5 % en el nivel 1 y del 10 % en los niveles 2–3. Se excluyen las comisiones de préstamo y las comisiones de financiación; la gobernanza puede cambiar las reglas.",
        "pt-BR": "O desconto documentado para traders é de 5% no nível 1 e 10% nos níveis 2–3. Taxas de empréstimo e taxas de funding estão excluídas; a governança pode alterar as regras.",
        "fr": "La remise documentée pour les traders est de 5 % au niveau 1 et de 10 % aux niveaux 2–3. Les frais d'emprunt et les frais de financement sont exclus ; la gouvernance peut modifier les règles.",
        "de": "Der dokumentierte Trader-Rabatt beträgt 5 % auf Stufe 1 und 10 % auf Stufen 2–3. Borrowing-Gebühren und Funding-Gebühren sind ausgeschlossen; Governance kann die Regeln ändern.",
        "ru": "Задокументированная скидка трейдера составляет 5% на уровне 1 и 10% на уровнях 2–3. Комиссии за заимствование и комиссии фондирования исключены; управление может изменить правила.",
        "id": "Diskon trader yang terdokumentasi adalah 5% pada tingkat 1 dan 10% pada tingkat 2–3. Biaya borrowing dan biaya funding dikecualikan; tata kelola dapat mengubah aturan.",
        "vi": "Mức giảm phí cho trader được ghi nhận là 5% ở cấp 1 và 10% ở cấp 2–3. Phí vay và phí funding bị loại trừ; cơ chế quản trị có thể thay đổi quy tắc.",
        "it": "Lo sconto documentato per i trader è del 5% al livello 1 e del 10% ai livelli 2–3. Sono escluse le commissioni di borrowing e le commissioni di funding; la governance può modificare le regole.",
        // l10n: needs native review
        "ur": "دستاویزی ٹریڈر رعایت درجہ 1 پر 5% اور درجات 2–3 پر 10% ہے۔ قرض لینے اور فنڈنگ فیسیں خارج ہیں؛ گورننس قواعد بدل سکتی ہے۔",
        // l10n: needs native review
        "uk": "Задокументована знижка для трейдера становить 5% на рівень 1 і 10% на рівні 2–3. Комісії за запозичення та фінансування виключені; врядування може змінити правила."
      },
      "conditions": [
        {
          "en": "For v2, use a valid case-sensitive code; it is saved on-chain with the first qualifying order.",
          "zh-Hans": "v2 需使用区分大小写的有效代码，首个合资格订单会将其写入链上。",
          "zh-Hant": "v2 需使用區分大小寫的有效代碼，首個合資格訂單會將其寫入鏈上。",
          "ja": "v2 の場合は、大文字と小文字を区別する有効なコードを使用してください。それは最初の条件を満たす注文とともにオンチェーンに保存されます。",
          "ko": "v2의 경우 대소문자를 구분하는 유효한 코드를 사용하세요. 첫 번째 적격 주문으로 체인에 저장됩니다.",
          "tr": "v2 için geçerli ve büyük/küçük harfe duyarlı bir kod kullanın; kod, ilk geçerli emirle birlikte zincire kaydedilir.",
          "ar": "بالنسبة للإصدار 2، استخدم رمزًا صالحًا حساسًا لحالة الأحرف؛ يتم حفظه على السلسلة مع أول أمر مؤهل.",
          "es": "Para v2, utilice un código válido que distinga entre mayúsculas y minúsculas; se guarda en cadena con el primer pedido calificado.",
          "pt-BR": "Para v2, use um código válido que diferencie maiúsculas de minúsculas; ele é salvo na rede com o primeiro pedido qualificado.",
          "fr": "Pour la version 2, utilisez un code valide, sensible à la casse ; il est enregistré en chaîne avec la première commande éligible.",
          "de": "Verwenden Sie für Version 2 einen gültigen Code, bei dem die Groß-/Kleinschreibung beachtet werden muss. Es wird mit der ersten qualifizierten Bestellung in der Kette gespeichert.",
          "ru": "Для версии 2 используйте действительный код с учетом регистра; он сохраняется в цепочке вместе с первым подходящим заказом.",
          "id": "Untuk v2, gunakan kode peka huruf besar-kecil yang valid; itu disimpan secara on-chain dengan urutan kualifikasi pertama.",
          "vi": "Đối với v2, hãy sử dụng mã phân biệt chữ hoa chữ thường hợp lệ; nó được lưu trên chuỗi với đơn hàng đủ điều kiện đầu tiên.",
          "it": "Per v2, utilizzare un codice valido con distinzione tra maiuscole e minuscole; viene salvato in catena con il primo ordine qualificante.",
          // l10n: needs native review
          "ur": "v2 کے لیے درست کیس حساس کوڈ استعمال کریں؛ یہ پہلے اہل آرڈر کے ساتھ آن چین محفوظ ہوتا ہے۔",
          // l10n: needs native review
          "uk": "Для v2 використовуйте дійсний код із чутливістю до регістру; він зберігається ончейн з першим придатним ордером."
        },
        {
          "en": "Confirm the code's tier and keep position fees separate from borrowing and funding costs.",
          "zh-Hans": "确认代码等级，并将开平仓手续费与借款费、资金费分开计算。",
          "zh-Hant": "確認代碼等級，並將開平倉手續費與借款費、資金費分開計算。",
          "ja": "コードのティアを確認し、ポジション手数料を借入コストや資金調達料と分けてください。",
          "ko": "코드 등급을 확인하고 포지션 수수료를 차입 비용 및 펀딩비와 분리해 계산하세요.",
          "tr": "Kodun kademesini doğrulayın ve pozisyon ücretlerini borçlanma maliyetleri ile fonlama ücretlerinden ayrı tutun.",
          "ar": "أكد فئة الرمز، وافصل رسوم المركز عن تكاليف الاقتراض ورسوم التمويل.",
          "es": "Confirme el nivel del código y mantenga las comisiones de posición separadas de los costes de préstamo y de las comisiones de financiación.",
          "pt-BR": "Confirme o nível do código e mantenha as taxas de posição separadas dos custos de empréstimo e das taxas de funding.",
          "fr": "Confirmez le niveau du code et séparez les frais de position des coûts d'emprunt et des frais de financement.",
          "de": "Bestätigen Sie die Stufe des Codes und trennen Sie Positionsgebühren von Borrowing-Kosten und Funding-Gebühren.",
          "ru": "Подтвердите уровень кода и отделяйте комиссии за позицию от затрат на заимствование и комиссий фондирования.",
          "id": "Konfirmasi tingkatan kode dan pisahkan biaya posisi dari biaya borrowing serta biaya funding.",
          "vi": "Xác nhận cấp mã và tách phí vị thế khỏi chi phí vay cũng như phí funding.",
          "it": "Conferma il livello del codice e tieni separate le commissioni di posizione dai costi di borrowing e dalle commissioni di funding.",
          // l10n: needs native review
          "ur": "کوڈ کا درجہ تصدیق کریں اور پوزیشن فیسیں کو قرض اور فنڈنگ اخراجات سے الگ رکھیں۔",
          // l10n: needs native review
          "uk": "Підтвердьте рівень коду й тримайте комісії позиції окремо від запозичення і фінансування витрати."
        },
        {
          "en": "Do not apply old v1 rebate or ended esGMX bonus terms to new v2 orders.",
          "zh-Hans": "不要将旧 v1 返佣或已结束的 esGMX 赠送条款套用于新的 v2 订单。",
          "zh-Hant": "不要將舊 v1 返佣或已結束的 esGMX 贈送條款套用於新的 v2 訂單。",
          "ja": "古い v1 リベートまたは終了した esGMX ボーナス条件を新しい v2 注文に適用しないでください。",
          "ko": "새로운 v2 주문에 이전 v1 리베이트 또는 종료된 esGMX 보너스 조건을 적용하지 마십시오.",
          "tr": "Yeni v2 siparişlerine eski v1 indirimini veya sona eren esGMX bonus koşullarını uygulamayın.",
          "ar": "لا تقم بتطبيق خصم الإصدار 1 القديم أو شروط مكافآت esGMX المنتهية على طلبات الإصدار 2 الجديدة.",
          "es": "No aplique el reembolso de la versión 1 anterior ni los términos de bonificación de esGMX finalizados a pedidos nuevos de la versión 2.",
          "pt-BR": "Não aplique descontos antigos da v1 ou termos de bônus esGMX encerrados a novos pedidos da v2.",
          "fr": "N'appliquez pas l'ancienne remise v1 ou les conditions de bonus esGMX terminées aux nouvelles commandes v2.",
          "de": "Wenden Sie alte v1-Rabattbedingungen oder abgelaufene esGMX-Bonusbedingungen nicht auf neue v2-Bestellungen an.",
          "ru": "Не применяйте старые скидки версии 1 или прекращенные условия бонуса esGMX к новым заказам версии 2.",
          "id": "Jangan terapkan rabat v1 lama atau ketentuan bonus esGMX yang telah berakhir pada pesanan v2 baru.",
          "vi": "Không áp dụng giảm giá v1 cũ hoặc các điều khoản thưởng esGMX đã kết thúc cho các đơn đặt hàng v2 mới.",
          "it": "Non applicare il vecchio sconto v1 o i termini del bonus esGMX scaduti ai nuovi ordini v2.",
          // l10n: needs native review
          "ur": "پرانا v1 ریبیٹ یا ختم شدہ esGMX بونس شرائط کو نئے v2 آرڈرز پر لاگو نہ کریں۔",
          // l10n: needs native review
          "uk": "Не застосовуйте старий ребейт v1 або завершені умови бонусу esGMX до нових ордерів v2."
        }
      ]
    },
    "sources": {
      "gmx-referrals-v2": {
        "summary": {
          "en": "The page distinguishes v2 execution-time discounts from inactive v1 rewards; additional esGMX bonuses ended on 4 February 2026.",
          "zh-Hans": "页面区分 v2 成交时折扣与不再发放的 v1 奖励，额外 esGMX 赠送于 2026 年 2 月 4 日结束。",
          "zh-Hant": "頁面區分 v2 成交時折扣與不再發放的 v1 獎勵，額外 esGMX 贈送於 2026 年 2 月 4 日結束。",
          "ja": "このページでは、v2 実行時の割引と非アクティブな v1 の特典を区別します。追加の esGMX ボーナスは 2026 年 2 月 4 日に終了しました。",
          "ko": "이 페이지에서는 v2 실행 시간 할인과 비활성 v1 보상을 구분합니다. 추가 esGMX 보너스는 2026년 2월 4일에 종료되었습니다.",
          "tr": "Sayfa, v2 yürütme süresi indirimlerini etkin olmayan v1 ödüllerinden ayırır; ek esGMX bonusları 4 Şubat 2026'da sona erdi.",
          "ar": "تميز الصفحة بين خصومات وقت التنفيذ v2 ومكافآت v1 غير النشطة؛ انتهت مكافآت esGMX الإضافية في 4 فبراير 2026.",
          "es": "La página distingue los descuentos por tiempo de ejecución v2 de las recompensas inactivas v1; Las bonificaciones adicionales de esGMX finalizaron el 4 de febrero de 2026.",
          "pt-BR": "A página distingue descontos em tempo de execução v2 de recompensas inativas v1; bônus esGMX adicionais terminaram em 4 de fevereiro de 2026.",
          "fr": "La page distingue les remises sur le temps d'exécution de la v2 des récompenses v1 inactives ; les bonus esGMX supplémentaires ont pris fin le 4 février 2026.",
          "de": "Auf der Seite wird zwischen Rabatten für die Ausführungszeit der Version 2 und inaktiven Belohnungen der Version 1 unterschieden. zusätzliche esGMX-Boni endeten am 4. Februar 2026.",
          "ru": "На странице различаются скидки на время выполнения версии 2 и неактивные вознаграждения версии 1; Дополнительные бонусы esGMX закончились 4 февраля 2026 года.",
          "id": "Halaman ini membedakan diskon waktu eksekusi v2 dari hadiah v1 yang tidak aktif; bonus esGMX tambahan berakhir pada 4 Februari 2026.",
          "vi": "Trang này phân biệt chiết khấu trong thời gian thực hiện v2 với phần thưởng v1 không hoạt động; phần thưởng esGMX bổ sung đã kết thúc vào ngày 4 tháng 2 năm 2026.",
          "it": "La pagina distingue gli sconti sul tempo di esecuzione v2 dai premi v1 inattivi; i bonus aggiuntivi esGMX sono terminati il 4 febbraio 2026.",
          // l10n: needs native review
          "ur": "صفحہ v2 کے عملدرآمد کے وقت ملنے والی رعایتوں کو غیر فعال v1 انعامات سے الگ کرتا ہے؛ اضافی esGMX بونسز 4 فروری 2026 کو ختم ہوئے۔",
          // l10n: needs native review
          "uk": "Сторінка відрізняє знижки v2 під час виконання від неактивних винагород v1; додаткові бонуси esGMX завершилися 4 лютого 2026 року."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "For v2, use a valid case-sensitive code; it is saved on-chain with the first qualifying order.",
        "zh-Hans": "v2 需使用区分大小写的有效代码，首个合资格订单会将其写入链上。",
        "zh-Hant": "v2 需使用區分大小寫的有效代碼，首個合資格訂單會將其寫入鏈上。",
        "ja": "v2 の場合は、大文字と小文字を区別する有効なコードを使用してください。それは最初の条件を満たす注文とともにオンチェーンに保存されます。",
        "ko": "v2의 경우 대소문자를 구분하는 유효한 코드를 사용하세요. 첫 번째 적격 주문으로 체인에 저장됩니다.",
        "tr": "v2 için geçerli ve büyük/küçük harfe duyarlı bir kod kullanın; kod, ilk geçerli emirle birlikte zincire kaydedilir.",
        "ar": "بالنسبة للإصدار 2، استخدم رمزًا صالحًا حساسًا لحالة الأحرف؛ يتم حفظه على السلسلة مع أول أمر مؤهل.",
        "es": "Para v2, utilice un código válido que distinga entre mayúsculas y minúsculas; se guarda en cadena con el primer pedido calificado.",
        "pt-BR": "Para v2, use um código válido que diferencie maiúsculas de minúsculas; ele é salvo na rede com o primeiro pedido qualificado.",
        "fr": "Pour la version 2, utilisez un code valide, sensible à la casse ; il est enregistré en chaîne avec la première commande éligible.",
        "de": "Verwenden Sie für Version 2 einen gültigen Code, bei dem die Groß-/Kleinschreibung beachtet werden muss. Es wird mit der ersten qualifizierten Bestellung in der Kette gespeichert.",
        "ru": "Для версии 2 используйте действительный код с учетом регистра; он сохраняется в цепочке вместе с первым подходящим заказом.",
        "id": "Untuk v2, gunakan kode peka huruf besar-kecil yang valid; itu disimpan secara on-chain dengan urutan kualifikasi pertama.",
        "vi": "Đối với v2, hãy sử dụng mã phân biệt chữ hoa chữ thường hợp lệ; nó được lưu trên chuỗi với đơn hàng đủ điều kiện đầu tiên.",
        "it": "Per v2, utilizzare un codice valido con distinzione tra maiuscole e minuscole; viene salvato in catena con il primo ordine qualificante.",
        // l10n: needs native review
        "ur": "v2 کے لیے درست کیس حساس کوڈ استعمال کریں؛ یہ پہلے اہل آرڈر کے ساتھ آن چین محفوظ ہوتا ہے۔",
        // l10n: needs native review
        "uk": "Для v2 використовуйте дійсний код з урахуванням регістру; він зберігається он-чейн з першим придатним ордером."
      },
      "trading": {
        "en": "Confirm the code's tier and keep position fees separate from borrowing and funding costs.",
        "zh-Hans": "确认代码等级，并将开平仓手续费与借款费、资金费分开计算。",
        "zh-Hant": "確認代碼等級，並將開平倉手續費與借款費、資金費分開計算。",
        "ja": "コードのティアを確認し、ポジション手数料を借入コストや資金調達料と分けてください。",
        "ko": "코드 등급을 확인하고 포지션 수수료를 차입 비용 및 펀딩비와 분리해 계산하세요.",
        "tr": "Kodun kademesini doğrulayın ve pozisyon ücretlerini borçlanma maliyetleri ile fonlama ücretlerinden ayrı tutun.",
        "ar": "أكد فئة الرمز، وافصل رسوم المركز عن تكاليف الاقتراض ورسوم التمويل.",
        "es": "Confirme el nivel del código y mantenga las comisiones de posición separadas de los costes de préstamo y de las comisiones de financiación.",
        "pt-BR": "Confirme o nível do código e mantenha as taxas de posição separadas dos custos de empréstimo e das taxas de funding.",
        "fr": "Confirmez le niveau du code et séparez les frais de position des coûts d'emprunt et des frais de financement.",
        "de": "Bestätigen Sie die Stufe des Codes und trennen Sie Positionsgebühren von Borrowing-Kosten und Funding-Gebühren.",
        "ru": "Подтвердите уровень кода и отделяйте комиссии за позицию от затрат на заимствование и комиссий фондирования.",
        "id": "Konfirmasi tingkatan kode dan pisahkan biaya posisi dari biaya borrowing serta biaya funding.",
        "vi": "Xác nhận cấp mã và tách phí vị thế khỏi chi phí vay cũng như phí funding.",
        "it": "Conferma il livello del codice e tieni separate le commissioni di posizione dai costi di borrowing e dalle commissioni di funding.",
        // l10n: needs native review
        "ur": "کوڈ کا درجہ تصدیق کریں اور پوزیشن فیس کو قرض لینا اور فنڈنگ لاگت سے الگ رکھیں۔",
        // l10n: needs native review
        "uk": "Підтвердьте рівень коду й тримайте комісії позиції окремо від запозичення і фінансування витрат."
      },
      "rewardType": {
        "en": "Discount on specified trading fees",
        "zh-Hans": "指定交易手续费折扣",
        "zh-Hant": "指定交易手續費折扣",
        "ja": "指定取引手数料の割引",
        "ko": "특정 거래 수수료 할인",
        "tr": "Belirtilen işlem ücretlerinde indirim",
        "ar": "خصم على رسوم التداول المحددة",
        "es": "Descuento en tarifas comerciales específicas",
        "pt-BR": "Desconto em taxas de negociação específicas",
        "fr": "Remise sur les frais de négociation spécifiés",
        "de": "Rabatt auf bestimmte Handelsgebühren",
        "ru": "Скидка на указанные торговые комиссии",
        "id": "Diskon biaya perdagangan tertentu",
        "vi": "Giảm phí giao dịch được chỉ định",
        "it": "Sconto sulle commissioni di negoziazione specificate",
        // l10n: needs native review
        "ur": "متعین ٹریڈنگ فیسیں پر رعایت",
        // l10n: needs native review
        "uk": "Знижка на визначені торгівля комісії"
      },
      "maximumConditions": {
        "en": "The documented trader discount is 5% at tier 1 and 10% at tiers 2–3. Borrowing and funding fees are excluded; governance may change the rules.",
        "zh-Hans": "文档交易者折扣为一级 5%、二至三级 10%。借款费与资金费不在折扣范围内；治理可能调整规则。",
        "zh-Hant": "文件交易者折扣為一級 5%、二至三級 10%。借款費與資金費不在折扣範圍內；治理可能調整規則。",
        "ja": "文書化されたトレーダー割引は Tier 1 で 5%、Tier 2～3 で 10% です。借入手数料と資金調達料は対象外で、ガバナンスによりルールが変更される場合があります。",
        "ko": "문서화된 트레이더 할인은 1등급 5%, 2~3등급 10%입니다. 차입 수수료와 펀딩비는 제외되며, 거버넌스가 규칙을 변경할 수 있습니다.",
        "tr": "Belgelenen trader indirimi 1. kademede %5, 2-3. kademelerde %10'dur. Borçlanma ücretleri ve fonlama ücretleri hariçtir; yönetişim kuralları değiştirebilir.",
        "ar": "خصم المتداول الموثق هو 5% في المستوى 1 و10% في المستويين 2–3. رسوم الاقتراض ورسوم التمويل مستبعدة؛ وقد تغير الحوكمة القواعد.",
        "es": "El descuento documentado para traders es del 5 % en el nivel 1 y del 10 % en los niveles 2–3. Se excluyen las comisiones de préstamo y las comisiones de financiación; la gobernanza puede cambiar las reglas.",
        "pt-BR": "O desconto documentado para traders é de 5% no nível 1 e 10% nos níveis 2–3. Taxas de empréstimo e taxas de funding estão excluídas; a governança pode alterar as regras.",
        "fr": "La remise documentée pour les traders est de 5 % au niveau 1 et de 10 % aux niveaux 2–3. Les frais d'emprunt et les frais de financement sont exclus ; la gouvernance peut modifier les règles.",
        "de": "Der dokumentierte Trader-Rabatt beträgt 5 % auf Stufe 1 und 10 % auf Stufen 2–3. Borrowing-Gebühren und Funding-Gebühren sind ausgeschlossen; Governance kann die Regeln ändern.",
        "ru": "Задокументированная скидка трейдера составляет 5% на уровне 1 и 10% на уровнях 2–3. Комиссии за заимствование и комиссии фондирования исключены; управление может изменить правила.",
        "id": "Diskon trader yang terdokumentasi adalah 5% pada tingkat 1 dan 10% pada tingkat 2–3. Biaya borrowing dan biaya funding dikecualikan; tata kelola dapat mengubah aturan.",
        "vi": "Mức giảm phí cho trader được ghi nhận là 5% ở cấp 1 và 10% ở cấp 2–3. Phí vay và phí funding bị loại trừ; cơ chế quản trị có thể thay đổi quy tắc.",
        "it": "Lo sconto documentato per i trader è del 5% al livello 1 e del 10% ai livelli 2–3. Sono escluse le commissioni di borrowing e le commissioni di funding; la governance può modificare le regole.",
        // l10n: needs native review
        "ur": "دستاویزی ٹریڈر ڈسکاؤنٹ درجہ 1 پر 5% اور درجات 2–3 پر 10% ہے۔ قرض لینا اور فنڈنگ فیس خارج ہیں؛ گورننس قواعد بدل سکتی ہے۔",
        // l10n: needs native review
        "uk": "Задокументована знижка трейдера становить 5% на рівень 1 і 10% на рівні 2–3. Комісії запозичення і фінансування виключені; управління може змінити правила."
      },
      "limitations": {
        "en": "Do not apply old v1 rebate or ended esGMX bonus terms to new v2 orders.",
        "zh-Hans": "不要将旧 v1 返佣或已结束的 esGMX 赠送条款套用于新的 v2 订单。",
        "zh-Hant": "不要將舊 v1 返佣或已結束的 esGMX 贈送條款套用於新的 v2 訂單。",
        "ja": "古い v1 リベートまたは終了した esGMX ボーナス条件を新しい v2 注文に適用しないでください。",
        "ko": "새로운 v2 주문에 이전 v1 리베이트 또는 종료된 esGMX 보너스 조건을 적용하지 마십시오.",
        "tr": "Yeni v2 siparişlerine eski v1 indirimini veya sona eren esGMX bonus koşullarını uygulamayın.",
        "ar": "لا تقم بتطبيق خصم الإصدار 1 القديم أو شروط مكافآت esGMX المنتهية على طلبات الإصدار 2 الجديدة.",
        "es": "No aplique el reembolso de la versión 1 anterior ni los términos de bonificación de esGMX finalizados a pedidos nuevos de la versión 2.",
        "pt-BR": "Não aplique descontos antigos da v1 ou termos de bônus esGMX encerrados a novos pedidos da v2.",
        "fr": "N'appliquez pas l'ancienne remise v1 ou les conditions de bonus esGMX terminées aux nouvelles commandes v2.",
        "de": "Wenden Sie alte v1-Rabattbedingungen oder abgelaufene esGMX-Bonusbedingungen nicht auf neue v2-Bestellungen an.",
        "ru": "Не применяйте старые скидки версии 1 или прекращенные условия бонуса esGMX к новым заказам версии 2.",
        "id": "Jangan terapkan rabat v1 lama atau ketentuan bonus esGMX yang telah berakhir pada pesanan v2 baru.",
        "vi": "Không áp dụng giảm giá v1 cũ hoặc các điều khoản thưởng esGMX đã kết thúc cho các đơn đặt hàng v2 mới.",
        "it": "Non applicare il vecchio sconto v1 o i termini del bonus esGMX scaduti ai nuovi ordini v2.",
        // l10n: needs native review
        "ur": "پرانا v1 ریبیٹ یا ختم شدہ esGMX بونس شرائط نئے v2 آرڈرز پر لاگو نہ کریں۔",
        // l10n: needs native review
        "uk": "Не застосовуйте старі v1 ребейт або завершені умови бонусу esGMX до нових v2 ордерів."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ وعدم ورود القيمة (null) لا يعني عدم اشتراط KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ذریعہ لاگو شناختی تصدیق کی شرط ثابت نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; null не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مکمل قطعی مہم مدت تصدیق نہیں ہوئی؛ صرف قابل مطالعہ صفحہ یہ ثابت نہیں کر سکتا کہ پیشکش فعال ہے۔",
          // l10n: needs native review
          "uk": "Повне точне вікно кампанії не перевірено; сама читабельна сторінка не може встановити, що пропозиція активна."
        }
      ]
    }
  },
  "drift": {
    "summary": {
      "en": "The reviewed Drift notice discusses recovery of outstanding user losses and a protocol reboot. It does not verify normal current trading or deposit availability.",
      "zh-Hans": "本次读取的 Drift 公告讨论用户未补偿损失的恢复与协议重启，不能据此证明当前交易或充值正常可用。",
      "zh-Hant": "本次讀取的 Drift 公告討論用戶未補償損失的恢復與協議重啟，不能據此證明目前交易或儲值正常可用。",
      "ja": "レビューされたドリフト通知では、未解決のユーザー損失の回復とプロトコルの再起動について説明されています。通常の現在の取引や預金の利用可能性を確認するものではありません。",
      "ko": "검토된 Drift 공지에서는 미해결 사용자 손실 복구 및 프로토콜 재부팅에 대해 논의합니다. 정상적인 현재 거래 또는 예금 가용성을 확인하지 않습니다.",
      "tr": "İncelenen Drift bildirimi, olağanüstü kullanıcı kayıplarının kurtarılmasını ve protokolün yeniden başlatılmasını tartışıyor. Normal mevcut ticareti veya mevduat kullanılabilirliğini doğrulamaz.",
      "ar": "يناقش إشعار Drift الذي تمت مراجعته استرداد خسائر المستخدم المعلقة وإعادة تشغيل البروتوكول. ولا يتحقق من التداول الحالي العادي أو توافر الودائع.",
      "es": "El aviso de Drift revisado analiza la recuperación de pérdidas pendientes de usuarios y el reinicio del protocolo. No verifica la disponibilidad normal actual de operaciones o depósitos.",
      "pt-BR": "O aviso de Drift revisado discute a recuperação de perdas pendentes de usuários e uma reinicialização do protocolo. Ele não verifica a negociação atual normal ou a disponibilidade de depósitos.",
      "fr": "L'avis Drift examiné traite de la récupération des pertes d'utilisateurs en suspens et d'un redémarrage du protocole. Il ne vérifie pas les échanges courants normaux ni la disponibilité des dépôts.",
      "de": "In der überprüften Drift-Mitteilung werden die Wiederherstellung ausstehender Benutzerverluste und ein Protokollneustart erörtert. Es überprüft nicht den normalen aktuellen Handel oder die Verfügbarkeit von Einlagen.",
      "ru": "В рассмотренном объявлении Drift обсуждается компенсация невозмещенных потерь пользователей и перезапуск протокола. Оно не подтверждает нормальное ведение торговли или доступность депозитов в настоящее время.",
      "id": "Pengumuman Drift yang ditinjau membahas pemulihan kerugian pengguna yang belum terselesaikan dan peluncuran ulang protokol. Hal ini tidak mengonfirmasi ketersediaan perdagangan atau deposit normal saat ini.",
      "vi": "Thông báo Drift được xem xét thảo luận về việc khôi phục những tổn thất còn tồn đọng của người dùng và khởi động lại giao thức. Nó không xác minh tính khả dụng của giao dịch hiện tại hoặc tiền gửi thông thường.",
      "it": "L'avviso Drift esaminato discute il recupero delle perdite di utenti in sospeso e il riavvio del protocollo. Non verifica il normale scambio corrente o la disponibilità dei depositi.",
      // l10n: needs native review
      "ur": "جائزہ شدہ Drift نوٹس بقایا صارف نقصانات کی ریکوری اور پروٹوکول ری بوٹ پر بات کرتا ہے۔ یہ معمول کی موجودہ ٹریڈنگ یا ڈپازٹ دستیابی کی تصدیق نہیں کرتا۔",
      // l10n: needs native review
      "uk": "Перевірене повідомлення Drift стосується відшкодування непогашених втрат користувачів і перезапуску протоколу. Воно не підтверджує нормальну поточну торгівлю або доступність депозитів."
    },
    "signupReward": {
      "summary": {
        "en": "Current service access and reward eligibility require fresh official confirmation. Old referral or points posts are not evidence of an active offer.",
        "zh-Hans": "当前服务可用性与奖励资格需重新通过官方确认，旧邀请或积分文章不能证明活动仍有效。",
        "zh-Hant": "目前服務可用性與獎勵資格需重新透過官方確認，舊邀請或積分文章不能證明活動仍有效。",
        "ja": "現在のサービスへのアクセスと特典の資格については、新たな公式確認が必要です。古い紹介やポイントの投稿は、アクティブなオファーの証拠ではありません。",
        "ko": "현재 서비스 이용 및 보상 자격은 새로운 공식 확인이 필요합니다. 이전 추천 또는 포인트 게시물은 활성 제안의 증거가 아닙니다.",
        "tr": "Mevcut hizmet erişimi ve ödül uygunluğu, yeni resmi onay gerektirir. Eski yönlendirme veya puan gönderileri aktif bir teklifin kanıtı değildir.",
        "ar": "يتطلب الوصول إلى الخدمة الحالية وأهلية المكافأة تأكيدًا رسميًا جديدًا. لا تعتبر منشورات الإحالة أو النقاط القديمة دليلاً على وجود عرض نشط.",
        "es": "El acceso actual al servicio y la elegibilidad para las recompensas requieren una nueva confirmación oficial. Las publicaciones antiguas de referencias o puntos no son evidencia de una oferta activa.",
        "pt-BR": "O acesso ao serviço atual e a elegibilidade para recompensas exigem uma nova confirmação oficial. Postagens antigas de referências ou pontos não são evidência de uma oferta ativa.",
        "fr": "L’accès actuel au service et l’éligibilité aux récompenses nécessitent une nouvelle confirmation officielle. Les anciennes publications de références ou de points ne constituent pas une preuve d’une offre active.",
        "de": "Der aktuelle Servicezugang und die Prämienberechtigung erfordern eine neue offizielle Bestätigung. Alte Empfehlungs- oder Punktebeiträge sind kein Beweis für ein aktives Angebot.",
        "ru": "Текущий доступ к услугам и право на вознаграждение требуют нового официального подтверждения. Старые сообщения о рефералах или баллах не являются свидетельством активного предложения.",
        "id": "Akses layanan saat ini dan kelayakan hadiah memerlukan konfirmasi resmi baru. Postingan rujukan atau poin lama bukan merupakan bukti penawaran aktif.",
        "vi": "Việc truy cập dịch vụ hiện tại và khả năng đủ điều kiện nhận phần thưởng cần có xác nhận chính thức mới. Các bài đăng giới thiệu hoặc điểm cũ không phải là bằng chứng của một ưu đãi đang hoạt động.",
        "it": "L'attuale accesso al servizio e l'idoneità al premio richiedono una nuova conferma ufficiale. I vecchi post di riferimento o di punti non sono prova di un'offerta attiva.",
        // l10n: needs native review
        "ur": "موجودہ سروس رسائی اور انعامی اہلیت کے لیے تازہ سرکاری تصدیق چاہیے۔ پرانی ریفرل یا پوائنٹس پوسٹس فعال پیشکش کا ثبوت نہیں۔",
        // l10n: needs native review
        "uk": "Поточний доступ до сервісу й придатність до винагороди потребують свіжого офіційного підтвердження. Старі реферальні або бальні пости не є доказом активної пропозиції."
      },
      "conditions": [
        {
          "en": "Read current recovery and service notices before considering a deposit.",
          "zh-Hans": "考虑充值前先查看最新恢复与服务公告。",
          "zh-Hant": "考慮儲值前先查看最新恢復與服務公告。",
          "ja": "デポジットを検討する前に、現在の回収とサービスに関する通知をお読みください。",
          "ko": "보증금을 고려하기 전에 현재 복구 및 서비스 공지를 읽어보십시오.",
          "tr": "Para yatırmayı düşünmeden önce güncel kurtarma ve hizmet bildirimlerini okuyun.",
          "ar": "اقرأ إشعارات الاسترداد والخدمة الحالية قبل التفكير في الإيداع.",
          "es": "Lea los avisos de recuperación y servicio actuales antes de considerar un depósito.",
          "pt-BR": "Leia os avisos atuais de recuperação e serviço antes de considerar um depósito.",
          "fr": "Lisez les avis de récupération et de service actuels avant d’envisager un dépôt.",
          "de": "Lesen Sie die aktuellen Wiederherstellungs- und Servicehinweise, bevor Sie eine Anzahlung in Betracht ziehen.",
          "ru": "Прежде чем рассматривать возможность внесения депозита, прочтите текущие уведомления о восстановлении и обслуживании.",
          "id": "Baca pemberitahuan pemulihan dan layanan terkini sebelum mempertimbangkan deposit.",
          "vi": "Đọc các thông báo phục hồi và dịch vụ hiện tại trước khi xem xét đặt cọc.",
          "it": "Leggi gli attuali avvisi di recupero e servizio prima di prendere in considerazione un deposito.",
          // l10n: needs native review
          "ur": "ڈپازٹ پر غور کرنے سے پہلے موجودہ ریکوری اور سروس نوٹسز پڑھیں۔",
          // l10n: needs native review
          "uk": "Прочитайте поточний відшкодування і повідомлення сервісу перед розглядом депозит."
        },
        {
          "en": "Do not infer a relaunch date from a recovery roadmap without an explicit official date.",
          "zh-Hans": "官方未明确日期时，不从恢复路线图推断重启时间。",
          "zh-Hant": "官方未明確日期時，不從恢復路線圖推斷重啟時間。",
          "ja": "明確な公式日付なしに、復旧ロードマップから再起動日を推測しないでください。",
          "ko": "명시적인 공식 날짜 없이 복구 로드맵에서 재출시 날짜를 추론하지 마세요.",
          "tr": "Açık bir resmi tarih olmadan, kurtarma yol haritasından yeniden lansman tarihi çıkarmayın.",
          "ar": "لا تستنتج تاريخ إعادة التشغيل من خريطة طريق التعافي دون تاريخ رسمي واضح.",
          "es": "No infiera una fecha de relanzamiento de una hoja de ruta de recuperación sin una fecha oficial explícita.",
          "pt-BR": "Não deduza uma data de relançamento a partir de um roteiro de recuperação sem uma data oficial explícita.",
          "fr": "Ne déduisez pas une date de relance d’une feuille de route de reprise sans une date officielle explicite.",
          "de": "Leiten Sie aus einer Wiederherstellungs-Roadmap kein Relaunch-Datum ohne explizites offizielles Datum ab.",
          "ru": "Не делайте вывод о дате перезапуска из плана восстановления без явной официальной даты.",
          "id": "Jangan menyimpulkan tanggal peluncuran kembali dari peta jalan pemulihan tanpa tanggal resmi yang jelas.",
          "vi": "Không suy ra ngày khởi động lại từ lộ trình khôi phục mà không có ngày chính thức rõ ràng.",
          "it": "Non dedurre una data di rilancio da una tabella di marcia per la ripresa senza una data ufficiale esplicita.",
          // l10n: needs native review
          "ur": "واضح سرکاری تاریخ کے بغیر ریکوری روڈ میپ سے دوبارہ آغاز تاریخ اخذ نہ کریں۔",
          // l10n: needs native review
          "uk": "Не виводьте дату повторного запуску з дорожньої карти відновлення без явної офіційної дати."
        },
        {
          "en": "Reconfirm the official application and documentation destination; the documentation URL redirected during this check.",
          "zh-Hans": "重新确认官方应用与文档目标域名，本次检查发现文档地址发生重定向。",
          "zh-Hant": "重新確認官方應用程式與文件目標網域，本次檢查發現文件網址發生重新導向。",
          "ja": "正式な申請書と書類の宛先を再確認します。このチェック中にリダイレクトされたドキュメント URL。",
          "ko": "공식 신청서와 서류 목적지를 다시 확인하세요. 이 확인 중에 리디렉션된 문서 URL입니다.",
          "tr": "Resmi başvuru ve belge varış yerini yeniden onaylayın; bu kontrol sırasında yönlendirilen dokümantasyon URL'si.",
          "ar": "أعد تأكيد الوجهة الرسمية للتطبيق والوثائق؛ علماً بأن رابط الوثائق قد أجرى إعادة توجيه أثناء هذا الفحص.",
          "es": "Reconfirmar el destino oficial de la solicitud y documentación; la URL de la documentación redirigida durante esta verificación.",
          "pt-BR": "Reconfirmar o destino oficial do pedido e da documentação; o URL da documentação redirecionado durante esta verificação.",
          "fr": "Reconfirmez la demande officielle et la destination de la documentation ; l'URL de la documentation redirigée lors de cette vérification.",
          "de": "Bestätigen Sie den offiziellen Bestimmungsort des Antrags und der Dokumentation erneut. Die bei dieser Prüfung umgeleitete Dokumentations-URL.",
          "ru": "Повторно проверьте официальный адрес приложения и документации; в ходе данной проверки URL-адрес документации был перенаправлен.",
          "id": "Konfirmasikan kembali tujuan aplikasi dan dokumentasi resmi; URL dokumentasi dialihkan selama pemeriksaan ini.",
          "vi": "Xác nhận lại nơi nộp hồ sơ và tài liệu chính thức; URL tài liệu được chuyển hướng trong quá trình kiểm tra này.",
          "it": "Riconfermare la destinazione ufficiale della domanda e della documentazione; l'URL della documentazione reindirizzato durante questo controllo.",
          // l10n: needs native review
          "ur": "سرکاری ایپلیکیشن اور دستاویزات منزل دوبارہ تصدیق کریں؛ اس چیک کے دوران دستاویزات URL ری ڈائریکٹ ہوا۔",
          // l10n: needs native review
          "uk": "Повторно підтвердьте офіційний застосунок і документація призначення; під час цієї перевірки URL документації перенаправлявся."
        }
      ]
    },
    "sources": {
      "drift-recovery-june": {
        "summary": {
          "en": "The article title says 3 June and the page date says 4 June 2026. It discusses recovery and a reboot but provides no launch date.",
          "zh-Hans": "文章标题为 6 月 3 日更新，页面日期为 2026 年 6 月 4 日；内容讨论恢复与重启，但未给出上线日期。",
          "zh-Hant": "文章標題為 6 月 3 日更新，頁面日期為 2026 年 6 月 4 日；內容討論恢復與重啟，但未給出上線日期。",
          "ja": "記事のタイトルには 6 月 3 日と記載されており、ページの日付には 2026 年 6 月 4 日と記載されています。回復と再起動について説明されていますが、発売日は記載されていません。",
          "ko": "기사 제목은 6월 3일이고 페이지 날짜는 2026년 6월 4일입니다. 복구 및 재부팅에 대해 설명하지만 출시 날짜는 제공하지 않습니다.",
          "tr": "Makale başlığında 3 Haziran, sayfa tarihinde ise 4 Haziran 2026 yazıyor. Kurtarma ve yeniden başlatmadan bahsediliyor ancak lansman tarihi belirtilmiyor.",
          "ar": "يقول عنوان المقالة 3 يونيو وتاريخ الصفحة 4 يونيو 2026. ويناقش الاسترداد وإعادة التشغيل ولكنه لا يقدم تاريخ إطلاق.",
          "es": "El título del artículo dice 3 de junio y la fecha de la página dice 4 de junio de 2026. Trata sobre la recuperación y el reinicio, pero no proporciona una fecha de lanzamiento.",
          "pt-BR": "O título do artigo diz 3 de junho e a data da página diz 4 de junho de 2026. Ele discute a recuperação e a reinicialização, mas não fornece uma data de lançamento.",
          "fr": "Le titre de l'article indique le 3 juin et la date de la page indique le 4 juin 2026. Il traite de la récupération et d'un redémarrage mais ne fournit aucune date de lancement.",
          "de": "Der Artikeltitel lautet 3. Juni und das Seitendatum lautet 4. Juni 2026. Es werden Wiederherstellung und ein Neustart besprochen, es wird jedoch kein Startdatum angegeben.",
          "ru": "В заголовке статьи указано 3 июня, а на странице дата — 4 июня 2026 года. В ней обсуждается восстановление и перезагрузка, но не указана дата запуска.",
          "id": "Judul artikel mengatakan 3 Juni dan tanggal halaman mengatakan 4 Juni 2026. Ini membahas pemulihan dan reboot tetapi tidak memberikan tanggal peluncuran.",
          "vi": "Tiêu đề bài viết ghi ngày 3 tháng 6 và ngày trang ghi là ngày 4 tháng 6 năm 2026. Nó thảo luận về việc khôi phục và khởi động lại nhưng không cung cấp ngày ra mắt.",
          "it": "Il titolo dell'articolo dice 3 giugno e la data della pagina dice 4 giugno 2026. Discute del ripristino e del riavvio, ma non fornisce alcuna data di lancio.",
          // l10n: needs native review
          "ur": "مضمون کا عنوان 3 جون کہتا ہے اور صفحہ تاریخ 4 جون 2026 کہتا ہے۔ یہ ریکوری اور ری بوٹ پر بات کرتا ہے مگر لانچ تاریخ نہیں دیتا۔",
          // l10n: needs native review
          "uk": "Назва статті каже 3 червня, а дата сторінки — 4 червня 2026 року. Вона обговорює відновлення і перезапуск, але не надає дата запуску."
        }
      },
      "drift-docs-redirect": {
        "summary": {
          "en": "The URL redirected to docs.velocity.exchange/protocol. The redirect alone does not establish a rebrand or equivalent user protections.",
          "zh-Hans": "地址重定向至 docs.velocity.exchange/protocol；仅凭重定向不能确认品牌更名或同等用户保障。",
          "zh-Hant": "網址重新導向至 docs.velocity.exchange/protocol；僅憑重新導向不能確認品牌更名或同等用戶保障。",
          "ja": "URL は docs.velocity.exchange/protocol にリダイレクトされます。リダイレクトだけでは、ブランド変更や同等のユーザー保護は確立されません。",
          "ko": "docs.velocity.exchange/protocol로 리디렉션된 URL입니다. 리디렉션만으로는 브랜드 변경이나 이에 상응하는 사용자 보호가 설정되지 않습니다.",
          "tr": "URL docs.velocity.exchange/protocol adresine yönlendirildi. Yönlendirme tek başına yeniden markalama veya eşdeğer kullanıcı korumaları oluşturmaz.",
          "ar": "تمت إعادة توجيه عنوان URL إلى docs.velocity.exchange/protocol. لا تؤدي عملية إعادة التوجيه وحدها إلى إنشاء علامة تجارية جديدة أو حماية مكافئة للمستخدم.",
          "es": "La URL redirigida a docs.velocity.exchange/protocol. La redirección por sí sola no establece un cambio de marca ni protecciones de usuario equivalentes.",
          "pt-BR": "A URL redirecionada para docs.velocity.exchange/protocol. O redirecionamento por si só não estabelece uma reformulação da marca ou proteções equivalentes ao usuário.",
          "fr": "L'URL redirigée vers docs.velocity.exchange/protocol. La redirection à elle seule n’établit pas de changement de marque ou de protections utilisateur équivalentes.",
          "de": "Die URL wird auf docs.velocity.exchange/protocol umgeleitet. Durch die Weiterleitung allein wird weder ein Rebranding noch ein gleichwertiger Benutzerschutz eingeführt.",
          "ru": "URL-адрес перенаправлен на docs.velocity.exchange/protocol. Само по себе перенаправление не обеспечивает ребрендинг или эквивалентную защиту пользователей.",
          "id": "URL dialihkan ke docs.velocity.exchange/protocol. Pengalihan saja tidak menghasilkan perubahan merek atau perlindungan pengguna yang setara.",
          "vi": "URL được chuyển hướng đến docs.velocity.exchange/protocol. Chỉ riêng việc chuyển hướng không thiết lập việc đổi thương hiệu hoặc bảo vệ người dùng tương đương.",
          "it": "L'URL reindirizzato a docs.velocity.exchange/protocol. Il reindirizzamento da solo non stabilisce un rebranding o protezioni utente equivalenti.",
          // l10n: needs native review
          "ur": "URL نے docs.velocity.exchange/protocol پر ری ڈائریکٹ کیا۔ صرف ری ڈائریکٹ نیا برانڈ نام یا مساوی صارف تحفظات ثابت نہیں کرتا۔",
          // l10n: needs native review
          "uk": "URL перенаправив на docs.velocity.exchange/protocol. Саме перенаправлення не встановлює ребрендинг або еквівалентний захист користувачів."
        }
      }
    },
    "evidenceRequirements": {
      "eligibility": {
        "en": "Read current recovery and service notices before considering a deposit.",
        "zh-Hans": "考虑充值前先查看最新恢复与服务公告。",
        "zh-Hant": "考慮儲值前先查看最新恢復與服務公告。",
        "ja": "デポジットを検討する前に、現在の回収とサービスに関する通知をお読みください。",
        "ko": "보증금을 고려하기 전에 현재 복구 및 서비스 공지를 읽어보십시오.",
        "tr": "Para yatırmayı düşünmeden önce güncel kurtarma ve hizmet bildirimlerini okuyun.",
        "ar": "اقرأ إشعارات الاسترداد والخدمة الحالية قبل التفكير في الإيداع.",
        "es": "Lea los avisos de recuperación y servicio actuales antes de considerar un depósito.",
        "pt-BR": "Leia os avisos atuais de recuperação e serviço antes de considerar um depósito.",
        "fr": "Lisez les avis de récupération et de service actuels avant d’envisager un dépôt.",
        "de": "Lesen Sie die aktuellen Wiederherstellungs- und Servicehinweise, bevor Sie eine Anzahlung in Betracht ziehen.",
        "ru": "Прежде чем рассматривать возможность внесения депозита, прочтите текущие уведомления о восстановлении и обслуживании.",
        "id": "Baca pemberitahuan pemulihan dan layanan terkini sebelum mempertimbangkan deposit.",
        "vi": "Đọc các thông báo phục hồi và dịch vụ hiện tại trước khi xem xét đặt cọc.",
        "it": "Leggi gli attuali avvisi di recupero e servizio prima di prendere in considerazione un deposito.",
        // l10n: needs native review
        "ur": "ڈپازٹ پر غور کرنے سے پہلے موجودہ ریکوری اور سروس نوٹسز پڑھیں۔",
        // l10n: needs native review
        "uk": "Перед розглядом депозиту прочитайте поточне відновлення і сервісні повідомлення."
      },
      "limitations": {
        "en": "Reconfirm the official application and documentation destination; the documentation URL redirected during this check.",
        "zh-Hans": "重新确认官方应用与文档目标域名，本次检查发现文档地址发生重定向。",
        "zh-Hant": "重新確認官方應用程式與文件目標網域，本次檢查發現文件網址發生重新導向。",
        "ja": "正式な申請書と書類の宛先を再確認します。このチェック中にリダイレクトされたドキュメント URL。",
        "ko": "공식 신청서와 서류 목적지를 다시 확인하세요. 이 확인 중에 리디렉션된 문서 URL입니다.",
        "tr": "Resmi başvuru ve belge varış yerini yeniden onaylayın; bu kontrol sırasında yönlendirilen dokümantasyon URL'si.",
        "ar": "أعد تأكيد الوجهة الرسمية للتطبيق والوثائق؛ علماً بأن رابط الوثائق قد أجرى إعادة توجيه أثناء هذا الفحص.",
        "es": "Reconfirmar el destino oficial de la solicitud y documentación; la URL de la documentación redirigida durante esta verificación.",
        "pt-BR": "Reconfirmar o destino oficial do pedido e da documentação; o URL da documentação redirecionado durante esta verificação.",
        "fr": "Reconfirmez la demande officielle et la destination de la documentation ; l'URL de la documentation redirigée lors de cette vérification.",
        "de": "Bestätigen Sie den offiziellen Bestimmungsort des Antrags und der Dokumentation erneut. Die bei dieser Prüfung umgeleitete Dokumentations-URL.",
        "ru": "Повторно проверьте официальный адрес приложения и документации; в ходе данной проверки URL-адрес документации был перенаправлен.",
        "id": "Konfirmasikan kembali tujuan aplikasi dan dokumentasi resmi; URL dokumentasi dialihkan selama pemeriksaan ini.",
        "vi": "Xác nhận lại nơi nộp hồ sơ và tài liệu chính thức; URL tài liệu được chuyển hướng trong quá trình kiểm tra này.",
        "it": "Riconfermare la destinazione ufficiale della domanda e della documentazione; l'URL della documentazione reindirizzato durante questo controllo.",
        // l10n: needs native review
        "ur": "سرکاری ایپلیکیشن اور دستاویزات کی منزل دوبارہ تصدیق کریں؛ اس چیک کے دوران دستاویزات URL ری ڈائریکٹ ہوا۔",
        // l10n: needs native review
        "uk": "Повторно підтвердьте офіційний застосунок і призначення документації; під час цієї перевірки документація URL перенаправився."
      },
      "publishedDate": {
        "en": "2026-06-04",
        "zh-Hans": "2026-06-04",
        "zh-Hant": "2026-06-04",
        "ja": "2026-06-04",
        "ko": "2026-06-04",
        "tr": "2026-06-04",
        "ar": "2026-06-04",
        "es": "2026-06-04",
        "pt-BR": "04/06/2026",
        "fr": "2026-06-04",
        "de": "04.06.2026",
        "ru": "2026-06-04",
        "id": "04-06-2026",
        "vi": "2026-06-04",
        "it": "2026-06-04",
        // l10n: needs native review
        "ur": "2026-06-04",
        // l10n: needs native review
        "uk": "2026-06-04"
      },
      "datePrecision": {
        "en": "Source date retained as displayed; no missing timezone is inferred.",
        "zh-Hans": "保留来源显示日期，不推断缺失时区。",
        "zh-Hant": "保留來源顯示日期，不推斷缺失時區。",
        "ja": "ソースの日付は表示どおりに保持されます。欠落しているタイムゾーンは推論されません。",
        "ko": "소스 날짜는 표시된 대로 유지됩니다. 누락된 시간대는 유추되지 않습니다.",
        "tr": "Kaynak tarihi görüntülendiği şekilde tutuldu; eksik bir saat diliminin olmadığı anlaşılmaktadır.",
        "ar": "تم الاحتفاظ بتاريخ المصدر كما هو معروض؛ لا يتم استنتاج أي منطقة زمنية مفقودة.",
        "es": "La fecha de origen se conserva tal como se muestra; no se infiere ninguna zona horaria faltante.",
        "pt-BR": "Data de origem mantida conforme exibida; nenhum fuso horário ausente é inferido.",
        "fr": "Date source conservée telle qu'affichée ; aucun fuseau horaire manquant n’est déduit.",
        "de": "Quelldatum wie angezeigt beibehalten; Es wird keine fehlende Zeitzone abgeleitet.",
        "ru": "Исходная дата сохраняется в том виде, в каком она отображается; отсутствие отсутствующего часового пояса не предполагается.",
        "id": "Tanggal sumber dipertahankan seperti yang ditampilkan; tidak ada zona waktu yang hilang yang disimpulkan.",
        "vi": "Ngày nguồn được giữ lại như được hiển thị; không có múi giờ bị thiếu được suy ra.",
        "it": "Data di origine mantenuta come visualizzata; non si deduce alcun fuso orario mancante.",
        // l10n: needs native review
        "ur": "ماخذ تاریخ جیسے دکھائی گئی ویسے رکھی گئی؛ غائب وقت زون اخذ نہیں کیا گیا۔",
        // l10n: needs native review
        "uk": "Дату джерела збережено так, як показано; відсутній часовий пояс не виводиться."
      },
      "gaps": [
        {
          "en": "A complete country/region eligibility list was not established for this specific offer.",
          "zh-Hans": "尚未核实这项具体优惠的完整国家或地区资格清单。",
          "zh-Hant": "尚未核實這項具體優惠的完整國家或地區資格清單。",
          "ja": "この特定のオファーについては、完全な国/地域の資格リストが確立されていません。",
          "ko": "이 특정 제안에 대한 전체 국가/지역 자격 목록이 확립되지 않았습니다.",
          "tr": "Bu özel teklif için tam bir ülke/bölge uygunluk listesi oluşturulmamıştır.",
          "ar": "لم يتم إنشاء قائمة أهلية كاملة للبلد/المنطقة لهذا العرض المحدد.",
          "es": "No se estableció una lista completa de elegibilidad de países/regiones para esta oferta específica.",
          "pt-BR": "Não foi estabelecida uma lista completa de elegibilidade de país/região para esta oferta específica.",
          "fr": "Aucune liste complète d'éligibilité par pays/région n'a été établie pour cette offre spécifique.",
          "de": "Für dieses spezielle Angebot wurde keine vollständige Länder-/Regionsliste erstellt.",
          "ru": "Для этого конкретного предложения не был установлен полный список стран/регионов, отвечающих критериям участия.",
          "id": "Daftar lengkap kelayakan negara/wilayah belum dibuat untuk penawaran khusus ini.",
          "vi": "Chưa thể xác định danh sách đầy đủ các quốc gia/khu vực đủ điều kiện cho ưu đãi cụ thể này.",
          "it": "Non è stato stabilito un elenco completo di paesi/regioni di idoneità per questa offerta specifica.",
          // l10n: needs native review
          "ur": "اس مخصوص پیشکش کے لیے مکمل ملک/علاقہ اہلیت فہرست قائم نہیں ہوئی۔",
          // l10n: needs native review
          "uk": "Повний список придатності країн/регіонів для цієї конкретної пропозиції не встановлено."
        },
        {
          "en": "This source does not establish the applicable identity-verification requirement; null does not mean no KYC.",
          "zh-Hans": "该来源未确定适用的身份验证要求；未知不代表无需 KYC。",
          "zh-Hant": "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。",
          "ja": "この情報源は、適用可能な本人確認要件を確立していません。 null は KYC がないことを意味しません。",
          "ko": "이 출처는 해당 신원 확인 요구 사항을 설정하지 않습니다. null이 KYC가 없다는 의미는 아닙니다.",
          "tr": "Bu kaynak geçerli kimlik doğrulama gerekliliğini belirlemez; null, KYC'nin olmadığı anlamına gelmez.",
          "ar": "لا يحدد هذا المصدر متطلبات التحقق من الهوية المعمول بها؛ وعدم ورود القيمة (null) لا يعني عدم اشتراط KYC.",
          "es": "Esta fuente no establece el requisito de verificación de identidad aplicable; nulo no significa que no haya KYC.",
          "pt-BR": "Esta fonte não estabelece o requisito de verificação de identidade aplicável; nulo não significa nenhum KYC.",
          "fr": "Cette source n'établit pas l'exigence applicable en matière de vérification de l'identité ; null ne signifie pas pas de KYC.",
          "de": "Diese Quelle stellt nicht die anwendbare Anforderung zur Identitätsüberprüfung dar; null bedeutet nicht, dass kein KYC vorhanden ist.",
          "ru": "Этот источник не устанавливает применимых требований по проверке личности; null не означает отсутствие KYC.",
          "id": "Sumber ini tidak menetapkan persyaratan verifikasi identitas yang berlaku; null bukan berarti tidak ada KYC.",
          "vi": "Nguồn này không nêu rõ yêu cầu xác minh danh tính hiện hành; giá trị null không đồng nghĩa với việc không cần KYC.",
          "it": "Questa fonte non stabilisce il requisito applicabile di verifica dell'identità; null non significa assenza di KYC.",
          // l10n: needs native review
          "ur": "یہ ماخذ قابل اطلاق شناختی تصدیق کا تقاضا قائم نہیں کرتا؛ خالی قدر کا مطلب KYC نہ ہونا نہیں۔",
          // l10n: needs native review
          "uk": "Це джерело не встановлює застосовну вимогу перевірки особи; порожнє значення не означає відсутність KYC."
        },
        {
          "en": "No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.",
          "zh-Hans": "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。",
          "zh-Hant": "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。",
          "ja": "完全な絶対的なキャンペーン期間は検証されていません。読み取り可能なページだけでは、オファーがアクティブであることを確認できません。",
          "ko": "완전한 절대 캠페인 기간이 확인되지 않았습니다. 읽을 수 있는 페이지만으로는 제안이 활성화되었음을 확인할 수 없습니다.",
          "tr": "Tam bir mutlak kampanya aralığı doğrulanmadı; Okunabilir bir sayfa tek başına bir teklifin aktif olduğunu kanıtlayamaz.",
          "ar": "لم يتم التحقق من نافذة الحملة المطلقة الكاملة؛ لا يمكن للصفحة المقروءة وحدها إثبات أن العرض نشط.",
          "es": "No se verificó ninguna ventana de campaña absoluta completa; una página legible por sí sola no puede establecer que una oferta está activa.",
          "pt-BR": "Nenhuma janela de campanha absoluta e completa foi verificada; uma página legível por si só não pode estabelecer que uma oferta está ativa.",
          "fr": "Aucune fenêtre de campagne absolue complète n'a été vérifiée ; une page lisible ne peut à elle seule établir qu’une offre est active.",
          "de": "Es wurde kein vollständiges absolutes Kampagnenfenster überprüft; Eine lesbare Seite allein kann nicht feststellen, dass ein Angebot aktiv ist.",
          "ru": "Полное абсолютное окно кампании не было проверено; сама по себе читаемая страница не может подтвердить, что предложение активно.",
          "id": "Tidak ada jendela kampanye absolut lengkap yang diverifikasi; halaman yang dapat dibaca saja tidak dapat membuktikan bahwa suatu penawaran aktif.",
          "vi": "Chưa thể xác minh toàn bộ khung thời gian tuyệt đối của chiến dịch; chỉ riêng một trang đọc được thì chưa đủ để khẳng định ưu đãi đang hoạt động.",
          "it": "Non è stata verificata alcuna finestra assoluta completa della campagna; una pagina leggibile da sola non può stabilire che un'offerta sia attiva.",
          // l10n: needs native review
          "ur": "کوئی مہم کی کوئی قطعی مدت تصدیق شدہ نہیں ہے؛ صرف پڑھنے کے قابل صفحہ پیشکش فعال ہونے کو ثابت نہیں کر سکتا۔",
          // l10n: needs native review
          "uk": "Повне абсолютне вікно кампанії не підтверджено; сама читабельна сторінка не може встановити, що пропозиція активна."
        },
        {
          "en": "Current service access and reward eligibility require fresh official confirmation. Old referral or points posts are not evidence of an active offer.",
          "zh-Hans": "当前服务可用性与奖励资格需重新通过官方确认，旧邀请或积分文章不能证明活动仍有效。",
          "zh-Hant": "目前服務可用性與獎勵資格需重新透過官方確認，舊邀請或積分文章不能證明活動仍有效。",
          "ja": "現在のサービスへのアクセスと特典の資格については、新たな公式確認が必要です。古い紹介やポイントの投稿は、アクティブなオファーの証拠ではありません。",
          "ko": "현재 서비스 이용 및 보상 자격은 새로운 공식 확인이 필요합니다. 이전 추천 또는 포인트 게시물은 활성 제안의 증거가 아닙니다.",
          "tr": "Mevcut hizmet erişimi ve ödül uygunluğu, yeni resmi onay gerektirir. Eski yönlendirme veya puan gönderileri aktif bir teklifin kanıtı değildir.",
          "ar": "يتطلب الوصول إلى الخدمة الحالية وأهلية المكافأة تأكيدًا رسميًا جديدًا. لا تعتبر منشورات الإحالة أو النقاط القديمة دليلاً على وجود عرض نشط.",
          "es": "El acceso actual al servicio y la elegibilidad para las recompensas requieren una nueva confirmación oficial. Las publicaciones antiguas de referencias o puntos no son evidencia de una oferta activa.",
          "pt-BR": "O acesso ao serviço atual e a elegibilidade para recompensas exigem uma nova confirmação oficial. Postagens antigas de referências ou pontos não são evidência de uma oferta ativa.",
          "fr": "L’accès actuel au service et l’éligibilité aux récompenses nécessitent une nouvelle confirmation officielle. Les anciennes publications de références ou de points ne constituent pas une preuve d’une offre active.",
          "de": "Der aktuelle Servicezugang und die Prämienberechtigung erfordern eine neue offizielle Bestätigung. Alte Empfehlungs- oder Punktebeiträge sind kein Beweis für ein aktives Angebot.",
          "ru": "Текущий доступ к услугам и право на вознаграждение требуют нового официального подтверждения. Старые сообщения о рефералах или баллах не являются свидетельством активного предложения.",
          "id": "Akses layanan saat ini dan kelayakan hadiah memerlukan konfirmasi resmi baru. Postingan rujukan atau poin lama bukan merupakan bukti penawaran aktif.",
          "vi": "Việc truy cập dịch vụ hiện tại và khả năng đủ điều kiện nhận phần thưởng cần có xác nhận chính thức mới. Các bài đăng giới thiệu hoặc điểm cũ không phải là bằng chứng của một ưu đãi đang hoạt động.",
          "it": "L'attuale accesso al servizio e l'idoneità al premio richiedono una nuova conferma ufficiale. I vecchi post di riferimento o di punti non sono prova di un'offerta attiva.",
          // l10n: needs native review
          "ur": "موجودہ سروس رسائی اور انعامی اہلیت کے لیے تازہ سرکاری تصدیق چاہیے۔ پرانی ریفرل یا پوائنٹس پوسٹس فعال پیشکش کا ثبوت نہیں۔",
          // l10n: needs native review
          "uk": "Поточний доступ до сервісу й придатність до винагороди потребують свіжого офіційного підтвердження. Старі дописи про рефералів або бали не є доказом активної пропозиції."
        },
        {
          "en": "The reviewed Drift notice discusses recovery of outstanding user losses and a protocol reboot. It does not verify normal current trading or deposit availability.",
          "zh-Hans": "本次读取的 Drift 公告讨论用户未补偿损失的恢复与协议重启，不能据此证明当前交易或充值正常可用。",
          "zh-Hant": "本次讀取的 Drift 公告討論用戶未補償損失的恢復與協議重啟，不能據此證明目前交易或儲值正常可用。",
          "ja": "レビューされたドリフト通知では、未解決のユーザー損失の回復とプロトコルの再起動について説明されています。通常の現在の取引や預金の利用可能性を確認するものではありません。",
          "ko": "검토된 Drift 공지에서는 미해결 사용자 손실 복구 및 프로토콜 재부팅에 대해 논의합니다. 정상적인 현재 거래 또는 예금 가용성을 확인하지 않습니다.",
          "tr": "İncelenen Drift bildirimi, olağanüstü kullanıcı kayıplarının kurtarılmasını ve protokolün yeniden başlatılmasını tartışıyor. Normal mevcut ticareti veya mevduat kullanılabilirliğini doğrulamaz.",
          "ar": "يناقش إشعار Drift الذي تمت مراجعته استرداد خسائر المستخدم المعلقة وإعادة تشغيل البروتوكول. ولا يتحقق من التداول الحالي العادي أو توافر الودائع.",
          "es": "El aviso de Drift revisado analiza la recuperación de pérdidas pendientes de usuarios y el reinicio del protocolo. No verifica la disponibilidad normal actual de operaciones o depósitos.",
          "pt-BR": "O aviso de Drift revisado discute a recuperação de perdas pendentes de usuários e uma reinicialização do protocolo. Ele não verifica a negociação atual normal ou a disponibilidade de depósitos.",
          "fr": "L'avis Drift examiné traite de la récupération des pertes d'utilisateurs en suspens et d'un redémarrage du protocole. Il ne vérifie pas les échanges courants normaux ni la disponibilité des dépôts.",
          "de": "In der überprüften Drift-Mitteilung werden die Wiederherstellung ausstehender Benutzerverluste und ein Protokollneustart erörtert. Es überprüft nicht den normalen aktuellen Handel oder die Verfügbarkeit von Einlagen.",
          "ru": "В рассмотренном объявлении Drift обсуждается компенсация невозмещенных потерь пользователей и перезапуск протокола. Оно не подтверждает нормальное ведение торговли или доступность депозитов в настоящее время.",
          "id": "Pengumuman Drift yang ditinjau membahas pemulihan kerugian pengguna yang belum terselesaikan dan peluncuran ulang protokol. Hal ini tidak mengonfirmasi ketersediaan perdagangan atau deposit normal saat ini.",
          "vi": "Thông báo Drift được xem xét thảo luận về việc khôi phục những tổn thất còn tồn đọng của người dùng và khởi động lại giao thức. Nó không xác minh tính khả dụng của giao dịch hiện tại hoặc tiền gửi thông thường.",
          "it": "L'avviso Drift esaminato discute il recupero delle perdite di utenti in sospeso e il riavvio del protocollo. Non verifica il normale scambio corrente o la disponibilità dei depositi.",
          // l10n: needs native review
          "ur": "جائزہ شدہ Drift نوٹس بقایا صارف نقصانات کی ریکوری اور پروٹوکول ری بوٹ پر بات کرتا ہے۔ یہ معمول کی موجودہ ٹریڈنگ یا ڈپازٹ دستیابی کی تصدیق نہیں کرتا۔",
          // l10n: needs native review
          "uk": "Переглянуте повідомлення Drift стосується відшкодування непогашених втрат користувачів і перезапуску протоколу. Воно не підтверджує звичайну поточну торгівлю або доступність депозитів."
        }
      ]
    },
    "notices": [
      {
        "en": "Material service-status caution: do not label Drift as normally available or promote a deposit based solely on the reviewed historical recovery notice.",
        "zh-Hans": "重要服务状态提醒：不能仅根据已读历史恢复公告，将 Drift 标为正常可用或推荐用户充值。",
        "zh-Hant": "重要服務狀態提醒：不能僅根據已讀歷史恢復公告，將 Drift 標為正常可用或推薦用戶儲值。",
        "ja": "重要なサービスステータスに関する注意: ドリフトを通常利用可能であるとラベル付けしたり、レビューされた履歴回収通知のみに基づいてデポジットを促進したりしないでください。",
        "ko": "중요한 서비스 상태 주의 사항: Drift를 일반적으로 사용 가능한 것으로 표시하거나 검토된 과거 복구 통지만을 기반으로 예금을 홍보하지 마십시오.",
        "tr": "Maddi hizmet durumu uyarısı: Drift'i normalde mevcut olarak etiketlemeyin veya yalnızca incelenen geçmiş kurtarma bildirimine dayanarak bir para yatırma işleminin tanıtımını yapmayın.",
        "ar": "تحذير جوهري بشأن حالة الخدمة: لا تصنّف Drift على أنه متاح بشكل طبيعي ولا تروّج للإيداع استناداً فقط إلى إشعار الاسترداد التاريخي الذي تمت مراجعته.",
        "es": "Precaución importante sobre el estado del servicio: no etiquete a Drift como normalmente disponible ni promueva un depósito basándose únicamente en el aviso de recuperación histórico revisado.",
        "pt-BR": "Cuidado com o status do serviço material: não rotule o Drift como normalmente disponível nem promova um depósito com base apenas no aviso de recuperação histórica revisado.",
        "fr": "Attention concernant l'état du service matériel : n'étiquetez pas Drift comme étant normalement disponible et ne faites pas la promotion d'un dépôt basé uniquement sur l'avis de récupération historique examiné.",
        "de": "Wichtiger Hinweis zum Servicestatus: Kennzeichnen Sie Drift nicht als normal verfügbar und bewerben Sie eine Lagerstätte nicht ausschließlich auf der Grundlage der überprüften historischen Wiederherstellungsmitteilung.",
        "ru": "Существенное предупреждение о статусе обслуживания: не помечайте Drift как обычно доступный и не рекламируйте депозит исключительно на основе проверенного исторического уведомления о восстановлении.",
        "id": "Peringatan penting status layanan: jangan mencantumkan Drift sebagai layanan yang tersedia normal atau mempromosikan deposit hanya berdasarkan pengumuman pemulihan historis yang ditinjau.",
        "vi": "Thận trọng về trạng thái dịch vụ quan trọng: không gắn nhãn Drift là có sẵn bình thường hoặc quảng cáo khoản tiền gửi chỉ dựa trên thông báo khôi phục lịch sử đã được xem xét.",
        "it": "Avvertenza sullo stato materiale del servizio: non etichettare Drift come normalmente disponibile né promuovere un deposito basato esclusivamente sull'avviso di recupero storico esaminato.",
        // l10n: needs native review
        "ur": "اہم سروس اسٹیٹس احتیاط: صرف جائزہ شدہ تاریخی ریکوری نوٹس کی بنیاد پر Drift کو معمول کے مطابق دستیاب نہ کہیں اور نہ ڈپازٹ کو فروغ دیں۔",
        // l10n: needs native review
        "uk": "Суттєве застереження щодо статусу сервісу: не позначайте Drift як нормально доступний і не просувайте депозит лише на підставі перевіреного історичного повідомлення про відшкодування."
      }
    ]
  }
});

export function campaignResearchLocalizedText(slug, path, locale) {
  const parts = Array.isArray(path) ? path : String(path || '').split('.').filter(Boolean);
  let value = officialCampaignResearchLocalizations?.[slug];
  for (const part of parts) value = value?.[part];
  if (!value || typeof value !== 'object') return null;
  const baseLocale = String(locale || '').split('-')[0];
  return value[locale] || value[baseLocale] || null;
}

export function hasCampaignResearchLocale(slug, locale) {
  if (!OFFICIAL_CAMPAIGN_LOCALIZED_LOCALES.includes(locale)) return false;
  const record = officialCampaignResearchLocalizations?.[slug];
  if (!record) return false;
  const visit = (value) => {
    if (!value || typeof value !== 'object') return true;
    if (Array.isArray(value)) return value.every(visit);
    if (typeof value.en === 'string') return typeof value[locale] === 'string' && value[locale].trim().length > 0;
    return Object.values(value).every(visit);
  };
  return visit(record);
}
