const rows = {
  en: ["Data service connected", "Updates unavailable. Independent research is still available.", "Checking data service…", "Refresh data", "Local preview data"],
  "zh-Hans": ["数据服务已连接", "动态数据暂不可用，仍可浏览独立研究。", "正在连接数据服务…", "刷新数据", "本地预览数据"],
  "zh-Hant": ["資料服務已連線", "動態資料暫時無法使用，仍可瀏覽獨立研究。", "正在連線資料服務…", "重新整理資料", "本機預覽資料"],
  es: ["Servicio de datos conectado", "Actualizaciones no disponibles. La investigación independiente sigue disponible.", "Comprobando el servicio…", "Actualizar datos", "Datos de vista previa local"],
  "pt-BR": ["Serviço de dados conectado", "Atualizações indisponíveis. A pesquisa independente continua disponível.", "Verificando o serviço…", "Atualizar dados", "Dados de prévia local"],
  fr: ["Service de données connecté", "Mises à jour indisponibles. Les recherches indépendantes restent accessibles.", "Vérification du service…", "Actualiser les données", "Données d’aperçu local"],
  de: ["Datendienst verbunden", "Aktualisierungen nicht verfügbar. Unabhängige Recherchen bleiben zugänglich.", "Datendienst wird geprüft…", "Daten aktualisieren", "Lokale Vorschaudaten"],
  ja: ["データサービスに接続済み", "更新データを取得できません。独立した調査記事は閲覧できます。", "データサービスを確認中…", "データを更新", "ローカルプレビューのデータ"],
  ko: ["데이터 서비스 연결됨", "업데이트를 사용할 수 없습니다. 독립 리서치는 계속 볼 수 있습니다.", "데이터 서비스 확인 중…", "데이터 새로고침", "로컬 미리보기 데이터"],
  ar: ["تم الاتصال بخدمة البيانات", "التحديثات غير متاحة. لا تزال الأبحاث المستقلة متاحة.", "جارٍ التحقق من خدمة البيانات…", "تحديث البيانات", "بيانات معاينة محلية"],
  tr: ["Veri hizmetine bağlanıldı", "Güncellemeler kullanılamıyor. Bağımsız araştırmaya erişebilirsiniz.", "Veri hizmeti kontrol ediliyor…", "Verileri yenile", "Yerel önizleme verileri"],
  ru: ["Сервис данных подключён", "Обновления недоступны. Независимые исследования остаются доступны.", "Проверка сервиса данных…", "Обновить данные", "Данные локального предпросмотра"],
  id: ["Layanan data terhubung", "Pembaruan tidak tersedia. Riset independen tetap dapat dibaca.", "Memeriksa layanan data…", "Perbarui data", "Data pratinjau lokal"],
  vi: ["Đã kết nối dịch vụ dữ liệu", "Chưa có cập nhật. Nghiên cứu độc lập vẫn có thể truy cập.", "Đang kiểm tra dịch vụ dữ liệu…", "Làm mới dữ liệu", "Dữ liệu xem trước cục bộ"],
  it: ["Servizio dati connesso", "Aggiornamenti non disponibili. La ricerca indipendente resta accessibile.", "Verifica del servizio dati…", "Aggiorna dati", "Dati di anteprima locale"],
};

export function dataStatusCopy(locale) {
  const [ready, error, loading, refresh, mock] = rows[locale] ?? rows.en;
  return { ready, error, loading, refresh, mock, empty: error, stale: error };
}
