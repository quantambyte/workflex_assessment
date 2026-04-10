import i18next from "i18next";
import middleware from "i18next-http-middleware";

const resources = {
  en: {
    translation: {
      welcome: "Welcome to Workflex Assessment API",
      errors: {
        user_not_found: "User not found",
        unauthorized: "Unauthorized access",
        invalid_token: "Invalid MFA token",
        mfa_not_enabled: "MFA setup not initiated",
        email_required: "Email is required",
        email_token_required: "Email and token are required",
      },
      success: {
        mfa_enabled: "MFA enabled successfully",
        users_imported: "Users imported successfully",
      },
    },
  },
  ja: {
    translation: {
      welcome: "Workflex Assessment APIへようこそ",
      errors: {
        user_not_found: "ユーザーが見つかりません",
        unauthorized: "認証されていないアクセス",
        invalid_token: "無効なMFAトークン",
        mfa_not_enabled: "MFAセットアップが開始されていません",
        email_required: "メールアドレスが必要です",
        email_token_required: "メールアドレスとトークンが必要です",
      },
      success: {
        mfa_enabled: "MFAが正常に有効化されました",
        users_imported: "ユーザーが正常にインポートされました",
      },
    },
  },
  de: {
    translation: {
      welcome: "Willkommen bei der Workflex Assessment API",
      errors: {
        user_not_found: "Benutzer nicht gefunden",
        unauthorized: "Unbefugter Zugriff",
        invalid_token: "Ungültiger MFA-Token",
        mfa_not_enabled: "MFA-Setup nicht initiiatiert",
        email_required: "E-Mail ist erforderlich",
        email_token_required: "E-Mail und Token sind erforderlich",
      },
      success: {
        mfa_enabled: "MFA erfolgreich aktiviert",
        users_imported: "Benutzer erfolgreich importiert",
      },
    },
  },
  fr: {
    translation: {
      welcome: "Bienvenue sur l'API Workflex Assessment",
      errors: {
        user_not_found: "Utilisateur non trouvé",
        unauthorized: "Accès non autorisé",
        invalid_token: "Jeton MFA invalide",
        mfa_not_enabled: "Configuration MFA non initiée",
        email_required: "L'email est requis",
        email_token_required: "L'email et le jeton sont requis",
      },
      success: {
        mfa_enabled: "MFA activé avec succès",
        users_imported: "Utilisateurs importés avec succès",
      },
    },
  },
};

i18next.use(middleware.LanguageDetector).init({
  fallbackLng: "en",
  resources,
  detection: {
    order: ["header", "querystring", "cookie"],
    caches: false,
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
export const i18nMiddleware = middleware.handle(i18next);
