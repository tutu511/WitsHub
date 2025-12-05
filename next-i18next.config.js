/** @type {import('next-i18next').UserConfig} */
module.exports = {
    i18n: {
        defaultLocale: 'zh-TW',
        locales: ['zh-TW', 'en', 'ja'],
    },
    localePath: typeof window === 'undefined'
        ? require('path').resolve('./locales')
        : '/locales',
};
