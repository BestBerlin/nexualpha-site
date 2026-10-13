const entryCopy = {
 en: ['No recorded invitation code', 'This route has no recorded invitation code.', 'Protocol entry', 'Check the network, contract and wallet permissions before connecting.'],
 'zh-Hans': ['未记录邀请码','此入口未记录邀请码。','协议入口','连接前核对网络、合约和钱包权限。'],
 'zh-Hant': ['未記錄邀請碼','此入口未記錄邀請碼。','協議入口','連接前核對網路、合約和錢包權限。'],
 ja: ['招待コードの記録なし','この入口には招待コードの記録がありません。','プロトコルへの入口','接続前にネットワーク、コントラクト、ウォレット権限を確認してください。'],
 ko: ['초대 코드 기록 없음','이 경로에는 기록된 초대 코드가 없습니다.','프로토콜 접속','연결 전에 네트워크, 컨트랙트, 지갑 권한을 확인하세요.'],
 tr: ['Kayıtlı davet kodu yok','Bu yol için kayıtlı davet kodu yok.','Protokol erişimi','Bağlanmadan önce ağı, sözleşmeyi ve cüzdan izinlerini kontrol edin.'],
 ar: ['لا يوجد رمز دعوة مسجل','لا يوجد رمز دعوة مسجل لهذا المسار.','مدخل البروتوكول','تحقق من الشبكة والعقد وأذونات المحفظة قبل الاتصال.'],
 es: ['Sin código de invitación registrado','Esta ruta no tiene un código de invitación registrado.','Acceso al protocolo','Comprueba la red, el contrato y los permisos de la cartera antes de conectar.'],
 'pt-BR': ['Sem código de convite registrado','Esta rota não tem código de convite registrado.','Acesso ao protocolo','Verifique a rede, o contrato e as permissões da carteira antes de conectar.'],
 fr: ['Aucun code d’invitation enregistré','Aucun code d’invitation n’est enregistré pour ce parcours.','Accès au protocole','Vérifiez le réseau, le contrat et les autorisations du portefeuille avant la connexion.'],
 de: ['Kein Einladungscode verzeichnet','Für diesen Zugang ist kein Einladungscode verzeichnet.','Protokollzugang','Prüfen Sie Netzwerk, Vertrag und Wallet-Berechtigungen vor der Verbindung.'],
 ru: ['Код приглашения не записан','Для этого пути код приглашения не записан.','Доступ к протоколу','Перед подключением проверьте сеть, контракт и разрешения кошелька.'],
 id: ['Kode undangan belum tercatat','Jalur ini tidak memiliki kode undangan yang tercatat.','Akses protokol','Periksa jaringan, kontrak, dan izin dompet sebelum menghubungkan.'],
 vi: ['Chưa ghi nhận mã mời','Đường dẫn này chưa có mã mời được ghi nhận.','Truy cập giao thức','Kiểm tra mạng, hợp đồng và quyền ví trước khi kết nối.'],
 it: ['Nessun codice invito registrato','Questo percorso non ha un codice invito registrato.','Accesso al protocollo','Verifica rete, contratto e autorizzazioni del wallet prima di collegarlo.'],

 // l10n: needs native review
 ur: ["دعوتی کوڈ درج نہیں","اس راستے کے لیے دعوتی کوڈ درج نہیں۔","پروٹوکول کا راستہ","منسلک ہونے سے پہلے نیٹ ورک، معاہدہ اور والیٹ کی اجازتیں جانچیں۔"],
 // l10n: needs native review
 uk: ["Код запрошення не записано","Для цього маршруту код запрошення не записано.","Перехід до протоколу","Перед підключенням перевірте мережу, контракт і дозволи гаманця."],
};
export function registrationEntryContext(category, locale = 'en') {
 const copy = entryCopy[locale] || entryCopy.en;
 const protocol = category === 'DEX' || category === 'Perp DEX';
 return { kind: protocol ? 'protocol' : 'no-code', title: copy[protocol ? 2 : 0], body: copy[protocol ? 3 : 1] };
}
