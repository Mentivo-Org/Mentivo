const linking = {
  // Only claim the paths the app actually handles.
  // Other mentivo.in URLs (privacy policy, terms, etc.) will open in the browser.
  prefixes: ['https://mentivo.in', 'http://mentivo.in'],

  // Map the URL paths to your internal screen components
  config: {
    screens: {
        Landing: 'referral/:referral_id'
    },
  },
};

export default linking;