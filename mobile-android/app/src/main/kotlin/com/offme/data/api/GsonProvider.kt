package com.offme.data.api

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import java.lang.reflect.Type

object GsonProvider {
    val gson: Gson = GsonBuilder()
        .registerTypeAdapter(Int::class.javaObjectType, FlexibleIntAdapter())
        .registerTypeAdapter(Int::class.javaPrimitiveType, FlexibleIntAdapter())
        .registerTypeAdapter(Long::class.javaObjectType, FlexibleLongAdapter())
        .registerTypeAdapter(Long::class.javaPrimitiveType, FlexibleLongAdapter())
        .registerTypeAdapter(Boolean::class.javaObjectType, FlexibleBooleanAdapter())
        .registerTypeAdapter(Boolean::class.javaPrimitiveType, FlexibleBooleanAdapter())
        .create()
}

private class FlexibleIntAdapter : JsonDeserializer<Int>, JsonSerializer<Int> {
    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): Int {
        return when {
            json.isJsonNull -> 0
            json.isJsonPrimitive && json.asJsonPrimitive.isNumber -> json.asInt
            json.isJsonPrimitive && json.asJsonPrimitive.isString -> json.asString.toIntOrNull() ?: 0
            else -> 0
        }
    }

    override fun serialize(src: Int, typeOfSrc: Type, context: JsonSerializationContext): JsonElement {
        return JsonPrimitive(src)
    }
}

private class FlexibleLongAdapter : JsonDeserializer<Long>, JsonSerializer<Long> {
    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): Long {
        return when {
            json.isJsonNull -> 0L
            json.isJsonPrimitive && json.asJsonPrimitive.isNumber -> json.asLong
            json.isJsonPrimitive && json.asJsonPrimitive.isString -> json.asString.toLongOrNull() ?: 0L
            else -> 0L
        }
    }

    override fun serialize(src: Long, typeOfSrc: Type, context: JsonSerializationContext): JsonElement {
        return JsonPrimitive(src)
    }
}

private class FlexibleBooleanAdapter : JsonDeserializer<Boolean>, JsonSerializer<Boolean> {
    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): Boolean {
        return when {
            json.isJsonNull -> false
            json.isJsonPrimitive && json.asJsonPrimitive.isBoolean -> json.asBoolean
            json.isJsonPrimitive && json.asJsonPrimitive.isNumber -> json.asInt != 0
            json.isJsonPrimitive && json.asJsonPrimitive.isString -> {
                when (json.asString.lowercase()) {
                    "true", "1", "yes" -> true
                    else -> false
                }
            }
            else -> false
        }
    }

    override fun serialize(src: Boolean, typeOfSrc: Type, context: JsonSerializationContext): JsonElement {
        return JsonPrimitive(src)
    }
}