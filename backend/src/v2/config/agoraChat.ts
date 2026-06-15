export const agoraChatConfig = {
  appId: process.env.AGORA_APP_ID!,
  appCertificate: process.env.AGORA_APP_CERTIFICATE!,
  restUrl: process.env.AGORA_CHAT_REST_URL || 'https://a41.chat.agora.io',
  orgName: process.env.AGORA_CHAT_ORG_NAME!,
  appName: process.env.AGORA_CHAT_APP_NAME!,
};

// Agora Chat REST API endpoint format: /{org_name}/{app_name}
export const agoraChatBaseUrl = `${agoraChatConfig.restUrl}/${agoraChatConfig.orgName}/${agoraChatConfig.appName}`;
