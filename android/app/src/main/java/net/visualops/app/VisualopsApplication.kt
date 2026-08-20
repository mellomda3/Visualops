package net.visualops.app

import android.app.Application
import net.visualops.app.data.local.AppDatabase
import net.visualops.app.sync.SyncScheduler

class VisualopsApplication : Application() {
    lateinit var database: AppDatabase
        private set

    override fun onCreate() {
        super.onCreate()
        database = AppDatabase.build(this)
        SyncScheduler.enqueue(this)
    }
}
