const linking = {
  // 1. Define the authorized URL prefixes your app handles
  prefixes: ['https://mentivo.in', 'http://mentivo.in'],

  // 2. Map the URL paths to your internal screen components
  config: {
    screens: {
        StudentLogin: 'referral/:referral_id'
    },
  },
};

export default linking;