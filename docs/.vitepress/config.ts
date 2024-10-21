import { UserConfig, DefaultTheme } from 'vitepress'
import vue from '@vitejs/plugin-vue';

export default {
    title: 'maplugin-vue',
    description: '',
    appearance: 'dark',
    base: '/maplugin-vue/',
    head: [
        [
            'link',
            { rel: 'icon', href: '/logo.svg' }
        ]
    ],
    markdown: {
        lineNumbers: true
    },
    themeConfig: {
        logo: '/logo.svg',
        sidebar: [
            {
                text: "maplibre",
                base: "/sidebar/maplibre",
                items: [
                    { text: '简介', link: "/" },
                    {
                        text: "功能", items: [
                            {text : "测量" , link : "/measure"}
                        ]
                    }
                ]
            }, {
                text: "mapbox",
                base: "/sidebar/mapbox",
                items: [
                    { text: '简介', link: "/" }
                ]
            }
        ],
        socialLinks: [{ icon: 'github', link: "https://github.com/giserver/maplugin-vue" }],
    },
    vue: {
        include: ["../packages/**/*.vue", "**/*.md"]
    },
    vite: {
        'plugins': [vue()]
    }
} as UserConfig<DefaultTheme.Config>