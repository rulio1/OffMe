package com.offme.data.api

sealed class ApiException(message: String) : Exception(message) {
    class Unauthorized : ApiException("Não autenticado")
    class Server(message: String) : ApiException(message)
    class Network(message: String) : ApiException(message)
}