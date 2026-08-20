package net.visualops.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update

@Dao
interface SyncJobDao {
    @Insert
    suspend fun insert(job: SyncJob): Long

    @Update
    suspend fun update(job: SyncJob)

    @Query("SELECT * FROM sync_queue ORDER BY createdAt ASC")
    suspend fun pending(): List<SyncJob>

    @Query("DELETE FROM sync_queue WHERE id = :id")
    suspend fun delete(id: Long)
}
