const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }) => ({
  ...config,
  plugins: [
    './app.plugin.js',
    'expo-font',
    'expo-web-browser',
    'expo-router',
    'expo-task-manager',
    'expo-background-fetch',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        sounds: [],
      },
    ],
    'expo-localization',
    [
      'react-native-google-mobile-ads',
      {
        androidAppId:
          process.env.ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713',
        iosAppId:
          process.env.ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511',
      },
    ],
    [
      'react-native-android-widget',
      {
        widgets: [
          {
            name: 'HabitsWidget',
            label: 'Habits',
            minWidth: '110dp',
            minHeight: '110dp',
            targetCellWidth: 2,
            targetCellHeight: 2,
            maxResizeWidth: '500dp',
            maxResizeHeight: '500dp',
            description: 'Streaks, savings and motivation at a glance.',
            resizeMode: 'horizontal|vertical',
            updatePeriodMillis: 1800000,
          },
        ],
      },
    ],
  ],
});
