const { withAndroidManifest } = require('@expo/config-plugins');

const withCallKeep = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    const callKeepServices = [
      {
        $: {
          'android:name': 'io.wazo.callkeep.RNCallKeepBackgroundMessagingService',
        },
      },
      {
        $: {
          'android:name': 'io.wazo.callkeep.VoiceConnectionService',
          'android:label': 'Wazo',
          'android:permission': 'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.telecom.ConnectionService',
                },
              },
            ],
          },
        ],
      },
    ];

    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    // Filter out existing ones to prevent duplicates
    const filteredServices = callKeepServices.filter(
      (newService) =>
        !mainApplication.service.some(
          (existingService) =>
            existingService.$['android:name'] === newService.$['android:name']
        )
    );

    mainApplication.service.push(...filteredServices);

    return config;
  });
};

module.exports = withCallKeep;
