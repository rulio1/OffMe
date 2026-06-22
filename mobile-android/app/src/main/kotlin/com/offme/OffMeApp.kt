package com.offme

import android.app.Application
import com.offme.data.api.ApiClient
import com.offme.data.auth.AuthStore

class OffMeApp : Application() {
    lateinit var apiClient: ApiClient
        private set

    lateinit var authStore: AuthStore
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        apiClient = ApiClient()
        authStore = AuthStore(apiClient, this)
    }

    companion object {
        lateinit var instance: OffMeApp
            private set
    }
}