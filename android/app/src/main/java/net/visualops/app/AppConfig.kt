package net.visualops.app

object AppConfig {
    /** Same REST host the web uses. Set in android/local.properties */
    val supabaseUrl: String = BuildConfig.SUPABASE_URL
    val supabaseAnonKey: String = BuildConfig.SUPABASE_ANON_KEY

    val isConfigured: Boolean
        get() = !supabaseUrl.contains("YOUR_PROJECT") && supabaseAnonKey != "YOUR_ANON_KEY"
}
