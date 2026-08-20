package net.visualops.app.sync

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import net.visualops.app.AppConfig
import net.visualops.app.VisualopsApplication
import net.visualops.app.data.remote.VisualopsApi
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object SessionStore {
    private const val PREFS = "visualops_session"
    private const val KEY_TOKEN = "access_token"

    @Volatile
    var accessToken: String? = null
        private set

    fun init(context: Context) {
        if (accessToken == null) {
            accessToken = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_TOKEN, null)
        }
    }

    fun save(context: Context, token: String) {
        accessToken = token
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_TOKEN, token)
            .apply()
    }

    fun clear(context: Context) {
        accessToken = null
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(KEY_TOKEN)
            .apply()
    }
}

class SyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        if (!AppConfig.isConfigured) return Result.success()
        val dao = (applicationContext as VisualopsApplication).database.syncJobDao()
        val api = VisualopsApi { SessionStore.accessToken }
        val jobs = dao.pending()
        for (job in jobs) {
            try {
                when (job.kind) {
                    "create_record" -> {
                        val payload = JSONObject(job.payloadJson)
                        val nro = api.rpc(
                            "next_ficha_nro",
                            JSONObject().put("p_campaign_id", payload.getString("campaign_id")),
                        )
                        payload.put("ficha_nro", nro)
                        payload.put("status", "precargada")
                        api.post("records", payload)
                    }
                    else -> Unit
                }
                dao.delete(job.id)
            } catch (e: Exception) {
                dao.update(job.copy(attempts = job.attempts + 1, lastError = e.message))
            }
        }
        return Result.success()
    }
}

object SyncScheduler {
    fun enqueue(context: Context) {
        val req = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(
                Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build(),
            )
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "visualops-sync",
            ExistingPeriodicWorkPolicy.KEEP,
            req,
        )
    }
}
