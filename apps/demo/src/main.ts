import { createApp } from 'vue'
import HeMathEditor from 'he-math-editor'
import App from './App.vue'
import { installDemoMessages } from './i18n'
import './styles/index.scss'

// demo 文案合并进库 i18n 后，整体安装库：自动注册 i18n 与全部组件
installDemoMessages()
createApp(App).use(HeMathEditor).mount('#app')