import { defineStore } from 'pinia'
import api from '@/api'

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        config: undefined,
    }),
    actions:{
        async getSetting(){
            let {settings}= await api.getSettings()
            this.config=settings
        }
    }
})