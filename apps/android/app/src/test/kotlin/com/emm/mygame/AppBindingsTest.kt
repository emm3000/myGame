package com.emm.mygame

import android.content.Context
import android.content.SharedPreferences
import java.io.File
import kotlin.reflect.KClass
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import org.junit.Test
import org.koin.test.verify.verify

class AppBindingsTest {

    @Test
    fun `every constructor parameter of a binding is bound or declared`() {
        appBindings.verify(extraTypes = unboundTypes)
    }
}

private val unboundTypes: List<KClass<*>> = listOf(
    Context::class,
    File::class,
    SharedPreferences::class,
    CoroutineScope::class,
    CoroutineDispatcher::class,
    Function0::class,
    Function1::class,
    Function2::class,
)
