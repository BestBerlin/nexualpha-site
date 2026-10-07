const entryCopy = {
 en: ['No configured invitation code', 'This route has no configured invitation code.', 'Protocol entry', 'Check the network, contract and wallet permissions before connecting.'],
 'zh-Hans': ['未配置邀请码','此入口未配置邀请码。','协议入口','连接前核对网络、合约和钱包权限。'],
 'zh-Hant': ['未配置邀請碼','此入口未配置邀請碼。','協議入口','連接前核對網路、合約和錢包權限。'],
 ja: ['招待コード未設定','この入口には招待コードが設定されていません。','プロトコルへの入口','接続前にネットワーク、コントラクト、ウォレット権限を確認してください。'],
 ko: ['초대 코드 미설정','이 경로에는 초대 코드가 설정되어 있지 않습니다.','프로토콜 접속','연결 전에 네트워크, 컨트랙트, 지갑 권한을 확인하세요.'],
 tr: ['Davet kodu yapılandırılmamış','Bu yol için davet kodu yapılandırılmamış.','Protokol erişimi','Bağlanmadan önce ağı, sözleşmeyi ve cüzdan izinlerini kontrol edin.'],
 ar: ['لم يُضبط رمز دعوة','لم يُضبط رمز دعوة لهذا المسار.','مدخل البروتوكول','تحقق من الشبكة والعقد وأذونات المحفظة قبل الاتصال.'],
 es: ['Sin código de invitación configurado','Esta ruta no tiene un código de invitación configurado.','Acceso al protocolo','Comprueba la red, el contrato y los permisos de la cartera antes de conectar.'],
 'pt-BR': ['Sem código de convite configurado','Esta rota não tem código de convite configurado.','Acesso ao protocolo','Verifique a rede, o contrato e as permissões da carteira antes de conectar.'],
 fr: ['Aucun code d’invitation configuré','Aucun code d’invitation n’est configuré pour ce parcours.','Accès au protocole','Vérifiez le réseau, le contrat et les autorisations du portefeuille avant la connexion.'],
 de: ['Kein Einladungscode hinterlegt','Für diesen Zugang ist kein Einladungscode hinterlegt.','Protokollzugang','Prüfen Sie Netzwerk, Vertrag und Wallet-Berechtigungen vor der Verbindung.'],
 ru: ['Код приглашения не настроен','Для этого пути код приглашения не настроен.','Доступ к протоколу','Перед подключением проверьте сеть, контракт и разрешения кошелька.'],
 id: ['Kode undangan belum diatur','Jalur ini tidak memiliki kode undangan yang diatur.','Akses protokol','Periksa jaringan, kontrak, dan izin dompet sebelum menghubungkan.'],
 vi: ['Chưa cấu hình mã mời','Đường dẫn này chưa được cấu hình mã mời.','Truy cập giao thức','Kiểm tra mạng, hợp đồng và quyền ví trước khi kết nối.'],
 it: ['Nessun codice invito configurato','Questo percorso non ha un codice invito configurato.','Accesso al protocollo','Verifica rete, contratto e autorizzazioni del wallet prima di collegarlo.'],
};
export function registrationEntryContext(category, locale = 'en') {
 const copy = entryCopy[locale] || entryCopy.en;
 const protocol = category === 'DEX' || category === 'Perp DEX';
 return { kind: protocol ? 'protocol' : 'no-code', title: copy[protocol ? 2 : 0], body: copy[protocol ? 3 : 1] };
}
