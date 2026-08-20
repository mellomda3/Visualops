package net.visualops.app.data.remote

import net.visualops.app.AppConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

class VisualopsApi(
    private val tokenProvider: () -> String?,
) {
    private val client = OkHttpClient()
    private val json = "application/json".toMediaType()

    fun login(email: String, password: String): JSONObject {
        val body = JSONObject()
            .put("email", email)
            .put("password", password)
            .toString()
            .toRequestBody(json)
        val req = Request.Builder()
            .url("${AppConfig.supabaseUrl}/auth/v1/token?grant_type=password")
            .addHeader("apikey", AppConfig.supabaseAnonKey)
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build()
        return executeObject(req)
    }

    fun get(path: String): JSONArray {
        val req = authed("${AppConfig.supabaseUrl}/rest/v1/$path").get().build()
        return executeArray(req)
    }

    fun post(path: String, body: JSONObject): JSONObject {
        val req = authed("${AppConfig.supabaseUrl}/rest/v1/$path")
            .addHeader("Prefer", "return=representation")
            .post(body.toString().toRequestBody(json))
            .build()
        val arr = executeArray(req)
        return if (arr.length() > 0) arr.getJSONObject(0) else body
    }

    fun patch(path: String, body: JSONObject) {
        val req = authed("${AppConfig.supabaseUrl}/rest/v1/$path")
            .patch(body.toString().toRequestBody(json))
            .build()
        execute(req)
    }

    fun rpc(fn: String, body: JSONObject): String {
        val req = authed("${AppConfig.supabaseUrl}/rest/v1/rpc/$fn")
            .post(body.toString().toRequestBody(json))
            .build()
        return executeString(req).trim('"')
    }

    fun uploadFile(objectPath: String, bytes: ByteArray, mime: String) {
        val req = Request.Builder()
            .url("${AppConfig.supabaseUrl}/storage/v1/object/archivos/$objectPath")
            .addHeader("apikey", AppConfig.supabaseAnonKey)
            .addHeader("Authorization", "Bearer ${tokenProvider() ?: AppConfig.supabaseAnonKey}")
            .addHeader("Content-Type", mime)
            .put(bytes.toRequestBody(mime.toMediaType()))
            .build()
        execute(req)
    }

    private fun authed(url: String): Request.Builder {
        val token = tokenProvider() ?: AppConfig.supabaseAnonKey
        return Request.Builder()
            .url(url)
            .addHeader("apikey", AppConfig.supabaseAnonKey)
            .addHeader("Authorization", "Bearer $token")
    }

    private fun execute(req: Request) {
        client.newCall(req).execute().use { res ->
            if (!res.isSuccessful) error(res.body?.string() ?: res.message)
        }
    }

    private fun executeString(req: Request): String {
        client.newCall(req).execute().use { res ->
            val text = res.body?.string().orEmpty()
            if (!res.isSuccessful) error(text.ifBlank { res.message })
            return text
        }
    }

    private fun executeObject(req: Request): JSONObject = JSONObject(executeString(req))

    private fun executeArray(req: Request): JSONArray {
        val text = executeString(req)
        return if (text.startsWith("[")) JSONArray(text) else JSONArray().put(JSONObject(text))
    }
}
